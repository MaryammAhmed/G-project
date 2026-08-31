"""
FILE: models.py
PURPOSE:
This file contains the strict architectural blueprints (schemas) for the database.
It defines exactly what a "User" profile must look like, ensuring that no account 
can be created without a unique username, a securely hashed password, and an 
assigned age group (for routing them to the correct cybersecurity training track).
"""

from sqlalchemy import Column, Integer, String
from database import Base

class User(Base):
    __tablename__ = "users"

    # Our strict rules for every user account
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    age_group = Column(String, nullable=False) # Will store "A", "B", or "C"