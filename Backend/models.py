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
The User model is unchanged.
"""

from datetime import datetime

# CHANGED: added Boolean, ForeignKey, UniqueConstraint, text (used only by UserProgress)
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint, text
from database import Base

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint, text
# ...
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    otp_code_hash = Column(String, nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    is_admin = Column(Boolean, nullable=False, default=False, server_default=text("false"))  # NEW




# =============================================================
# NEW: USER PROGRESS (report requirements: save completion status and scores
# in PostgreSQL, keep completion logs, restrict modules until the previous
# one is finished)
#
# ONE ROW PER (user, module). The unique constraint stops duplicate rows, so
# "complete the Vault twice" updates one row instead of creating two.
# =============================================================
class UserProgress(Base):
    __tablename__ = "user_progress"
    __table_args__ = (UniqueConstraint("user_id", "module", name="uq_user_progress_user_module"),)

    id = Column(Integer, primary_key=True, index=True)

    # ON DELETE CASCADE: when a user is deleted, their progress rows go with them.
    # This is what makes the later GDPR "delete my data" feature a one-liner.
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    module = Column(Integer, nullable=False)            # 1 Vault, 2 Mirage, 3 Whisper, 4 Oracle
    scenario = Column(String, nullable=False)           # mission id, e.g. "vault", "spot-the-phish"

    completed = Column(Boolean, nullable=False, default=False, server_default=text("false"))
    best_score = Column(Integer, nullable=False, default=0, server_default=text("0"))   # highest XP ever
    last_score = Column(Integer, nullable=False, default=0, server_default=text("0"))   # most recent XP
    attempts = Column(Integer, nullable=False, default=0, server_default=text("0"))     # times the mission was started

    completed_at = Column(DateTime, nullable=True)      # first time it was completed (the completion log)
    last_updated = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
