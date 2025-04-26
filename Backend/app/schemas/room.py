from pydantic import BaseModel
from typing import Optional
from app.models.room import RoomStatus

class RoomCreate(BaseModel):
    name: str

class RoomResponse(BaseModel):
    id: int
    creator_id: int
    name: str
    status: RoomStatus  # Use RoomStatus enum
    is_public: bool
    token: Optional[str] = None

    class Config:
        from_attributes = True
        use_enum_values = True  # Serialize RoomStatus to its value ('OPEN', 'CLOSED')