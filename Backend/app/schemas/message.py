from pydantic import BaseModel
from datetime import datetime

class MessageCreate(BaseModel):
    room_id: int
    content: str

class MessageResponse(BaseModel):
    id: int
    room_id: int
    user_id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class TestMessageCreate(BaseModel):
    room_id: int
    message: str