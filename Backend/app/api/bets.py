from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.bet import Bet
from app.schemas.bet import BetResponse
from app.core.auth import get_current_user
from app.models.user import User
import logging

router = APIRouter()
logging.basicConfig(filename='log.txt', level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

@router.get("/", response_model=list[BetResponse])
async def get_bets(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all bets for the authenticated user."""
    try:
        bets = db.query(Bet).filter(Bet.user_id == user.id).all()
        logging.info(f"User {user.id} fetched {len(bets)} bets")
        return bets
    except Exception as e:
        logging.error(f"Error fetching bets for user {user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")