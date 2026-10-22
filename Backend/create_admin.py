from database import SessionLocal
from models import User
from passlib.context import CryptContext
import asyncio

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    async with SessionLocal() as db:
        user = User(
            username="CGAdmin",
            email="miraaa.ah.19@gmail.com",
            hashed_password=pwd_context.hash("Admin123!"),
            is_admin=True
        )
        db.add(user)
        await db.commit()
        print("Admin created")

asyncio.run(create_admin())
