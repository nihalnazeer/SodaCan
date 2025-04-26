from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base

class RoomMember(Base):
    __tablename__ = "room_members"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    
    # Relationship to the user who is a member of the room
    user = relationship("User", back_populates="room_memberships")
    
    # Relationship to the room where the user is a member
    room = relationship("Room", back_populates="members")
