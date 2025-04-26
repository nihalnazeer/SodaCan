from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.models.base import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    coins = Column(Integer, default=1000)
    
    # Relationship to the rooms that the user created
    rooms = relationship("Room", back_populates="creator")
    
    # Relationship to the bets the user made
    bets = relationship("Bet", back_populates="user")
    
    # Relationship to the messages the user sent
    messages = relationship("Message", back_populates="user")
    
    # Relationship to the rooms where the user is a member
    room_memberships = relationship("RoomMember", back_populates="user")
