from datetime import datetime, timezone
from app.database import Base
from sqlalchemy import (
    String,
    Boolean,
    UniqueConstraint,
    ForeignKey,
    Integer,
    Column,
    DateTime,
)
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    # Automatically generated user ID
    id = Column(Integer, primary_key=True, index=True)

    # User profile
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    department = Column(String(150), nullable=False)
    degree_program = Column(String(20), nullable=False)
    study_year = Column(Integer, nullable=False)

    # Authentication
    password_hash = Column(String(255), nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)

    # Account creation timestamp
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    memberships = relationship(
        "Membership",
        back_populates="user",
    )

    verification_tokens = relationship(
        "EmailVerificationToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class Community(Base):
    __tablename__ = "communities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(500), nullable=True)

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    creator = relationship(
        "User",
        foreign_keys=[created_by],
    )

    memberships = relationship(
        "Membership",
        back_populates="community",
    )


class Membership(Base):
    __tablename__ = "memberships"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "community_id",
            name="uq_user_community",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    community_id = Column(
        Integer,
        ForeignKey("communities.id"),
        nullable=False,
    )

    role = Column(String(20), default="member", nullable=False)

    joined_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship(
        "User",
        back_populates="memberships",
    )

    community = relationship(
        "Community",
        back_populates="memberships",
    )


class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    # Store the hash of the verification token, not the raw token
    token_hash = Column(String(64), unique=True, nullable=False)

    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship(
        "User",
        back_populates="verification_tokens",
    )