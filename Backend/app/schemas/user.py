from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email : EmailStr
    username : str
    
class UserCreate(UserBase):
    password: str
    
class UserResponse(UserBase):
    id : int 
    coins : int
    
    class Config:
        from_attributes = True 