from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.core.auth import create_access_token
from pydantic import BaseModel, EmailStr, model_validator
from passlib.context import CryptContext
from typing import Union
from sqlalchemy import func
import logging

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def verify_password(plain_password, hashed_password):
    logger.debug(f"Verifying password: plain={plain_password[:3]}..., hashed={hashed_password[:10]}...")
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password):
    logger.debug(f"Hashing password: {password[:3]}...")
    hashed = pwd_context.hash(password)
    logger.debug(f"Hashed password: {hashed[:10]}...")
    return hashed

class LoginRequest(BaseModel):
    email: Union[EmailStr, None] = None
    username: Union[str, None] = None
    password: str

    class Config:
        extra = "forbid"

    @model_validator(mode="before")
    @classmethod
    def validate_one_of_email_or_username(cls, values):
        logger.debug(f"Validating LoginRequest: {values}")
        if not values.get("email") and not values.get("username"):
            raise ValueError("Either email or username must be provided")
        return values

@router.post("/", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    logger.debug(f"Creating user: email={user.email}, username={user.username}")
    existing_user = db.query(User).filter((User.email == user.email) | (User.username == user.username)).first()
    if existing_user:
        if existing_user.email == user.email:
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=400, detail="Username already taken")
    hashed_password = hash_password(user.password)
    db_user = User(email=user.email, username=user.username, password_hash=hashed_password, coins=1000)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    logger.debug(f"User created: id={db_user.id}")
    return db_user

@router.post("/login")
async def login(form_data: LoginRequest, db: Session = Depends(get_db)):
    logger.debug(f"Raw request body: {form_data}")
    logger.debug(f"Login attempt: email={form_data.email}, username={form_data.username}, password={form_data.password[:3]}...")
    query = db.query(User)
    if form_data.email:
        query = query.filter(func.lower(User.email) == func.lower(form_data.email))
    elif form_data.username:
        query = query.filter(func.lower(User.username) == func.lower(form_data.username))
    user = query.first()
    logger.debug(f"User query result: {user}")
    if not user:
        logger.debug("User not found")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(form_data.password, user.password_hash):
        logger.debug("Password verification failed")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": str(user.id)})
    logger.debug(f"Login successful: token={access_token[:10]}...")
    return {"access_token": access_token, "token_type": "bearer"}