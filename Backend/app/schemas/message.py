from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MessageCreate(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: int
    room_id: int
    user_id: int
    content: str
    created_at: datetime
    username: Optional[str] = None  # Include username for display

    class Config:
        orm_mode = True