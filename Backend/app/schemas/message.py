from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MessageCreate(BaseModel):
    room_id: int
    content: str

class MessageResponse(BaseModel):
    id: int
    room_id: int
    user_id: Optional[int]  # Allow None for system messages
    content: str
    created_at: datetime
    username: Optional[str] = None  # Include username for frontend

    class Config:
        from_attributes = True

class TestMessageCreate(BaseModel):
    room_id: int
    message: str