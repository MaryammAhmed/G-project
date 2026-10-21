# main.py
#
# CyberGuard backend (FastAPI). Top to bottom:
# setup -> password rules -> auth (register/login) -> login OTP + email ->
# AI mentor chat -> scenario feedback -> practice OTP (2FA lab exercise,
# separate from the real login OTP).
#
# One audience: high school students, ages 16-18 (no age tiers).

import os
import random
import re
from datetime import datetime, timedelta

import requests
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db

from typing import Optional                                  # NEW (used by get_current_user)

from fastapi import Depends, FastAPI, Header, HTTPException  # CHANGED: added Header
from jose import JWTError, jwt                               # CHANGED: added JWTError
from pydantic import BaseModel, Field                        # CHANGED: added Field
from models import User, UserProgress                        # CHANGED: added UserProgress

load_dotenv()
app = FastAPI()


# =============================================================
# CORS — allow any localhost / 127.0.0.1 port in development.
# Using a regex avoids having to update this list every time the
# frontend picks a different port.
# =============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================
# HEALTH CHECK — used to confirm the browser can reach this server.
# Hit it from the address bar: http://127.0.0.1:8000/api/health
# =============================================================
@app.get("/api/health")
async def health():
    return {"ok": True, "service": "cyberguard-backend"}


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
SECRET_KEY = os.environ.get("JWT_SECRET_KEY")

AUDIENCE = "a high school student (ages 16-18)"


# =============================================================
# PASSWORD STRENGTH (used at registration)
# =============================================================

COMMON_WEAK_PASSWORDS = {"123", "password", "12345678", "qwerty", "letmein", "admin123"}
PASSWORD_RULES = [
    (r".{8,}", "Password must be at least 8 characters long."),
    (r"[A-Z]", "Password must contain an uppercase letter."),
    (r"[a-z]", "Password must contain a lowercase letter."),
    (r"\d", "Password must contain a number."),
    (r"[@#$%!^&*]", "Password must contain a special character (@#$%!^&*)."),
]


def validate_password_strength(password: str) -> None:
    for pattern, message in PASSWORD_RULES:
        if not re.search(pattern, password):
            raise ValueError(message)
    if password.lower() in COMMON_WEAK_PASSWORDS:
        raise ValueError("This password is too common — choose something less predictable.")


# =============================================================
# AUTH (register, login; login triggers OTP, no token yet)
# =============================================================

class RegisterPayload(BaseModel):
    username: str
    email: str
    password: str


@app.post("/api/register")
async def register(payload: RegisterPayload, db: AsyncSession = Depends(get_db)):
    if await db.scalar(select(User).where(User.username == payload.username)):
        raise HTTPException(status_code=409, detail="Username already taken")

    try:
        validate_password_strength(payload.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=pwd_context.hash(payload.password),
    )
    db.add(user)
    await db.commit()
    return {"status": "ok", "message": f"Clearance granted, Agent {user.username} — welcome to CyberGuard."}


class LoginPayload(BaseModel):
    username: str
    password: str


@app.post("/api/login")
async def login(payload: LoginPayload, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.username == payload.username))
    if not user or not pwd_context.verify(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    await generate_and_send_otp(user, db)
    return {"otp_required": True, "username": user.username}


# =============================================================
# EMAIL (Brevo) + REAL LOGIN OTP
# =============================================================

BREVO_API_KEY = os.environ.get("BREVO_API_KEY")
BREVO_SENDER_EMAIL = os.environ.get("BREVO_SENDER_EMAIL")


def send_brevo_email(to_email: str, sender_name: str, subject: str, html: str) -> None:
    response = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={"api-key": BREVO_API_KEY, "Content-Type": "application/json"},
        json={
            "sender": {"email": BREVO_SENDER_EMAIL, "name": sender_name},
            "to": [{"email": to_email}],
            "subject": subject,
            "htmlContent": html,
        },
    )
    if response.status_code != 201:
        raise Exception(f"Email send failed: {response.text}")


def send_otp_email(to_email: str, otp_code: str) -> None:
    send_brevo_email(
        to_email,
        "CyberGuard Security",
        "🛡️ CyberGuard — Your Login Verification Code",
        "<p>Hello Agent,</p>"
        "<p>Here is your secure authentication code to access your CyberGuard terminal:</p>"
        f"<p style='font-size:24px;font-weight:bold;color:#800020;'>{otp_code}</p>"
        "<p>Enter this code in the login portal to proceed. Expires in 5 minutes.</p>",
    )


async def generate_and_send_otp(user: User, db: AsyncSession) -> None:
    otp_code = str(random.randint(100000, 999999))
    user.otp_code_hash = pwd_context.hash(otp_code)
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=5)
    await db.commit()
    send_otp_email(user.email, otp_code)


class OtpVerifyPayload(BaseModel):
    username: str
    code: str


@app.post("/api/verify-otp")
async def verify_otp(payload: OtpVerifyPayload, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.username == payload.username))
    if not user or not user.otp_code_hash:
        raise HTTPException(status_code=400, detail="No OTP pending for this account")
    if datetime.utcnow() > user.otp_expires_at:
        raise HTTPException(status_code=400, detail="OTP expired, please request a new one")
    if not pwd_context.verify(payload.code, user.otp_code_hash):
        raise HTTPException(status_code=400, detail="Incorrect code")

    user.otp_code_hash = None
    user.otp_expires_at = None
    await db.commit()

    token = jwt.encode(
        {"sub": str(user.id), "exp": datetime.utcnow() + timedelta(hours=12)},
        SECRET_KEY,
        algorithm="HS256",
    )
    return {"status": "ok", "token": token, "email": user.email}


class ResendOtpPayload(BaseModel):
    username: str


@app.post("/api/resend-otp")
async def resend_otp(payload: ResendOtpPayload, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.username == payload.username))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await generate_and_send_otp(user, db)
    return {"message": "A new code has been sent"}


# =============================================================
# AI MENTOR (shared module data + /api/chat)
# =============================================================

MODULE_STANDARDS = {
    1: "NIST SP 800-63B (Digital Identity Guidelines — memorized secrets and authentication)",
    2: "CISA Secure Our World (phishing recognition and reporting guidance)",
    3: "CISA Social Engineering Awareness guidance",
    4: "OWASP Top 10 for Large Language Model Applications",
}

MODULE_CORE_GUIDANCE = {
    1: "Length is the primary driver of password strength, not symbol complexity. "
       "NIST explicitly does NOT require mixed character types or forced complexity rules — "
       "a long passphrase (15+ characters) is stronger and easier to remember than a short complex password.",
    2: "Phishing relies on urgency and impersonation. Verify sender addresses and links before clicking, "
       "and report suspicious messages rather than just deleting them.",
    3: "Social engineering exploits trust and authority, not technical vulnerabilities. "
       "Always verify unusual requests through a separate, known communication channel.",
    4: "Never share sensitive personal, financial, or proprietary data with an AI system, "
       "and treat AI-generated output as unverified until checked against a reliable source.",
}


def module_context(module: int) -> dict:
    return {
        "audience": AUDIENCE,
        "module": module,
        "standard": MODULE_STANDARDS.get(module, "recognized cybersecurity best practices"),
        "core_guidance": MODULE_CORE_GUIDANCE.get(module, "Follow general cybersecurity best practices."),
    }


SYSTEM_PROMPT_TEMPLATE = """You are the CyberGuard AI Mentor, speaking to {audience}
training in cybersecurity awareness. This conversation is part of Module {module},
which is grounded in {standard}.

The correct guidance for this module is: {core_guidance}

Your feedback style:
- Open with a concrete consequence or fact (a number, timeframe, or real outcome).
  Only use a specific statistic if you are certain it is accurate — otherwise
  describe the risk qualitatively instead of inventing a number.
- Your explanation MUST match the correct guidance above exactly — do not state
  a rule that contradicts it
- Ground your explanation in {standard} specifically — do not cite other standards
  bodies for this module
- Explain the underlying mechanism — why this matters, not just what to do
- Never be condescending; treat the user as capable of understanding real technical detail
- Keep examples relatable to a teenager's world (school, games, social media)
- Keep responses to a MAXIMUM of 3 sentences

Respond to the user's specific message or decision below, addressing what they
actually did, not a generic script."""


def build_system_prompt(module: int) -> str:
    return SYSTEM_PROMPT_TEMPLATE.format(**module_context(module))


class ChatPayload(BaseModel):
    message: str
    module: int


@app.post("/api/chat")
async def chat(payload: ChatPayload):
    response = groq_client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {"role": "system", "content": build_system_prompt(payload.module)},
            {"role": "user", "content": payload.message},
        ],
    )
    return {"reply": response.choices[0].message.content}


# =============================================================
# SCENARIO FEEDBACK (after each in-game choice)
# =============================================================

SCENARIO_FEEDBACK_PROMPT_TEMPLATE = """You are the CyberGuard AI Mentor reacting to the in-game decision of
{audience} during Module {module}, grounded in {standard}.

The correct guidance for this module is: {core_guidance}

The scenario situation was: {incident}
The player chose: {choice_text}
This choice was: {verdict_label}

Respond in EXACTLY 2 sentences, no more than 35 words total, no exceptions:
- Sentence 1: the concrete consequence of this specific choice
- Sentence 2: the security principle behind it, matching the correct guidance above exactly

No greeting, no markdown, no hedging."""


def build_scenario_feedback_prompt(module: int, incident: str, choice_text: str, correct: bool) -> str:
    return SCENARIO_FEEDBACK_PROMPT_TEMPLATE.format(
        **module_context(module),
        incident=incident,
        choice_text=choice_text,
        verdict_label="the correct/safe choice" if correct else "an unsafe choice",
    )


class ScenarioFeedbackPayload(BaseModel):
    module: int
    incident: str
    choice_text: str
    correct: bool


REFUSAL_MARKERS = ["i'm sorry", "i am sorry", "can't comply", "cannot comply", "i cannot assist", "i can't assist"]


def looks_like_refusal(text: str) -> bool:
    lowered = (text or "").strip().lower()
    return len(lowered) == 0 or any(marker in lowered for marker in REFUSAL_MARKERS)


@app.post("/api/scenario-feedback")
async def scenario_feedback(payload: ScenarioFeedbackPayload):
    prompt = build_scenario_feedback_prompt(
        payload.module, payload.incident, payload.choice_text, payload.correct
    )
    messages = [
        {"role": "system", "content": prompt},
        {"role": "user", "content": "Give the feedback now."},
    ]

    for _ in range(2):
        response = groq_client.chat.completions.create(
            model="openai/gpt-oss-20b",
            max_tokens=400,
            reasoning_effort="low",
            messages=messages,
        )
        content = response.choices[0].message.content
        if not looks_like_refusal(content):
            return {"feedback": content}

    return {"feedback": "This choice has real security consequences — consider how it affects account safety and apply the standard's guidance here."}


# =============================================================
# PRACTICE OTP (in-mission 2FA exercise, NOT the real login)
# =============================================================

practice_otp_store: dict[str, dict] = {}


def send_practice_otp_email(to_email: str, otp_code: str) -> None:
    send_brevo_email(
        to_email,
        "CyberGuard Mentor",
        "🛰️ CyberGuard Training — Your Practice Verification Code",
        "<p>This is your CyberGuard mentor.</p>"
        "<p>Here's the practice verification code for this mission's 2FA exercise:</p>"
        f"<p style='font-size:24px;font-weight:bold;'>{otp_code}</p>"
        "<p>Enter it in the mission to confirm 2FA is working. Expires in 5 minutes.</p>",
    )


class PracticeOtpSendPayload(BaseModel):
    email: str


@app.post("/api/practice-otp/send")
async def practice_otp_send(payload: PracticeOtpSendPayload):
    otp_code = str(random.randint(100000, 999999))
    practice_otp_store[payload.email] = {
        "hash": pwd_context.hash(otp_code),
        "expires": datetime.utcnow() + timedelta(minutes=5),
    }
    send_practice_otp_email(payload.email, otp_code)
    return {"status": "sent"}


class PracticeOtpVerifyPayload(BaseModel):
    email: str
    code: str


@app.post("/api/practice-otp/verify")
async def practice_otp_verify(payload: PracticeOtpVerifyPayload):
    entry = practice_otp_store.get(payload.email)
    if not entry:
        raise HTTPException(status_code=400, detail="No practice code pending — request one first")
    if datetime.utcnow() > entry["expires"]:
        raise HTTPException(status_code=400, detail="Code expired")

    correct = pwd_context.verify(payload.code, entry["hash"])
    if correct:
        practice_otp_store.pop(payload.email, None)
    return {"correct": correct}
# =============================================================
# PROGRESS TRACKING + MODULE GATING (NEW)
#
# Report requirements covered:
#   - save completion status and scores in PostgreSQL
#   - keep completion logs (completed_at, attempts)
#   - restrict access until the previous scenario is finished (sequential unlock)
#
# RULE: module 1 (The Vault) is always open. Module N unlocks only after module N-1
# is completed. The SERVER enforces this, so editing the browser can't skip ahead.
#
# KNOWN LIMIT: the score is reported by the browser, so a determined user could fake
# it. That's fine for a learning game (the field is capped below); don't use it for grading.
# =============================================================

# Which mission id belongs to which module (must match mission.id in the frontend files).
MODULE_SCENARIOS = {1: "vault", 2: "spot-the-phish", 3: "social-engineering", 4: "safe-ai"}


async def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Reads 'Authorization: Bearer <token>' (the JWT from /api/verify-otp) and returns the user."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ", 1)[1].strip()
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = int(data["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def unlocked_modules(done: set) -> list:
    """Module 1 is always open; module N opens when module N-1 is completed."""
    return [1] + [m for m in (2, 3, 4) if (m - 1) in done]


async def load_progress(db: AsyncSession, user_id: int) -> list:
    result = await db.scalars(select(UserProgress).where(UserProgress.user_id == user_id))
    return list(result.all())


def progress_snapshot(rows: list) -> dict:
    """The shape the frontend map and mission pages read."""
    by_module = {r.module: r for r in rows}
    done = {m for m, r in by_module.items() if r.completed}
    unlocked = unlocked_modules(done)
    modules = []
    for m in (1, 2, 3, 4):
        r = by_module.get(m)
        modules.append({
            "module": m,
            "scenario": MODULE_SCENARIOS[m],
            "completed": bool(r and r.completed),
            "best_score": r.best_score if r else 0,
            "attempts": r.attempts if r else 0,
            "unlocked": m in unlocked,
        })
    return {"modules": modules, "unlocked": unlocked, "total_score": sum(x["best_score"] for x in modules)}


class ProgressStartPayload(BaseModel):
    module: int = Field(ge=1, le=4)
    scenario: str


class ProgressCompletePayload(ProgressStartPayload):
    score: int = Field(ge=0, le=5000)   # capped so a faked score can't be absurd


def check_module_request(module: int, scenario: str, rows: list) -> None:
    """Shared guard: the scenario must match the module, and the module must be unlocked."""
    if MODULE_SCENARIOS.get(module) != scenario:
        raise HTTPException(status_code=400, detail="Scenario does not match module")
    done = {r.module for r in rows if r.completed}
    if module not in unlocked_modules(done):
        raise HTTPException(status_code=403, detail="Module locked: finish the previous module first")


async def get_or_create_row(db: AsyncSession, rows: list, user: User, module: int, scenario: str) -> UserProgress:
    for r in rows:
        if r.module == module:
            return r
    row = UserProgress(user_id=user.id, module=module, scenario=scenario)
    db.add(row)
    rows.append(row)
    return row


@app.get("/api/progress")
async def get_progress(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """What the map page reads: every module's status, best score and whether it's unlocked."""
    return progress_snapshot(await load_progress(db, user.id))


@app.post("/api/progress/start")
async def progress_start(
    payload: ProgressStartPayload,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Called when a mission opens. 403 if the module is still locked; otherwise counts one attempt."""
    rows = await load_progress(db, user.id)
    check_module_request(payload.module, payload.scenario, rows)
    row = await get_or_create_row(db, rows, user, payload.module, payload.scenario)
    row.attempts = (row.attempts or 0) + 1
    await db.commit()
    return {"allowed": True, "attempts": row.attempts}


@app.post("/api/progress/complete")
async def progress_complete(
    payload: ProgressCompletePayload,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Called on the mission's final beat. Marks it complete, keeps the best score, and returns the new unlocks."""
    rows = await load_progress(db, user.id)
    check_module_request(payload.module, payload.scenario, rows)
    row = await get_or_create_row(db, rows, user, payload.module, payload.scenario)
    row.completed = True
    row.last_score = payload.score
    row.best_score = max(row.best_score or 0, payload.score)
    if row.completed_at is None:
        row.completed_at = datetime.utcnow()      # the completion log: first completion time
    await db.commit()
    return progress_snapshot(rows)

# =============================================================
# SWAGGER UI CONFIGURATION (Enables the Authorize button in /docs)
# This does NOT change how your app works, it just tells the Swagger 
# UI to show the green padlock so you can paste your token.
# =============================================================
from fastapi.openapi.utils import get_openapi

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="CyberGuard API",
        version="1.0.0",
        description="API for the CyberGuard game",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    for path in openapi_schema["paths"]:
        for method in openapi_schema["paths"][path]:
            if path.startswith("/api/progress") or path.startswith("/api/user"):
                openapi_schema["paths"][path][method]["security"] = [{"BearerAuth": []}]
                
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
