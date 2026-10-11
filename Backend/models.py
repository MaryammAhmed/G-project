"""
FILE: models.py
PURPOSE:
This file contains the strict architectural blueprints (schemas) for the database.
It defines exactly what a "User" profile must look like, ensuring that no account
can be created without a unique username and a securely hashed password.

CHANGE: the "age_group" column was REMOVED. CyberGuard now targets a single
audience (high school students, ages 16-18), so there is nothing to route
between different training tracks any more.
"""

from sqlalchemy import Column, DateTime, Integer, String
from database import Base

class User(Base):
    __tablename__ = "users"

    # Our strict rules for every user account
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    # REMOVED: age_group = Column(String, nullable=False)  # used to store "A", "B" or "C"
    otp_code_hash = Column(String, nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)   # DateTime, not String
    