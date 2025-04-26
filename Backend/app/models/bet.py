from sqlalchemy import Column, Integer, ForeignKey, Enum, DateTime, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base
import enum

class BetOption(enum.Enum):
    A = "A"
    B = "B"

class Bet(Base):
    __tablename__ = "bets"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    option = Column(Enum(BetOption), nullable=False)
    amount = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=func.current_timestamp())
    user = relationship("User", back_populates="bets")
    room = relationship("Room", back_populates="bets")
    __table_args__ = (Index("idx_bets_room_id", "room_id"),)