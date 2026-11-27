"""
FILE: models.py
PURPOSE:
This file contains the strict architectural blueprints (schemas) for the database.
It defines exactly what a "User" profile must look like, ensuring that no account
can be created without a unique username and a securely hashed password.

CHANGE: the "age_group" column was REMOVED. CyberGuard now targets a single
audience (high school students, ages 16-18), so there is nothing to route
between different training tracks any more.

CHANGE (progress tracking): added the UserProgress table (bottom of this file).

CHANGE (security fixes): three columns were added to the User table:
  - reset_otp_attempts      counts wrong password-reset codes (locks the code at 5)
  - practice_otp_hash       the practice 2FA code, saved so a server restart cannot lose it
  - practice_otp_expires_at when that practice code stops working

HOW THIS FILE IS USED:
  - Each class below = one PostgreSQL table. Each Column(...) = one column in that table.
  - main.py imports User and UserProgress and reads/writes them through a database session.
  - SQLAlchemy does NOT add new columns to a table that already exists. After adding a
    column here you must also change the real database (see the notes in the chat/migration).
"""

from datetime import datetime, timezone

def utcnow() -> datetime:
    """Naive UTC datetime matching plain SQLAlchemy DateTime columns."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

# Column types and helpers from SQLAlchemy:
#   Boolean / Integer / String / DateTime = the type of data a column holds
#   Column        = declares one column
#   ForeignKey    = links a column to a row in another table
#   UniqueConstraint = forbids duplicate combinations of columns
#   text          = lets us write raw SQL snippets (used for server_default values)
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint, text
from database import Base       # the base class every table class must inherit from (see database.py)


# =============================================================
# USER TABLE  ->  PostgreSQL table "users"
# =============================================================
class User(Base):
    __tablename__ = "users"   # the real table name inside PostgreSQL

    # Unique number for each user. primary_key = the row's identity. index = faster lookups.
    id = Column(Integer, primary_key=True, index=True)
    # Login name. unique = no two users can share one. nullable=False = it is required.
    username = Column(String, unique=True, index=True, nullable=False)
    # Email used to send the OTP codes. Unique, but allowed to be empty (nullable=True).
    email = Column(String, unique=True, index=True, nullable=True)
    # The bcrypt HASH of the password. The real password is never stored anywhere.
    hashed_password = Column(String, nullable=False)

    # ---- Login OTP (the 6-digit code emailed after a correct password) ----
    otp_code_hash = Column(String, nullable=True)      # hash of the current code (None = no code pending)
    otp_expires_at = Column(DateTime, nullable=True)   # when that code stops working (5 minutes after sending)
    # Wrong login-code tries. It is NOT wiped when a new code is sent (that would let an
    # attacker get unlimited guesses by pressing "resend"). It resets only after a correct code,
    # and the code is thrown away at 5 wrong tries.
    # default=0 is applied by Python; server_default=0 is applied by the database itself.
    otp_attempts = Column(Integer, nullable=False, default=0, server_default=text("0"))

    # True for administrators. Admins can open every level and use the /api/admin routes.
    is_admin = Column(Boolean, nullable=False, default=False, server_default=text("false"))

    # ---- Password-reset OTP (separate from login OTP so the two flows never collide) ----
    reset_otp_code_hash = Column(String, nullable=True)      # hash of the reset code
    reset_otp_expires_at = Column(DateTime, nullable=True)   # reset code stops working after 10 minutes
    # NEW (FIX 2): wrong reset-code tries. Works exactly like otp_attempts above:
    # the code is destroyed at 5 wrong tries, and the counter clears only after a successful reset.
    reset_otp_attempts = Column(Integer, nullable=False, default=0, server_default=text("0"))

    # ---- Practice OTP (the in-game 2FA exercise, NOT the real login) ----
    # NEW (FIX 6): saved in the database instead of server memory, so a restart cannot lose it.
    practice_otp_hash = Column(String, nullable=True)        # hash of the practice code
    practice_otp_expires_at = Column(DateTime, nullable=True)  # practice code stops working after 5 minutes


# =============================================================
# USER PROGRESS  ->  PostgreSQL table "user_progress"
# (report requirements: save completion status and scores in PostgreSQL,
# keep completion logs, restrict modules until the previous one is finished)
#
# ONE ROW PER (user, module, level). The unique constraint below stops duplicate rows, so
# "complete level 2 of the Vault twice" updates one row instead of creating two.
# (Module 5, the finale, uses level 1 only.)
# =============================================================
class UserProgress(Base):
    __tablename__ = "user_progress"
    # One row per level, so "finished level 2" cannot collide with "finished level 3".
    # The trailing comma matters: it makes this a tuple, which SQLAlchemy requires.
    __table_args__ = (UniqueConstraint("user_id", "module", "level", name="uq_user_progress_user_module_level"),)

    id = Column(Integer, primary_key=True, index=True)

    # Which user this row belongs to. The ForeignKey ties it to users.id.
    # ON DELETE CASCADE: when a user is deleted, their progress rows go with them
    # (this is what makes the GDPR "delete my account" route clean up everything).
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    module = Column(Integer, nullable=False)            # 1 Vault, 2 Mirage, 3 Whisper, 4 Oracle
    level = Column(Integer, nullable=False, default=1, server_default=text("1"))  # 1-5 inside that module
    scenario = Column(String, nullable=False)           # mission id, e.g. "vault", "spot-the-phish"
    badge = Column(String, nullable=True)               # badge id earned when this level is completed

    completed = Column(Boolean, nullable=False, default=False, server_default=text("false"))   # finished at least once?
    best_score = Column(Integer, nullable=False, default=0, server_default=text("0"))   # highest XP ever
    last_score = Column(Integer, nullable=False, default=0, server_default=text("0"))   # most recent XP
    attempts = Column(Integer, nullable=False, default=0, server_default=text("0"))     # times the mission was started

    completed_at = Column(DateTime, nullable=True)      # first time it was completed (the completion log)
    # default = set when the row is created; onupdate = refreshed automatically on every UPDATE.
    last_updated = Column(DateTime, nullable=False, default=utcnow, onupdate=utcnow)
    