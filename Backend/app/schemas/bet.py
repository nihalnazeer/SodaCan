from pydantic import BaseModel

class BetResponse(BaseModel):
    id: int
    user_id: int
    room_id: int
    amount: int
    option: str

    class Config:
        from_attributes = True