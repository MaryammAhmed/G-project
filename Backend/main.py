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
    return {"status": "ok", "token": token, "age_group": user.age_group}


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
