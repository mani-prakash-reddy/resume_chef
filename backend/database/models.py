"""
Database Models for Supply Chain System with pgvector support
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    JSON,
    Text,
    Boolean,
    Date,
    Index,
)
from sqlalchemy.orm import declarative_base

# from pgvector.sqlalchemy import Vector
from datetime import datetime

Base = declarative_base()
