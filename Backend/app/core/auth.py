from fastapi import Depends, HTTPException, APIRouter
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.user import User
from app.models.refresh_token import RefreshToken
from dotenv import load_dotenv
import os
import logging
from sqlalchemy import func  # Added for func.now()

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter()

# Load .env file
load_dotenv()

# JWT configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 90))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 3))

if not SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY not found in .env file")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")

def create_access_token(data: dict):
    logger.debug(f"Creating access token for data: {data}")
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    logger.debug(f"Access token created: {encoded_jwt[:10]}...")
    return encoded_jwt

def create_refresh_token(data: dict, db: Session, user_id: int):
    logger.debug(f"Creating refresh token for user_id: {user_id}")
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    # Store refresh token in database
    db_token = RefreshToken(user_id=user_id, token=encoded_jwt, expires_at=expire)
    db.add(db_token)
    db.commit()
    logger.debug(f"Refresh token stored: {encoded_jwt[:10]}...")
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    logger.debug(f"Validating token: {token[:10]}...")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            logger.debug("Token missing user_id")
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.query(User).filter(User.id == int(user_id)).first()
        if user is None:
            logger.debug(f"User not found: id={user_id}")
            raise HTTPException(status_code=401, detail="User not found")
        logger.debug(f"User authenticated: id={user_id}")
        return user
    except JWTError as e:
        logger.debug(f"JWT error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/refresh")
async def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    """Refresh access token using a refresh token."""
    logger.debug(f"Refreshing token: {refresh_token[:10]}...")
    try:
        # Verify refresh token
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            logger.debug("Refresh token missing user_id")
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        # Check if refresh token exists in database
        db_token = db.query(RefreshToken).filter(
            RefreshToken.token == refresh_token,
            RefreshToken.user_id == int(user_id),
            RefreshToken.expires_at > func.now()  # Fixed: Use SQLAlchemy's func.now()
        ).first()
        if not db_token:
            logger.debug("Refresh token invalid or expired")
            raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
        
        # Generate new access token
        access_token = create_access_token({"sub": user_id})
        
        # Generate new refresh token and replace the old one
        new_refresh_token = create_refresh_token({"sub": user_id}, db, int(user_id))
        db.delete(db_token)  # Remove old refresh token
        db.commit()
        
        logger.debug(f"Tokens refreshed: access={access_token[:10]}..., refresh={new_refresh_token[:10]}...")
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }
    except JWTError as e:
        logger.debug(f"JWT error in refresh: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid refresh token")