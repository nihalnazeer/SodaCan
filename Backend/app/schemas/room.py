from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class RoomStatus(str, Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"

class RoomBase(BaseModel):
    name: str
    is_public: bool

class RoomCreate(RoomBase):
    pass

class RoomResponse(RoomBase):
    id: int
    creator_id: int
    status: RoomStatus
    token: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True