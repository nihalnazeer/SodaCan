from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from .base import Base
import enum

class RoomStatus(enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"

class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    status = Column(Enum(RoomStatus, name="roomstatus"), nullable=False, default=RoomStatus.OPEN)
    is_public = Column(Boolean, nullable=False)
    token = Column(String, nullable=True)

    creator = relationship("User", back_populates="rooms")
    members = relationship("RoomMember", back_populates="room", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="room", cascade="all, delete-orphan")
    bets = relationship("Bet", back_populates="room", cascade="all, delete-orphan")