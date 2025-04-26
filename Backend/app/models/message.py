from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.current_timestamp())
    room = relationship("Room", back_populates="messages")
    user = relationship("User", back_populates="messages")
    __table_args__ = (Index("idx_messages_room_id", "room_id"),)