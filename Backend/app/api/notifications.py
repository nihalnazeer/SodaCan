from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.notification import Notification  # Import from models
from app.models.bet import Bet, BetStatus
from app.core.auth import get_current_user
from app.models.user import User
import logging
from datetime import datetime, timezone

router = APIRouter()
logging.basicConfig(filename='log.txt', level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

@router.get("/")
async def get_notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch notifications for the authenticated user."""
    try:
        notifications = db.query(Notification).filter(
            Notification.user_id == user.id
        ).all()
        for n in notifications:
            if n.bet_id:
                bet = db.query(Bet).filter(Bet.id == n.bet_id).first()
                n.bet_description = bet.description if bet else None
        logging.info(f"User {user.id} fetched {len(notifications)} notifications")
        return notifications
    except Exception as e:
        logging.error(f"Error fetching notifications for user {user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Keep this function here or move to services/notifications.py if used elsewhere
def create_bet_result_notification(bet: Bet, db: Session):
    """Create a notification for the moderator when a bet timer expires."""
    try:
        notification = Notification(
            user_id=bet.mediator_id,
            bet_id=bet.id,
            type="bet_result",
            message=f"Bet '{bet.description}' has ended. Please select the winner.",
            created_at=datetime.now(timezone.utc),
            resolved=False
        )
        db.add(notification)
        db.commit()
        logging.info(f"Notification created for bet {bet.id} for mediator {bet.mediator_id}")
    except Exception as e:
        logging.error(f"Error creating notification for bet {bet.id}: {str(e)}")
        db.rollback()