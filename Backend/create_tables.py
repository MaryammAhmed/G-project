"""
One-time script to create all tables defined in models.py
inside the actual Postgres database. Run this once with:

    python create_tables.py

(with your venv activated). You should see "Tables created successfully!"
printed at the end. After that, delete this file or keep it around —
it's safe to run again later, it won't duplicate tables that already exist.
"""

import asyncio
from database import engine, Base
from models import User  # noqa: F401 -- import so Base knows about the User table

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully!")

if __name__ == "__main__":
    asyncio.run(create_tables())
    