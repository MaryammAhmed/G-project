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
from fastapi.testclient import TestClient

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-for-gates")
os.environ.setdefault("GROQ_API_KEY", "test")

import main  # noqa: E402
from main import app, get_current_user, get_db, note_otp_failure  # noqa: E402


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
    body = response.json()
    assert body["unlocked"] == [1, 2, 3, 4]
    assert all(level["unlocked"] for level in body["levels"])
    assert not any(module["completed"] for module in body["modules"])
