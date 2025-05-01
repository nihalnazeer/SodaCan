from pydantic import BaseModel, StringConstraints, Field
from typing import Annotated, Optional, List
from datetime import datetime
from enum import Enum

class RoomStatus(str, Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"

class RoomCreate(BaseModel):
    name: Annotated[str, StringConstraints(min_length=3, max_length=100, strip_whitespace=True)]
    description: Optional[Annotated[str, StringConstraints(max_length=500)]] = Field(
        None,
        description="Optional description of the room (max 500 characters)"
    )
    is_public: bool = Field(
        default=True,
        description="Whether the room is publicly visible"
    )

class RoomUpdate(BaseModel):
    name: Optional[Annotated[str, StringConstraints(min_length=3, max_length=100, strip_whitespace=True)]] = None
    description: Optional[Annotated[str, StringConstraints(max_length=500)]] = Field(
        None,
        description="Optional description of the room (max 500 characters)"
    )
    status: Optional[RoomStatus] = None
    is_public: Optional[bool] = None

class RoomResponse(BaseModel):
    id: int
    creator_id: int
    name: str
    description: Optional[str]
    status: RoomStatus
    is_public: bool
    token: Optional[str]
    member_count: int = Field(..., description="Number of members in the room")
    created_at: datetime
    updated_at: Optional[datetime] = Field(
        None,
        description="Timestamp of last update"
    )

    model_config = {"from_attributes": True}

class RoomOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_public: bool
    token: Optional[str]
    member_count: int
    status: RoomStatus

    model_config = {"from_attributes": True}

class RoomMemberOut(BaseModel):
    id: int
    username: str
    is_creator: bool = Field(
        False,
        description="Whether this member is the room creator"
    )

    model_config = {"from_attributes": True}