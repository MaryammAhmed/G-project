from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

# Import the database bridge and blueprint we just made
from database import get_db
from models import User

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

