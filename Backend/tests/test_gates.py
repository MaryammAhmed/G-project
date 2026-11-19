"""
Security and level-gate checks.

These do not use the production database. Missing settings are tested in a
fresh process. Route and 403 checks override the database dependency.
"""

import os
import subprocess
import sys
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-for-gates")
os.environ.setdefault("GROQ_API_KEY", "test")

import main  # noqa: E402
from main import app, get_current_user, get_db, note_otp_failure  # noqa: E402


def test_email_sender_reports_missing_brevo_settings(monkeypatch):
    monkeypatch.setattr(main, "BREVO_API_KEY", None)
    monkeypatch.setattr(main, "BREVO_SENDER_EMAIL", None)

    with pytest.raises(HTTPException) as error:
        main.send_brevo_email("student@example.com", "CyberGuard", "Test", "Test")

    assert error.value.status_code == 503


def test_email_sender_reports_brevo_rejections(monkeypatch):
    monkeypatch.setattr(main, "BREVO_API_KEY", "test-key")
    monkeypatch.setattr(main, "BREVO_SENDER_EMAIL", "sender@example.com")
    monkeypatch.setattr(main.requests, "post", lambda *args, **kwargs: SimpleNamespace(status_code=401))

    with pytest.raises(HTTPException) as error:
        main.send_brevo_email("student@example.com", "CyberGuard", "Test", "Test")

    assert error.value.status_code == 502


def test_email_sender_reports_network_failures_with_timeout(monkeypatch):
    monkeypatch.setattr(main, "BREVO_API_KEY", "test-key")
    monkeypatch.setattr(main, "BREVO_SENDER_EMAIL", "sender@example.com")

    def fail_request(*args, **kwargs):
        assert kwargs["timeout"] == 10
        raise main.requests.Timeout()

    monkeypatch.setattr(main.requests, "post", fail_request)

    with pytest.raises(HTTPException) as error:
        main.send_brevo_email("student@example.com", "CyberGuard", "Test", "Test")

    assert error.value.status_code == 502


def test_otp_locks_on_fifth_miss():
    attempts, locked = note_otp_failure(4)
    assert attempts == 5
    assert locked is True
    attempts, locked = note_otp_failure(1)
    assert locked is False


def test_missing_database_url_refuses_to_start():
    env = os.environ.copy()
    env["DATABASE_URL"] = ""
    env["JWT_SECRET_KEY"] = "present"
    result = subprocess.run(
        [sys.executable, "-c", "import database"],
        cwd=BACKEND,
        env=env,
        capture_output=True,
        text=True,
    )
    assert result.returncode != 0
    assert "DATABASE_URL" in (result.stderr + result.stdout)


def test_missing_jwt_refuses_to_start():
    env = os.environ.copy()
    env["JWT_SECRET_KEY"] = ""
    result = subprocess.run(
        [sys.executable, "-c", "import main"],
        cwd=BACKEND,
        env=env,
        capture_output=True,
        text=True,
    )
    assert result.returncode != 0
    assert "JWT_SECRET_KEY" in (result.stderr + result.stdout)


def test_one_chat_and_one_feedback_route():
    paths = [getattr(route, "path", "") for route in app.routes]
    assert paths.count("/api/chat") == 1
    assert paths.count("/api/scenario-feedback") == 1


@pytest.fixture
def client():
    async def fake_db():
        yield SimpleNamespace()

    app.dependency_overrides[get_db] = fake_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_tts_returns_a_wav_without_a_login(client, monkeypatch):
    monkeypatch.setattr(main, "synthesize_piper", lambda text: b"RIFF" + b"\x00" * 44)
    response = client.post("/api/tts", json={"text": "The portal address is the one you already know."})
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("audio/wav")
    assert response.content.startswith(b"RIFF")


def test_tts_generates_wav_with_the_bundled_piper_voice(client, monkeypatch):
    model = os.path.join(BACKEND, "voices", "en_US-lessac-medium.onnx")
    monkeypatch.setenv("PIPER_MODEL", model)
    monkeypatch.setattr(main, "_piper_voice", None)

    response = client.post("/api/tts", json={"text": "Piper deployment check."})

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("audio/wav")
    assert response.content[:4] == b"RIFF"
    assert response.content[8:12] == b"WAVE"


def test_sensitive_routes_require_a_token(client):
    bodies = {
        "/api/chat": {"message": "hi", "module": 1},
        "/api/scenario-feedback": {"module": 1, "incident": "x", "choice_text": "y", "correct": True},
        "/api/oracle-lab/rules-bot": {"message": "hi", "history": [], "patched": True},
        "/api/practice-otp/send": {},
    }
    for path, body in bodies.items():
        response = client.post(path, json=body)
        assert response.status_code == 401, path


def test_level_two_is_locked_until_level_one_is_done(client, monkeypatch):
    async def no_rows(db, user_id):
        return []

    async def fake_user():
        return SimpleNamespace(id=1, email="student@example.com")

    monkeypatch.setattr(main, "load_progress", no_rows)
    app.dependency_overrides[get_current_user] = fake_user
    response = client.post(
        "/api/progress/start",
        json={"module": 1, "scenario": "vault", "level": 2},
        headers={"Authorization": "Bearer test"},
    )
    assert response.status_code == 403

    response = client.post(
        "/api/progress/start",
        json={"module": 2, "scenario": "spot-the-phish", "level": 1},
        headers={"Authorization": "Bearer test"},
    )
    assert response.status_code == 403


def test_admin_can_open_a_later_realm(client, monkeypatch):
    async def no_rows(db, user_id):
        return []

    async def admin():
        return SimpleNamespace(id=1, email="admin@example.com", is_admin=True)

    monkeypatch.setattr(main, "load_progress", no_rows)
    app.dependency_overrides[get_current_user] = admin
    response = client.get("/api/progress", headers={"Authorization": "Bearer test"})
    assert response.status_code == 200
def test_chat_endpoint_returns_reply_and_source(client, monkeypatch):
    async def fake_user():
        return SimpleNamespace(id=1, username="agent1")
    app.dependency_overrides[get_current_user] = fake_user

    class FakeMessage:
        content = "Use passphrases of at least 15 characters."

    class FakeChoice:
        message = FakeMessage()

    class FakeCompletions:
        def create(self, **kwargs):
            return SimpleNamespace(choices=[FakeChoice()])

    class FakeGroq:
        chat = SimpleNamespace(completions=FakeCompletions())

    monkeypatch.setattr(main, "groq_client", FakeGroq())

    response = client.post(
        "/api/chat",
        json={"message": "What is a recovery code?", "module": 1, "history": [{"role": "user", "content": "hi"}]},
        headers={"Authorization": "Bearer test"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "source" in data
    assert "NIST" in data["source"]


def test_chat_endpoint_graceful_fallback_on_groq_error(client, monkeypatch):
    async def fake_user():
        return SimpleNamespace(id=1, username="agent1")
    app.dependency_overrides[get_current_user] = fake_user

    class BrokenGroq:
        class chat:
            class completions:
                @staticmethod
                def create(**kwargs):
                    raise RuntimeError("Groq offline")

    monkeypatch.setattr(main, "groq_client", BrokenGroq())

    response = client.post(
        "/api/chat",
        json={"message": "What is 2FA?", "module": 1},
        headers={"Authorization": "Bearer test"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "trouble connecting" in data["reply"]
    assert "source" in data


# =============================================================
# PASSWORD RESET (forgot password / reset password flow)
# =============================================================

from datetime import datetime as _dt, timedelta as _td


def _make_reset_user(email="student@example.com", otp_code="123456"):
    from main import pwd_context
    user = SimpleNamespace(
        id=1,
        username="testuser",
        email=email,
        hashed_password=pwd_context.hash("OldPassw0rd!"),
        otp_code_hash=None,
        otp_expires_at=None,
        otp_attempts=0,
        is_admin=False,
        reset_otp_code_hash=pwd_context.hash(otp_code),
        reset_otp_expires_at=_dt.utcnow() + _td(minutes=10),
    )
    return user


def _override_db_with_user(monkeypatch, user):
    async def fake_db():
        db = SimpleNamespace()
        async def fake_scalar(q):
            return user
        async def fake_commit():
            return None
        db.scalar = fake_scalar
        db.commit = fake_commit
        yield db
    app.dependency_overrides[get_db] = fake_db


def test_database_url_preserves_strict_ssl_modes():
    import database
    cases = [
        ("postgres://u:p@host/db?sslmode=verify-full", "ssl=verify-full"),
        ("postgres://u:p@host/db?sslmode=verify-ca", "ssl=verify-ca"),
        ("postgres://u:p@host/db?sslmode=require", "ssl=require"),
    ]
    for url, want in cases:
        got = database.to_async_url(url)
        assert want in got, got
    # disable and missing sslmode must not force ssl on
    assert "ssl=" not in database.to_async_url("postgres://u:p@host/db?sslmode=disable")
    assert "ssl=" not in database.to_async_url("postgres://u:p@host/db")
    # channel_binding is a libpq concept asyncpg does not take
    assert "channel_binding" not in database.to_async_url(
        "postgres://u:p@host/db?sslmode=require&channel_binding=require"
    )


def test_otp_resend_does_not_reset_failed_guess_budget(client, monkeypatch):
    user = _make_reset_user()
    from main import pwd_context as _pwd
    user.otp_code_hash = _pwd.hash("111111")
    user.otp_expires_at = _dt.utcnow() + _td(minutes=5)
    user.otp_attempts = 4  # one wrong guess away from lockout

    async def fake_db():
        db = SimpleNamespace()
        async def fake_scalar(q):
            return user
        async def fake_commit():
            return None
        db.scalar = fake_scalar
        db.commit = fake_commit
        yield db

    app.dependency_overrides[get_db] = fake_db
    monkeypatch.setattr(main, "send_otp_email", lambda *a, **k: None)

    response = client.post("/api/resend-otp", json={"username": "testuser"})
    assert response.status_code == 200
    # The failed-guess budget must survive a resend, or an attacker gets 5 fresh
    # guesses per code forever.
    assert user.otp_attempts == 4


def test_verify_otp_serializes_attempts_with_a_row_lock(client, monkeypatch):
    user = _make_reset_user()
    from main import pwd_context as _pwd
    user.otp_code_hash = _pwd.hash("123456")
    user.otp_expires_at = _dt.utcnow() + _td(minutes=5)

    captured = {}

    async def fake_db():
        db = SimpleNamespace()
        async def fake_scalar(q):
            captured["sql"] = str(q)
            return user
        async def fake_commit():
            return None
        db.scalar = fake_scalar
        db.commit = fake_commit
        yield db

    app.dependency_overrides[get_db] = fake_db

    client.post("/api/verify-otp", json={"username": "testuser", "code": "123456"})
    assert "FOR UPDATE" in captured["sql"].upper(), captured["sql"]


def test_reset_password_serializes_verification_with_a_row_lock(client, monkeypatch):
    user = _make_reset_user(otp_code="123456")

    captured = {}

    async def fake_db():
        db = SimpleNamespace()
        async def fake_scalar(q):
            captured["sql"] = str(q)
            return user
        async def fake_commit():
            return None
        db.scalar = fake_scalar
        db.commit = fake_commit
        yield db

    app.dependency_overrides[get_db] = fake_db

    client.post(
        "/api/auth/reset-password",
        json={"email": "student@example.com", "otp_code": "123456", "new_password": "NewStr0ng!Pass"},
    )
    assert "FOR UPDATE" in captured["sql"].upper(), captured["sql"]


def test_forgot_password_sends_otp_for_existing_email(client, monkeypatch):
    user = _make_reset_user()
    sent = {}

    async def fake_generate_reset_otp(u, db):
        sent["email"] = u.email
        sent["called"] = True

    _override_db_with_user(monkeypatch, user)
    monkeypatch.setattr(main, "generate_and_send_reset_otp", fake_generate_reset_otp)

    response = client.post("/api/auth/forgot-password", json={"email": "student@example.com"})
    assert response.status_code == 200
    body = response.json()
    assert body["message"] == "If that account exists, a reset code has been sent"
    assert sent.get("called") is True


def test_forgot_password_same_message_for_unknown_email(client, monkeypatch):
    async def fake_generate_reset_otp(u, db):
        raise AssertionError("should not be called")

    _override_db_with_user(monkeypatch, None)
    monkeypatch.setattr(main, "generate_and_send_reset_otp", fake_generate_reset_otp)

    response = client.post("/api/auth/forgot-password", json={"email": "nobody@example.com"})
    assert response.status_code == 200
    assert response.json()["message"] == "If that account exists, a reset code has been sent"


def test_reset_password_succeeds_with_valid_otp(client, monkeypatch):
    user = _make_reset_user(otp_code="654321")

    _override_db_with_user(monkeypatch, user)

    response = client.post(
        "/api/auth/reset-password",
        json={"email": "student@example.com", "otp_code": "654321", "new_password": "NewStr0ng!Pass"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "Password reset successful" in body["message"]
    # The OTP fields should be cleared after a successful reset
    assert user.reset_otp_code_hash is None
    assert user.reset_otp_expires_at is None


def test_reset_password_rejects_wrong_otp(client, monkeypatch):
    user = _make_reset_user(otp_code="111111")

    _override_db_with_user(monkeypatch, user)

    response = client.post(
        "/api/auth/reset-password",
        json={"email": "student@example.com", "otp_code": "999999", "new_password": "NewStr0ng!Pass"},
    )
    assert response.status_code == 400
    assert "Incorrect reset code" in response.json()["detail"]


def test_reset_password_rejects_expired_otp(client, monkeypatch):
    user = _make_reset_user(otp_code="123456")
    user.reset_otp_expires_at = _dt.utcnow() - _td(minutes=1)

    _override_db_with_user(monkeypatch, user)

    response = client.post(
        "/api/auth/reset-password",
        json={"email": "student@example.com", "otp_code": "123456", "new_password": "NewStr0ng!Pass"},
    )
    assert response.status_code == 400
    assert "expired" in response.json()["detail"].lower()


def test_reset_password_rejects_weak_new_password(client, monkeypatch):
    user = _make_reset_user(otp_code="123456")

    _override_db_with_user(monkeypatch, user)

    response = client.post(
        "/api/auth/reset-password",
        json={"email": "student@example.com", "otp_code": "123456", "new_password": "weak"},
    )
    assert response.status_code == 400
    assert "Password must be" in response.json()["detail"]


def test_reset_password_rejects_when_no_pending_reset(client, monkeypatch):
    user = _make_reset_user()
    user.reset_otp_code_hash = None
    user.reset_otp_expires_at = None

    _override_db_with_user(monkeypatch, user)

    response = client.post(
        "/api/auth/reset-password",
        json={"email": "student@example.com", "otp_code": "123456", "new_password": "NewStr0ng!Pass"},
    )
    assert response.status_code == 400
    assert "No reset code pending" in response.json()["detail"]
