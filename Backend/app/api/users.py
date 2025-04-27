from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.schemas.user import UserCreate, UserResponse, Token, LoginRequest  # Added Token
from app.core.auth import create_access_token, create_refresh_token, get_current_user
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr, model_validator
from passlib.context import CryptContext
from typing import Union
from sqlalchemy import func
from jose import JWTError, jwt
import os
import logging

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
logging.basicConfig(filename='log.txt', level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

def verify_password(plain_password, hashed_password):
    logger.debug(f"Verifying password: plain={plain_password[:3]}..., hashed={hashed_password[:10]}...")
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password):
    logger.debug(f"Hashing password: {password[:3]}..., using backend: {pwd_context.default_scheme()}")
    try:
        hashed = pwd_context.hash(password)
        logger.debug(f"Hashed password: {hashed[:10]}...")
        return hashed
    except Exception as e:
        logger.error(f"Password hashing failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Password hashing failed")

@router.post("/", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    logger.debug(f"Creating user: email={user.email}, username={user.username}")
    try:
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
        logger.info(f"User created: id={db_user.id}")
        return db_user
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/login", response_model=Token)  # Fixed: Added response_model=Token
async def login(form_data: LoginRequest, db: Session = Depends(get_db)):
    logger.debug(f"Login attempt: email={form_data.email}, username={form_data.username}, password={form_data.password[:3]}...")
    try:
        query = db.query(User)
        if form_data.email:
            query = query.filter(func.lower(User.email) == func.lower(form_data.email))
        elif form_data.username:
            query = query.filter(func.lower(User.username) == func.lower(form_data.username))
        user = query.first()
        if not user:
            logger.debug("User not found")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        if not verify_password(form_data.password, user.password_hash):
            logger.debug("Password verification failed")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)}, db=db, user_id=user.id)
        logger.info(f"Login successful: user_id={user.id}, token={access_token[:10]}...")
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}
    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/logout")
async def logout(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    logger.debug(f"User logging out: token={token[:10]}...")
    try:
        # Decode access token to get user ID
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            logger.debug("Token missing user_id")
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Invalidate all refresh tokens for the user
        refresh_tokens = db.query(RefreshToken).filter(
            RefreshToken.user_id == int(user_id),
            RefreshToken.expires_at > func.now()
        ).all()
        if not refresh_tokens:
            logger.debug(f"No valid refresh tokens found for user_id={user_id}")
            raise HTTPException(status_code=400, detail="No active refresh tokens found")
        
        for refresh_token in refresh_tokens:
            db.delete(refresh_token)
        db.commit()
        logger.info(f"User {user_id} logged out: invalidated {len(refresh_tokens)} refresh tokens")
        return {"message": "Logged out successfully"}
    except JWTError as e:
        logger.error(f"JWT error during logout: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Error during logout: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/me", response_model=UserResponse)
async def get_user_profile(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    logger.debug(f"Fetching user profile: token={token[:10]}...")
    try:
        # Decode the token to get the user ID
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            logger.debug("Token missing user_id")
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            logger.debug(f"User with id={user_id} not found")
            raise HTTPException(status_code=404, detail="User not found")
        
        logger.info(f"User profile fetched: id={user.id}")
        return user
    except JWTError as e:
        logger.error(f"JWT error during profile fetch: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Error fetching user profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
