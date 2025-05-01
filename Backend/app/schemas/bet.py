from pydantic import BaseModel, StringConstraints
from typing import Annotated, Optional
from datetime import datetime
from enum import Enum

class BetStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class BetResult(str, Enum):
    UNKNOWN = "UNKNOWN"
    WON = "WON"
    LOST = "LOST"
    DRAW = "DRAW"

class BetCreate(BaseModel):
    description: Annotated[str, StringConstraints(min_length=3, strip_whitespace=True)]
    amount: int
    room_id: int
    mediator_id: int
    end_time: datetime

class BetResponse(BaseModel):
    id: int
    room_id: int
    user_id: int
    user_username: str
    description: str
    amount: int
    status: BetStatus
    result: BetResult
    approved_by: Optional[int] = None
    approved_by_username: Optional[str] = None
    mediator_id: int
    mediator_username: str
    created_at: datetime
    start_time: datetime
    end_time: datetime

    model_config = {"from_attributes": True}