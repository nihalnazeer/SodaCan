from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum, DateTime, Text
from sqlalchemy.orm import relationship
from .base import Base
from datetime import datetime, timezone
import enum

class RoomStatus(enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"

class Room(Base):
    __tablename__ = "rooms"
    
    id = Column(Integer, primary_key=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)  # Added length limit
    description = Column(Text, nullable=True)  # Using Text for longer descriptions
    status = Column(Enum(RoomStatus, name="room_status"), nullable=False, default=RoomStatus.OPEN)
    is_public = Column(Boolean, nullable=False, default=True)  # Added default value
    token = Column(String(50), nullable=True, unique=True)  # Added length and unique constraint
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=True, onupdate=lambda: datetime.now(timezone.utc))  # Added updated_at

    # Relationships
    creator = relationship("User", back_populates="rooms")
    members = relationship("RoomMember", back_populates="room", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="room", cascade="all, delete-orphan")
    bets = relationship("Bet", back_populates="room", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Room(id={self.id}, name='{self.name}', status='{self.status}')>"