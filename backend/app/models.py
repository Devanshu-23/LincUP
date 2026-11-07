
from datetime import datetime, timezone

from sqlalchemy import (
    String,
    UniqueConstraint,
    ForeignKey,
    Integer,
    Column,
    DateTime,
)
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    department = Column(String(150), nullable=False)
    degree_program = Column(String(20), nullable=False)
    study_year = Column(Integer, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # to get like all memberships for the curr user it links one user to many memberships (forms a relation)
    memberships = relationship(
        "Membership",
        back_populates="user", # bidirectional
    )


class Community(Base):
    __tablename__ = "communities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(500), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, )

    creator = relationship("User", foreign_keys=[created_by])
    memberships = relationship("Membership", back_populates="community")


class Membership(Base):
    __tablename__ = "memberships"

    __table_args__ = (
        UniqueConstraint("user_id", "community_id", name="uq_user_community"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False)
    role = Column(String(20), default="member", nullable=False)
    joined_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        nullable=False,
    )

    user = relationship("User", back_populates="memberships")
    community = relationship("Community", back_populates="memberships")

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)

    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    title = Column(String(150), nullable=False)
    description = Column(String(1000), nullable=False)
    start_at = Column(DateTime(timezone=True), nullable=False)
    end_at = Column(DateTime(timezone=True), nullable=False)
    location = Column(String(255), nullable=False)
    image_url = Column(String(500), nullable=True) #nullable
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    community = relationship("Community") #unidirectional
    creator = relationship("User")

class EventRSVP(Base):
    __tablename__ = "event_rsvp"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("community_events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    status = Column(String(20), nullable=False, default="going") #going/not_going
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    event = relationship("CommunityEvent")
    user = relationship("User")

    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="unique_event_attendance"),
    )

