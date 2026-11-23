"""
FILE: database.py
PURPOSE: 
This file acts as the permanent bridge between our Python backend and the 
PostgreSQL database. It holds the connection credentials, builds the async engine 
(the vehicle for transferring data), and provides a secure way to open and close 
database sessions whenever a user tries to interact with CyberGuard.

BIG PICTURE (read this first):
  .env  ->  DATABASE_URL  ->  to_async_url()  ->  engine  ->  SessionLocal  ->  get_db()
  The URL says WHERE the database is, the engine holds the connections, a session is one
  "conversation" with the database, and get_db() hands one session to each web request.
"""

import os                                                      # read environment variables and file paths
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit   # take a URL apart and put it back together

from dotenv import load_dotenv                                 # loads the .env file
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession   # async versions of engine + session
from sqlalchemy.orm import sessionmaker, declarative_base      # session factory + base class for tables

# Load Backend/.env from the same folder as this file, so it works no matter where the
# server is started from.
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))


def to_async_url(url: str) -> str:
    """Use the asyncpg driver. Neon URLs often arrive as plain postgresql:// with params asyncpg rejects.

    SSL hardening: the configured sslmode is PRESERVED (mapped onto asyncpg's `ssl` parameter),
    so verify-full / verify-ca keep their certificate and hostname checks. The old version
    silently replaced them with ssl=require, which would have downgraded a strict deployment.
    """
    # Some providers give "postgres://"; SQLAlchemy wants "postgresql://", so rename it.
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    # Add "+asyncpg" so SQLAlchemy uses the asynchronous PostgreSQL driver.
    if url.startswith("postgresql://"):
        url = "postgresql+asyncpg://" + url[len("postgresql://"):]
    parts = urlsplit(url)   # split into scheme, host, path, query (?a=b), fragment
    query = []              # the cleaned list of ?key=value options we will keep
    ssl_mode = None         # remembers the sslmode value, if one was given
    # Go through each ?key=value option in the URL.
    for key, value in parse_qsl(parts.query, keep_blank_values=True):
        if key == "channel_binding":
            # Not an asyncpg parameter (libpq concept); drop it.
            continue
        if key == "sslmode":
            ssl_mode = value   # remember it, translate it below, and do not keep the original key
            continue
        query.append((key, value))   # any other option is kept as it was
    # Translate "sslmode=xyz" into asyncpg's "ssl=xyz", unless sslmode is "disable" or
    # an explicit ssl option already exists.
    if ssl_mode and ssl_mode.lower() != "disable" and not any(key == "ssl" for key, _ in query):
        # asyncpg accepts the libpq SSL modes through the `ssl` parameter,
        # so verify-full / verify-ca keep certificate + hostname verification.
        query.append(("ssl", ssl_mode.lower()))
    # Reassemble the URL from its (cleaned) pieces.
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


# The password stays in Backend/.env, which is gitignored. There is no fallback URL in source.
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    # Stop the server at startup with a clear message instead of failing later.
    raise RuntimeError("DATABASE_URL is required. Set it in Backend/.env.")
DATABASE_URL = to_async_url(DATABASE_URL)   # convert it to the format asyncpg understands

# The engine that drives the connection. echo is off so queries are not printed during a demo.
# pool_pre_ping=True tests a connection before using it, which avoids errors when a cloud
# database (like Neon) has quietly closed an idle connection.
engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)

# The session maker that opens and closes the vault door.
# expire_on_commit=False keeps objects usable after db.commit() (otherwise reading
# user.username after a commit would trigger another database query, which fails in async code).
# STUDY NOTE: newer SQLAlchemy also offers async_sessionmaker; this older style still works.
SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Every table class in models.py inherits from this Base. SQLAlchemy uses it to know
# which classes are database tables.
Base = declarative_base()

# A helper function we will use later to fetch data safely
async def get_db():
    # Opens a session for ONE web request. FastAPI calls this through Depends(get_db),
    # gives the session to the route, and when the route finishes, the "async with" block
    # closes the session automatically (even if the route raised an error).
    # "yield" (instead of "return") is what lets the cleanup run after the route is done.
    async with SessionLocal() as session:
        yield session
        