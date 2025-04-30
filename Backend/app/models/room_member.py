from sqlalchemy import Column, Integer, ForeignKey, Enum
from sqlalchemy.orm import relationship
from .base import Base
import enum

class Role(enum.Enum):
    SUPERUSER = "SUPERUSER"
    MEMBER = "MEMBER"
    ADMIN = "ADMIN"

class RoomMember(Base):
    __tablename__ = "room_members"
    
    id = Column(Integer, primary_key=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(Enum(Role, name="role"), nullable=False, default=Role.MEMBER)

    # Relationships
    room = relationship("Room", back_populates="members")
    user = relationship("User", back_populates="room_memberships")

    def is_superuser(self):
        return self.role == Role.SUPERUSER
    
    def is_admin(self):
        return self.role in [Role.SUPERUSER, Role.ADMIN]