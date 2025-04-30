from pydantic import BaseModel, EmailStr, model_validator
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

    model_config = {"extra": "forbid"}

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    coins: int

    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class LoginRequest(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: str

    model_config = {"extra": "forbid"}

    @model_validator(mode='before')
    def validate_one_of_email_or_username(cls, values):
        if not values.get("email") and not values.get("username"):
            raise ValueError("Either email or username must be provided")
        return values