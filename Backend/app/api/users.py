from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.models.notification import Notification  # Added import
from app.schemas.user import UserCreate, UserResponse, Token, LoginRequest
from app.core.auth import create_access_token, create_refresh_token, get_current_user
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy import func
from jose import JWTError, jwt
import os
import logging
from typing import List  # Added for relationship typing

router = APIRouter()
logging.basicConfig(filename='log.txt', level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

class UserResponseWithNotifications(UserResponse):
    """Extended UserResponse that includes notifications"""
    notifications: List[dict] = []

def verify_password(plain_password: str, hashed_password: str) -> bool:
    logger.debug(f"Verifying password: hashed={hashed_password[:10]}...")
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password: str) -> str:
    logger.debug(f"Hashing password: using {pwd_context.default_scheme()}")
    try:
        hashed = pwd_context.hash(password)
        logger.debug(f"Hashed password: {hashed[:10]}...")
        return hashed
    except Exception as e:
        logger.error(f"Password hashing failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Password hashing failed")

@router.post("/", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user."""
    logger.debug(f"Creating user: email={user.email}, username={user.username}")
    try:
        existing_user = db.query(User).filter((User.email == user.email) | (User.username == user.username)).first()
        if existing_user:
            if existing_user.email == user.email:
                logger.error(f"Email already registered: {user.email}")
                raise HTTPException(status_code=400, detail="Email already registered")
            logger.error(f"Username already taken: {user.username}")
            raise HTTPException(status_code=400, detail="Username already taken")
        hashed_password = hash_password(user.password)
        db_user = User(
            email=user.email, 
            username=user.username, 
            password_hash=hashed_password, 
            coins=1000,
            notifications=[]  # Initialize empty notifications relationship
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        logger.info(f"User created: id={db_user.id}, username={db_user.username}")
        return db_user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/login", response_model=Token)
async def login(form_data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return access and refresh tokens."""
    logger.debug(f"Login attempt: email={form_data.email}, username={form_data.username}")
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
        logger.info(f"Login successful: user_id={user.id}, username={user.username}")
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/logout")
async def logout(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Invalidate all refresh tokens for the user."""
    logger.debug(f"Logout attempt: token={token[:10]}...")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            logger.debug("Token missing user_id")
            raise HTTPException(status_code=401, detail="Invalid token")
        refresh_tokens = db.query(RefreshToken).filter(
            RefreshToken.user_id == int(user_id),
            RefreshToken.expires_at > func.now()
        ).all()
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

@router.get("/me", response_model=UserResponseWithNotifications)
async def get_user_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch the authenticated user's profile with notifications."""
    logger.debug(f"Fetching profile for user_id={user.id}, username={user.username}")
    try:
        # Explicitly load notifications if they're not already loaded
        if not user.notifications:
            user.notifications = db.query(Notification).filter(
                Notification.user_id == user.id
            ).order_by(Notification.created_at.desc()).all()
        
        logger.info(f"User profile fetched: id={user.id}, username={user.username}")
        return {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "coins": user.coins,
            "notifications": [
                {
                    "id": n.id,
                    "type": n.type,
                    "message": n.message,
                    "created_at": n.created_at,
                    "resolved": n.resolved
                } for n in user.notifications
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching user profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/notifications", response_model=List[dict])
async def get_user_notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all notifications for the current user"""
    try:
        notifications = db.query(Notification).filter(
            Notification.user_id == user.id
        ).order_by(Notification.created_at.desc()).all()
        
        return [{
            "id": n.id,
            "type": n.type,
            "message": n.message,
            "created_at": n.created_at,
            "resolved": n.resolved,
            "bet_id": n.bet_id
        } for n in notifications]
    except Exception as e:
        logger.error(f"Error fetching notifications: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")