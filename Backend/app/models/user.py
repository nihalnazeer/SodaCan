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
    
  
    rooms = relationship("Room", back_populates="creator")
    
   
    bets = relationship("Bet", back_populates="user")
    
    
    messages = relationship("Message", back_populates="user")
    
    
    room_memberships = relationship("RoomMember", back_populates="user")
