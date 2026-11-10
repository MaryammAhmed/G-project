"""
Create one admin user from environment variables.

Set ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD in Backend/.env first.
This script does not print the password.
"""

import asyncio
import os

from dotenv import load_dotenv
from passlib.context import CryptContext

from database import SessionLocal
from models import User

load_dotenv()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def create_admin():
    username = os.environ.get("ADMIN_USERNAME")
    email = os.environ.get("ADMIN_EMAIL")
    password = os.environ.get("ADMIN_PASSWORD")
    if not username or not email or not password:
        raise SystemExit("Set ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD in the environment.")
    async with SessionLocal() as db:
        user = User(
            username=username,
            email=email,
            hashed_password=pwd_context.hash(password),
            is_admin=True,
        )
        db.add(user)
        await db.commit()
        print("Admin created")


asyncio.run(create_admin())
