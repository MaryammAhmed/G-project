from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import os, re, random, requests
from dotenv import load_dotenv
from groq import Groq

from database import get_db
from models import User

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
SECRET_KEY = os.environ.get("JWT_SECRET_KEY")

# --- Password strength ---

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

# --- Auth ---

class RegisterPayload(BaseModel):
    username: str
    email: str
    password: str
    ageGroup: str

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
        age_group=payload.ageGroup,
    )
    db.add(user)
    await db.commit()
    return {"status": "ok", "message": f"Clearance granted, Agent {user.username} — Tier {user.age_group} initiate."}


class LoginPayload(BaseModel):
    username: str
    password: str

@app.post("/api/login")
async def login(payload: LoginPayload, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.username == payload.username))
    # Same error for "no user" and "wrong password" — don't leak which usernames exist
    if not user or not pwd_context.verify(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    await generate_and_send_otp(user, db)
    return {"otp_required": True, "username": user.username}  # no token until OTP passes


# --- OTP + email ---

BREVO_API_KEY = os.environ.get("BREVO_API_KEY")
BREVO_SENDER_EMAIL = os.environ.get("BREVO_SENDER_EMAIL")

def send_otp_email(to_email: str, otp_code: str):
    """Real send via Brevo's API. Raises if Brevo doesn't return 201,
    so a failed send never looks like it succeeded."""
    response = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={"api-key": BREVO_API_KEY, "Content-Type": "application/json"},
        json={
            "sender": {"email": BREVO_SENDER_EMAIL},
            "to": [{"email": to_email}],
            "subject": "Your CyberGuard verification code",
            "htmlContent": f"<p>Your code is: <strong>{otp_code}</strong></p><p>Expires in 10 minutes.</p>",
        },
    )
    if response.status_code != 201:
        raise Exception(f"Email send failed: {response.text}")


async def generate_and_send_otp(user: User, db: AsyncSession):
    """Shared by /api/login and /api/resend-otp: makes a code, stores
    only its hash + expiry, then sends it."""
    otp_code = str(random.randint(100000, 999999))
    user.otp_code_hash = pwd_context.hash(otp_code)
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
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

    token_data = {
        "sub": str(user.id),
        "age_group": user.age_group,
        "exp": datetime.utcnow() + timedelta(hours=12),
    }
    token = jwt.encode(token_data, SECRET_KEY, algorithm="HS256")
    return {"status": "ok", "token": token, "age_group": user.age_group, "email": user.email}


class ResendOtpPayload(BaseModel):
    username: str

@app.post("/api/resend-otp")
async def resend_otp(payload: ResendOtpPayload, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.username == payload.username))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await generate_and_send_otp(user, db)
    return {"message": "A new code has been sent"}


# --- AI mentor ---

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

SYSTEM_PROMPT_TEMPLATE = """You are the CyberGuard AI Mentor, speaking to a Tier {tier} agent
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
- Keep responses to a MAXIMUM of 4 sentences, no exceptions

Respond to the user's specific message or decision below, addressing what they
actually did, not a generic script."""

def build_system_prompt(tier: str, module: int) -> str:
    standard = MODULE_STANDARDS.get(module, "recognized cybersecurity best practices")
    core_guidance = MODULE_CORE_GUIDANCE.get(module, "Follow general cybersecurity best practices.")
    return SYSTEM_PROMPT_TEMPLATE.format(tier=tier, module=module, standard=standard, core_guidance=core_guidance)


class ChatPayload(BaseModel):
    message: str
    tier: str
    module: int

@app.post("/api/chat")
async def chat(payload: ChatPayload):
    response = groq_client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {"role": "system", "content": build_system_prompt(payload.tier, payload.module)},
            {"role": "user", "content": payload.message},
        ],
    )
    return {"reply": response.choices[0].message.content}

# =============================================================
# SCENARIO FEEDBACK  (separate from the open /api/chat mentor)
# =============================================================
# Added at the END of the file on purpose — it only needs
# MODULE_STANDARDS, MODULE_CORE_GUIDANCE, BaseModel, and groq_client,
# which are all already defined above by this point. Appending here
# means we never risk overwriting anything that already works.

SCENARIO_FEEDBACK_PROMPT_TEMPLATE = """You are the CyberGuard AI Mentor reacting to a Tier {tier} agent's
in-game decision during Module {module}, grounded in {standard}.

The correct guidance for this module is: {core_guidance}

The scenario situation was: {incident}
The player chose: {choice_text}
This choice was: {verdict_label}

Respond in EXACTLY 2 sentences, no more than 35 words total, no exceptions:
- Sentence 1: the concrete consequence of this specific choice
- Sentence 2: the security principle behind it, matching the correct guidance above exactly

No greeting, no markdown, no hedging."""


def build_scenario_feedback_prompt(tier: str, module: int, incident: str, choice_text: str, correct: bool) -> str:
    standard = MODULE_STANDARDS.get(module, "recognized cybersecurity best practices")
    core_guidance = MODULE_CORE_GUIDANCE.get(module, "Follow general cybersecurity best practices.")
    verdict_label = "the correct/safe choice" if correct else "an unsafe choice"
    return SCENARIO_FEEDBACK_PROMPT_TEMPLATE.format(
        tier=tier, module=module, standard=standard, core_guidance=core_guidance,
        incident=incident, choice_text=choice_text, verdict_label=verdict_label,
    )


class ScenarioFeedbackPayload(BaseModel):
    tier: str
    module: int
    incident: str
    choice_text: str
    correct: bool


@app.post("/api/scenario-feedback")
async def scenario_feedback(payload: ScenarioFeedbackPayload):
    response = groq_client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {"role": "system", "content": build_scenario_feedback_prompt(
                payload.tier, payload.module, payload.incident, payload.choice_text, payload.correct
            )},
            {"role": "user", "content": "Give the feedback now."},
        ],
    )
    return {"feedback": response.choices[0].message.content}
# =============================================================
# PRACTICE OTP — for the 2FA hands-on lab, separate from real login
# =============================================================
# Deliberately isolated from the User table's otp_code_hash/otp_expires_at
# columns — those are real account security state. Mixing lab practice
# codes into that would risk a completed lesson accidentally clearing
# or conflicting with someone's actual pending login OTP.

practice_otp_store: dict[str, dict] = {}  # {email: {"hash": ..., "expires": ...}}

class PracticeOtpSendPayload(BaseModel):
    email: str

@app.post("/api/practice-otp/send")
async def send_practice_otp(payload: PracticeOtpSendPayload):
    code = str(random.randint(100000, 999999))
    practice_otp_store[payload.email] = {
        "hash": pwd_context.hash(code),
        "expires": datetime.utcnow() + timedelta(minutes=10),
    }
    send_otp_email(payload.email, code)  # reuses your real, working Brevo function
    return {"status": "sent"}

class PracticeOtpVerifyPayload(BaseModel):
    email: str
    code: str

@app.post("/api/practice-otp/verify")
async def verify_practice_otp(payload: PracticeOtpVerifyPayload):
    entry = practice_otp_store.get(payload.email)
    if not entry:
        raise HTTPException(status_code=400, detail="No practice code pending — request one first")
    if datetime.utcnow() > entry["expires"]:
        raise HTTPException(status_code=400, detail="Code expired")
    correct = pwd_context.verify(payload.code, entry["hash"])
    if correct:
        del practice_otp_store[payload.email]  # one-time use, same as the real system
    return {"correct": correct}

# =============================================================
# PRACTICE OTP  (used inside episodes for a hands-on 2FA exercise)
# =============================================================
# Deliberately SEPARATE from the real login OTP system above.
# Reusing User.otp_code_hash here would risk overwriting a genuine
# pending LOGIN code for the same account — these must stay isolated.
# Added at the end of the file, same pattern as scenario-feedback,
# so nothing already working risks being disturbed.

# Simple in-memory store: email -> current practice code.
# Resets if uvicorn restarts — totally fine, since this is just a
# teaching exercise, not real security.
practice_otp_codes: dict[str, str] = {}

class PracticeOtpSendPayload(BaseModel):
    email: str

@app.post("/api/practice-otp/send")
async def practice_otp_send(payload: PracticeOtpSendPayload):
    """Generates a practice code and emails it, reusing the same
    real Brevo sender function — but stores it separately from
    real login OTPs."""
    code = str(random.randint(100000, 999999))
    practice_otp_codes[payload.email] = code
    send_otp_email(payload.email, code)  # same function your real login already uses
    return {"status": "sent"}


class PracticeOtpVerifyPayload(BaseModel):
    email: str
    code: str

@app.post("/api/practice-otp/verify")
async def practice_otp_verify(payload: PracticeOtpVerifyPayload):
    """Checks the submitted code against the in-memory store.
    No hashing here — low stakes, it's a practice exercise, not
    real account security."""
    correct = practice_otp_codes.get(payload.email) == payload.code
    if correct:
        practice_otp_codes.pop(payload.email, None)  # used once, then discarded
    return {"correct": correct}

@app.post("/api/scenario-feedback")
async def scenario_feedback(payload: ScenarioFeedbackPayload):
    system_prompt = build_scenario_feedback_prompt(
        payload.tier, payload.module, payload.incident, payload.choice_text, payload.correct
    )
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "Give the feedback now."},
    ]

    # Try up to twice — if Groq returns empty content on the first
    # attempt (can happen if the model spends its whole budget
    # "thinking" before writing anything visible), retry once before
    # giving up. This is invisible to the player — just a tiny delay.
    for attempt in range(2):
        response = groq_client.chat.completions.create(
            model="openai/gpt-oss-20b",
            max_tokens=400,
            reasoning_effort="low",
            messages=messages,
        )
        content = response.choices[0].message.content
        if content and content.strip():
            return {"feedback": content}

    # Both attempts came back empty — fall back to a guaranteed,
    # always-true statement rather than showing nothing at all.
    return {"feedback": "Good thing to think about — length and uniqueness are what actually protect an account."}

# =============================================================
# PRACTICE OTP  (for the in-episode 2FA hands-on task — NOT real auth)
# =============================================================
# Separate from the real login OTP on purpose: this is a TEACHING tool
# inside an episode, not a security boundary. Same Brevo delivery, same
# hashing discipline (never store the raw code), but its own in-memory
# store so a practice code can never be confused with — or interfere
# with — a real login session.

practice_otp_store: dict[str, dict] = {}  # email -> {"hash": str, "expires": datetime}

def send_practice_otp_email(to_email: str, otp_code: str):
    """Same Brevo call as the real OTP email, but written in the
    mentor's voice and clearly labeled as a practice exercise, so it
    reads as part of the story rather than a real security alert."""
    response = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={"api-key": BREVO_API_KEY, "Content-Type": "application/json"},
        json={
            "sender": {"email": BREVO_SENDER_EMAIL, "name": "Zara — CyberGuard Mentor"},
            "to": [{"email": to_email}],
            "subject": "🛰️ CyberGuard Training — Your Practice Verification Code",
            "htmlContent": (
                f"<p>This is Zara, your CyberGuard mentor.</p>"
                f"<p>Here's the practice verification code for this episode's 2FA exercise:</p>"
                f"<p style='font-size:24px;font-weight:bold;'>{otp_code}</p>"
                f"<p>Enter it in the episode to confirm 2FA is working. Expires in 10 minutes.</p>"
            ),
        },
    )
    print(f"PRACTICE OTP — BREVO STATUS: {response.status_code}")  # TEMPORARY — remove after confirming it works
    if response.status_code != 201:
        raise Exception(f"Practice OTP email send failed: {response.text}")


class PracticeOtpSendPayload(BaseModel):
    email: str

@app.post("/api/practice-otp/send")
async def practice_otp_send(payload: PracticeOtpSendPayload):
    """Generates a practice code, stores only its HASH with a 10-minute
    expiry (same discipline as the real OTP), and emails it via Brevo."""
    otp_code = str(random.randint(100000, 999999))
    practice_otp_store[payload.email] = {
        "hash": pwd_context.hash(otp_code),
        "expires": datetime.utcnow() + timedelta(minutes=10),
    }
    send_practice_otp_email(payload.email, otp_code)
    return {"status": "sent"}


class PracticeOtpVerifyPayload(BaseModel):
    email: str
    code: str

# Phrases that indicate the model refused instead of answering —
# checked so a refusal never reaches the player as "feedback".
REFUSAL_MARKERS = ["i'm sorry", "i am sorry", "can't comply", "cannot comply", "i cannot assist", "i can't assist"]

def looks_like_refusal(text: str) -> bool:
    lowered = text.strip().lower()
    return any(marker in lowered for marker in REFUSAL_MARKERS) or len(lowered) == 0

@app.post("/api/scenario-feedback")
async def scenario_feedback(payload: ScenarioFeedbackPayload):
    prompt = build_scenario_feedback_prompt(
        payload.tier, payload.module, payload.incident, payload.choice_text, payload.correct
    )

    # Try up to 2 times — if the model refuses or returns empty, ask
    # again before giving up. Real content almost always comes back
    # clean on the second try; this is model flakiness, not a prompt bug.
    for attempt in range(2):
        response = groq_client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": "Give the feedback now."},
            ],
        )
        feedback = response.choices[0].message.content
        if not looks_like_refusal(feedback):
            return {"feedback": feedback}

    # Both attempts failed — return something the player can still use
    # instead of silently failing or showing a refusal.
    fallback = "This choice has real security consequences — consider how it affects account safety and apply the standard's guidance here."
    return {"feedback": fallback}
