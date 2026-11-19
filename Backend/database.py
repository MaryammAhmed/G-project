"""
FILE: database.py
PURPOSE: 
This file acts as the permanent bridge between our Python backend and the 
PostgreSQL database. It holds the connection credentials, builds the async engine 
(the vehicle for transferring data), and provides a secure way to open and close 
database sessions whenever a user tries to interact with CyberGuard.
"""

import os
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))


def to_async_url(url: str) -> str:
    """Use the asyncpg driver. Neon URLs often arrive as plain postgresql:// with params asyncpg rejects.

    SSL hardening: the configured sslmode is PRESERVED (mapped onto asyncpg's `ssl` parameter),
    so verify-full / verify-ca keep their certificate and hostname checks. The old version
    silently replaced them with ssl=require, which would have downgraded a strict deployment.
    """
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+asyncpg://" + url[len("postgresql://"):]
    parts = urlsplit(url)
    query = []
    ssl_mode = None
    for key, value in parse_qsl(parts.query, keep_blank_values=True):
        if key == "channel_binding":
            # Not an asyncpg parameter (libpq concept); drop it.
            continue
        if key == "sslmode":
            ssl_mode = value
            continue
        query.append((key, value))
    if ssl_mode and ssl_mode.lower() != "disable" and not any(key == "ssl" for key, _ in query):
        # asyncpg accepts the libpq SSL modes through the `ssl` parameter,
        # so verify-full / verify-ca keep certificate + hostname verification.
        query.append(("ssl", ssl_mode.lower()))
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


# The password stays in Backend/.env, which is gitignored. There is no fallback URL in source.
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is required. Set it in Backend/.env.")
DATABASE_URL = to_async_url(DATABASE_URL)

# The engine that drives the connection. echo is off so queries are not printed during a demo.
engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)

# The session maker that opens and closes the vault door
SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

# A helper function we will use later to fetch data safely
async def get_db():
    async with SessionLocal() as session:
        yield session
