from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class RoomMember(Base):
    __tablename__ = "room_members"
    
    id = Column(Integer, primary_key=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    room = relationship("Room", back_populates="members")
    user = relationship("User", back_populates="room_memberships")  # Matches User.room_memberships