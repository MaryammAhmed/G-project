from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import os                          # NEW: lets us read values from .env
from dotenv import load_dotenv     # NEW: loads the .env file into memory
from groq import Groq              # NEW: Groq's official client

# Import the database bridge and blueprint we just made
from database import get_db
from models import User

load_dotenv()  # NEW: run this once, at startup, so os.environ has our .env values

# Initialize the FastAPI application
app = FastAPI()

# Set up CORS so the Next.js frontend (port 3000) can talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up the password hasher
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# NEW: Groq client, using the key from .env — never hardcode this
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Define the structure of the incoming data from the frontend
class RegisterPayload(BaseModel):
    username: str
    password: str
    ageGroup: str

# The secure registration route
@app.post("/api/register")
async def register(payload: RegisterPayload, db: AsyncSession = Depends(get_db)):
    # 1. Check if the username already exists
    existing = await db.scalar(select(User).where(User.username == payload.username))
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken")
    
    # 2. Hash the password and create the user
    user = User(
        username=payload.username,
        hashed_password=pwd_context.hash(payload.password),
        age_group=payload.ageGroup,
    )
    
    # 3. Save to the Docker database
    db.add(user)
    await db.commit()
    
    # 4. Return the terminal-style success message
    return {"status": "ok", "message": f"Clearance granted, Agent {user.username} — Tier {user.age_group} initiate."}


SECRET_KEY = "dev-secret-change-me-later"  # move to .env before ever deploying

class LoginPayload(BaseModel):
    username: str
    password: str

@app.post("/api/login")
async def login(payload: LoginPayload, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.username == payload.username))

    # Same error for "no such user" and "wrong password" —
    # never let an attacker learn which usernames exist
    if not user or not pwd_context.verify(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token_data = {
        "sub": str(user.id),
        "age_group": user.age_group,
        "exp": datetime.utcnow() + timedelta(hours=12),
    }
    token = jwt.encode(token_data, SECRET_KEY, algorithm="HS256")

    return {"status": "ok", "token": token, "age_group": user.age_group}


# NEW: which real cybersecurity standard grounds each module's mentor feedback
MODULE_STANDARDS = {
    1: "NIST SP 800-63B (Digital Identity Guidelines — memorized secrets and authentication)",
    2: "CISA Secure Our World (phishing recognition and reporting guidance)",
    3: "CISA Social Engineering Awareness guidance",
    4: "OWASP Top 10 for Large Language Model Applications",
}

# NEW: the mentor's rules of behavior — module/tier get filled in per request
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

# NEW: the actual, correct guidance per module — so the AI states real facts,
# not whatever it happens to generate from general training knowledge.
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

# NEW: builds the correct prompt for whichever module/tier the user is currently in
def build_system_prompt(tier: str, module: int) -> str:
    standard = MODULE_STANDARDS.get(module, "recognized cybersecurity best practices")
    core_guidance = MODULE_CORE_GUIDANCE.get(module, "Follow general cybersecurity best practices.")
    return SYSTEM_PROMPT_TEMPLATE.format(tier=tier, module=module, standard=standard, core_guidance=core_guidance)


# CHANGED: now carries tier + module, not just the raw message
class ChatPayload(BaseModel):
    message: str
    tier: str        # "A", "B", or "C"
    module: int       # 1-4

# CHANGED: builds a system prompt matching the user's tier/module before asking Groq
@app.post("/api/chat")
async def chat(payload: ChatPayload):
    system_prompt = build_system_prompt(payload.tier, payload.module)
    response = groq_client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": payload.message},
        ],
    )
    return {"reply": response.choices[0].message.content}
