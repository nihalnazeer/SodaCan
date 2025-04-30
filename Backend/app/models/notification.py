# app/models/notification.py
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .base import Base
from datetime import datetime, timezone

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    bet_id = Column(Integer, ForeignKey("bets.id", ondelete="CASCADE"), nullable=True)
    type = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    resolved = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="notifications")
    bet = relationship("Bet", back_populates="notifications")