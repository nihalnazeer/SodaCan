from pydantic import BaseModel, EmailStr, root_validator
from typing import Optional  # Use Optional instead of Union for Pydantic v1

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

    class Config:
        extra = "forbid"

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    coins: int

    class Config:
        orm_mode = True  # Pydantic v1 uses orm_mode instead of from_attributes

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class LoginRequest(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: str

    class Config:
        extra = "forbid"

    @root_validator(pre=True)
    def validate_one_of_email_or_username(cls, values):
        if not values.get("email") and not values.get("username"):
            raise ValueError("Either email or username must be provided")
        return values