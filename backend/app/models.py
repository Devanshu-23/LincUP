
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

    # User profile
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    department = Column(String(150), nullable=False)
    degree_program = Column(String(20), nullable=False)
    study_year = Column(Integer, nullable=False)

    # Authentication
    password_hash = Column(String(255), nullable=False)

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

#Events 
class CommunityEvent(Base):
    __tablename__ = "community_events"

    id = Column(Integer, primary_key=True, index=True)

    # Community organising the event
    community_id = Column(
        Integer,
        ForeignKey("communities.id"),
        nullable=False,
    )

    # User who created the event
    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    # Event details
    title = Column(String(150), nullable=False)
    description = Column(String(1000), nullable=False)

    # Event schedule
    start_at = Column(DateTime(timezone=True), nullable=False)
    end_at = Column(DateTime(timezone=True), nullable=False)

    # Event location is mandatory
    location = Column(String(255), nullable=False)

    # Optional cover image reference
    image_url = Column(String(500), nullable=True)

    # When the event was created
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    community = relationship("Community")
    creator = relationship("User")

#Event Attendence

class EventAttendance(Base):
    __tablename__ = "event_attendances"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("community_events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    status = Column(String(20), nullable=False, default="going")

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

