from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.bet import BetStatus, BetResult

class BetCreate(BaseModel):
    room_id: int
    description: str  # Matches Bet model's 'description'; replace with 'option' if that's the intended field
    amount: int
    end_time: datetime

class BetUpdate(BaseModel):
    status: BetStatus

class BetResponse(BaseModel):
    id: int
    room_id: int
    user_id: int
    description: str  # Matches Bet model's 'description'; replace with 'option' if needed
    amount: int
    status: BetStatus
    result: BetResult
    approved_by: Optional[int]
    created_at: datetime
    mediator_id: int
    start_time: datetime
    end_time: datetime
    username: Optional[str]
    mediator_username: Optional[str]
    approver_username: Optional[str]

    class Config:
        from_attributes = True