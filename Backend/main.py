# main.py
#
# CyberGuard backend — FastAPI. Organized top to bottom as:
# setup → password rules → auth (register/login) → OTP + email (real
# login) → AI mentor chat → episode scenario feedback → practice OTP
# (2FA lab exercise, separate from real login OTP).
#
# CHANGE: age tiers (A / B / C) were REMOVED everywhere. The platform now
# targets ONE audience: high school students, ages 16-18.

#   - verify-otp page:  login(data.token, data.age_group, data.email)
#   - login page:       login(data.token, data.age_group, data.email)
#   - AuthContext, TierThemeProvider, TierGate (they use ageGroup)
#   - chat page and episode pages (they send "tier" in their requests)

from fastapi import FastAPI, HTTPException, Depends # Depends injects database sessions
from fastapi.middleware.cors import CORSMiddleware # allows your Next.js frontend to talk to your backend
from pydantic import BaseModel #ensuring FastAPI automatically validates user input
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession #Represents an asynchronous database session, allowing your app to talk to PostgreSQL without freezing
from passlib.context import CryptContext #The security library used to securely hash passwords and verify them using Bcrypt
from jose import jwt #A library used to create (encode) and read (decode) secure JSON Web Tokens (JWT) for user login sessions
from datetime import datetime, timedelta #Python's built-in tool for managing dates and times. Used here to set expiration times for JWT tokens and OTP codes
import os, re, random, requests
from dotenv import load_dotenv #Loads secret keys and environment variables from your .env file
from groq import Groq

from database import get_db
from models import User

load_dotenv()
app = FastAPI()

# Lets the Next.js frontend (running on a different port) talk to this API.
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

# The ONE audience of the platform. Used inside the AI mentor prompts so the
# model always speaks to the right age group (replaces the old per-tier text).
AUDIENCE = "a high school student (ages 16-18)"


# =============================================================
# PASSWORD STRENGTH — used at registration
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
    """Checks every rule in order, raises on the first one that fails."""
    for pattern, message in PASSWORD_RULES:
        if not re.search(pattern, password):
            raise ValueError(message)
    if password.lower() in COMMON_WEAK_PASSWORDS:
        raise ValueError("This password is too common — choose something less predictable.")


# =============================================================
# AUTH — register and login (login triggers OTP, doesn't issue a token yet)
# =============================================================

class RegisterPayload(BaseModel):
    username: str
    email: str
    password: str
    # REMOVED: ageGroup: str
    # If the old frontend still sends "ageGroup", Pydantic simply ignores it.

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
        # REMOVED: age_group=payload.ageGroup,
    )
    db.add(user)
    await db.commit()
    # Message no longer mentions a tier.
    return {"status": "ok", "message": f"Clearance granted, Agent {user.username} — welcome to CyberGuard."}


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


# =============================================================
# REAL LOGIN OTP + EMAIL — the actual account security step
# =============================================================

BREVO_API_KEY = os.environ.get("BREVO_API_KEY")
BREVO_SENDER_EMAIL = os.environ.get("BREVO_SENDER_EMAIL")

def send_otp_email(to_email: str, otp_code: str):
    """Real send via Brevo's API. Raises if Brevo doesn't return 201,
    so a failed send never looks like it succeeded."""
    response = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={"api-key": BREVO_API_KEY, "Content-Type": "application/json"},
        json={
            "sender": {"email": BREVO_SENDER_EMAIL, "name": "CyberGuard Security"},
            "to": [{"email": to_email}],
            "subject": "🛡️ CyberGuard — Your Login Verification Code",
            "htmlContent": (
                f"<p>Hello Agent,</p>"
                f"<p>Here is your secure authentication code to access your CyberGuard terminal:</p>"
                f"<p style='font-size:24px;font-weight:bold;color:burgendy;'>{otp_code}</p>"
                f"<p>Enter this code in the login portal to proceed. Expires in 5 minutes.</p>"
            ),
        },
    )
    if response.status_code != 201:
        raise Exception(f"Email send failed: {response.text}")


async def generate_and_send_otp(user: User, db: AsyncSession):
    """Shared by /api/login and /api/resend-otp: makes a code, stores
    only its hash + expiry, then sends it."""
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

    # Success — clear the OTP so this exact code can't be reused
    user.otp_code_hash = None
    user.otp_expires_at = None
    await db.commit()

    token_data = {
        "sub": str(user.id),
        # REMOVED: "age_group": user.age_group,
        "exp": datetime.utcnow() + timedelta(hours=12),
    }
    token = jwt.encode(token_data, SECRET_KEY, algorithm="HS256")
    # REMOVED: "age_group" from the response. The frontend only needs token + email now.
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
# AI MENTOR — the free-text /api/chat used by the standalone chat page
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

# CHANGE: "{tier}" placeholder removed. The mentor now always addresses {audience}.
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
- Keep responses to a MAXIMUM of 4 sentences, no exceptions

Respond to the user's specific message or decision below, addressing what they
actually did, not a generic script."""

# CHANGE: the "tier" parameter was removed from this function.
def build_system_prompt(module: int) -> str:
    standard = MODULE_STANDARDS.get(module, "recognized cybersecurity best practices")
    core_guidance = MODULE_CORE_GUIDANCE.get(module, "Follow general cybersecurity best practices.")
    return SYSTEM_PROMPT_TEMPLATE.format(
        audience=AUDIENCE, module=module, standard=standard, core_guidance=core_guidance
    )


class ChatPayload(BaseModel):
    message: str
    # REMOVED: tier: str   (old frontend code that still sends "tier" is simply ignored)
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
# SCENARIO FEEDBACK — used by episodes after each choice/task beat
# =============================================================
# THIS is the route that was duplicated 3x before — this is now the
# ONLY copy. Combines: max_tokens + reasoning_effort (keeps responses
# fast and on-budget) with refusal detection (catches the model
# occasionally saying "I'm sorry, I can't comply" instead of real
# feedback) and empty-content detection, retried once before falling
# back to a safe default line.

# CHANGE: "{tier}" placeholder removed here too.
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

# CHANGE: the "tier" parameter was removed from this function.
def build_scenario_feedback_prompt(module: int, incident: str, choice_text: str, correct: bool) -> str:
    standard = MODULE_STANDARDS.get(module, "recognized cybersecurity best practices")
    core_guidance = MODULE_CORE_GUIDANCE.get(module, "Follow general cybersecurity best practices.")
    verdict_label = "the correct/safe choice" if correct else "an unsafe choice"
    return SCENARIO_FEEDBACK_PROMPT_TEMPLATE.format(
        audience=AUDIENCE, module=module, standard=standard, core_guidance=core_guidance,
        incident=incident, choice_text=choice_text, verdict_label=verdict_label,
    )


class ScenarioFeedbackPayload(BaseModel):
    # REMOVED: tier: str   (old frontend code that still sends "tier" is simply ignored)
    module: int
    incident: str
    choice_text: str
    correct: bool


# Phrases indicating the model refused instead of answering — if the
# reply contains any of these, or is just empty, we don't show it.
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

    # Up to 2 attempts — Groq occasionally returns empty content or a
    # refusal for no real reason (model flakiness, not a prompt bug).
    # Invisible to the player, just a small delay if it happens.
    for attempt in range(2):
        response = groq_client.chat.completions.create(
            model="openai/gpt-oss-20b",
            max_tokens=400,
            reasoning_effort="low",
            messages=messages,
        )
        content = response.choices[0].message.content
        if not looks_like_refusal(content):
            return {"feedback": content}

    # Both attempts failed — a safe, always-true fallback so the player
    # never sees a blank bubble or a raw refusal message.
    return {"feedback": "This choice has real security consequences — consider how it affects account safety and apply the standard's guidance here."}


# =============================================================
# PRACTICE OTP — the in-episode 2FA hands-on task, NOT real login
# =============================================================
# Deliberately separate from the real login OTP system above: this is
# a teaching exercise inside an episode, not an account security
# boundary. Same hashing discipline (never store the raw code), but
# its own in-memory store so a practice code can never collide with
# or clear a real pending login OTP for the same account.
#
# THIS is also the route that was duplicated 3x — one earlier copy
# didn't even hash the code. This is now the only copy, and it does.

practice_otp_store: dict[str, dict] = {}  # email -> {"hash": str, "expires": datetime}

def send_practice_otp_email(to_email: str, otp_code: str):
    """Same Brevo call as the real OTP email, but written in the
    mentor's voice and clearly labeled as a practice exercise."""
    response = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={"api-key": BREVO_API_KEY, "Content-Type": "application/json"},
        json={
            "sender": {"email": BREVO_SENDER_EMAIL, "name": "CyberGuard Mentor"},
            "to": [{"email": to_email}],
            "subject": "🛰️ CyberGuard Training — Your Practice Verification Code",
            "htmlContent": (
                f"<p>This is your CyberGuard mentor.</p>"
                f"<p>Here's the practice verification code for this episode's 2FA exercise:</p>"
                f"<p style='font-size:24px;font-weight:bold;'>{otp_code}</p>"
                f"<p>Enter it in the episode to confirm 2FA is working. Expires in 5 minutes.</p>"
            ),
        },
    )
    if response.status_code != 201:
        raise Exception(f"Practice OTP email send failed: {response.text}")


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
        practice_otp_store.pop(payload.email, None)  # one-time use
    return {"correct": correct}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",  # NEW — accepts any port on localhost
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)