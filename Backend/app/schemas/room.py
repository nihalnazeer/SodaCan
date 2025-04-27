from pydantic import BaseModel
from typing import Optional

class RoomCreate(BaseModel):
    name: str

class RoomResponse(BaseModel):
    id: int
    creator_id: int
    name: str
    status: str
    is_public: bool
    token: Optional[str] = None

    class Config:
        from_attributes = True