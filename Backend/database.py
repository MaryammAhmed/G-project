"""
FILE: database.py
PURPOSE: 
This file acts as the permanent bridge between our Python backend and the 
PostgreSQL database. It holds the connection credentials, builds the async engine 
(the vehicle for transferring data), and provides a secure way to open and close 
database sessions whenever a user tries to interact with CyberGuard.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

# The exact map to your new Docker database
DATABASE_URL = "postgresql+asyncpg://postgres:devpass@localhost:5432/cyberguard"

# The engine that drives the connection
engine = create_async_engine(DATABASE_URL, echo=True)

# The session maker that opens and closes the vault door
SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

# A helper function we will use later to fetch data safely
async def get_db():
    async with SessionLocal() as session:
        yield session
