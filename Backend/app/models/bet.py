from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from .base import Base
from datetime import datetime, timezone
import enum

class BetStatus(enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class BetResult(enum.Enum):
    UNKNOWN = "UNKNOWN"
    WON = "WON"
    LOST = "LOST"
    DRAW = "DRAW"

class Bet(Base):
    __tablename__ = "bets"

    id = Column(Integer, primary_key=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Integer, nullable=False, default=0)
    status = Column(Enum(BetStatus), nullable=False, default=BetStatus.PENDING)
    result = Column(Enum(BetResult), nullable=False, default=BetResult.UNKNOWN)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    mediator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    end_time = Column(DateTime, nullable=False)

    user = relationship("User", foreign_keys=[user_id], back_populates="bets")
    room = relationship("Room", back_populates="bets")
    mediator = relationship("User", foreign_keys=[mediator_id])
    approver = relationship("User", foreign_keys=[approved_by])
    notifications = relationship("Notification", back_populates="bet", cascade="all, delete-orphan")  # Added this line