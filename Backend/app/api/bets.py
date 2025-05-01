from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging
from typing import List

logger = logging.getLogger(__name__)

try:
    from app.core.database import get_db
    from app.models.bet import Bet, BetStatus, BetResult
    from app.models.room_member import RoomMember, Role
    from app.models.user import User
    from app.schemas.bet import BetCreate, BetResponse
    from app.core.auth import get_current_user
except Exception as e:
    logger.error(f"Failed to import dependencies: {str(e)}", exc_info=True)
    raise

router = APIRouter(tags=["bets"])
logging.basicConfig(filename='log.txt', level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

@router.post("/", response_model=BetResponse)
async def create_bet(
    bet_data: BetCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Validate amount
        if bet_data.amount <= 0:
            logger.error(f"Invalid bet amount: {bet_data.amount}")
            raise HTTPException(status_code=400, detail="Amount must be positive")

        # Verify user is a member of the room
        member = db.query(RoomMember).filter(
            RoomMember.room_id == bet_data.room_id,
            RoomMember.user_id == user.id
        ).first()
        if not member:
            logger.error(f"User {user.id} is not a member of room {bet_data.room_id}")
            raise HTTPException(status_code=403, detail="User is not a member of this room")

        # Verify room exists
        from app.models.room import Room
        room = db.query(Room).filter(Room.id == bet_data.room_id).first()
        if not room:
            logger.error(f"Room {bet_data.room_id} not found")
            raise HTTPException(status_code=404, detail="Room not found")

        # Verify mediator exists
        mediator = db.query(User).filter(User.id == bet_data.mediator_id).first()
        if not mediator:
            logger.error(f"Mediator {bet_data.mediator_id} not found")
            raise HTTPException(status_code=404, detail="Mediator not found")

        # Verify end_time is in the future
        from datetime import datetime, timezone
        if bet_data.end_time <= datetime.now(timezone.utc):
            logger.error(f"End time {bet_data.end_time} is not in the future")
            raise HTTPException(status_code=400, detail="End time must be in the future")

        # Check user has enough coins
        if user.coins < bet_data.amount:
            logger.error(f"User {user.id} has insufficient coins: {user.coins} < {bet_data.amount}")
            raise HTTPException(status_code=400, detail="Insufficient coins")

        bet = Bet(
            room_id=bet_data.room_id,
            user_id=user.id,
            description=bet_data.description,
            amount=bet_data.amount,
            status=BetStatus.PENDING,
            result=BetResult.UNKNOWN,
            approved_by=None,
            mediator_id=bet_data.mediator_id,
            end_time=bet_data.end_time
        )
        db.add(bet)
        db.commit()
        db.refresh(bet)

        # Fetch usernames
        user_obj = db.query(User).filter(User.id == bet.user_id).first()
        mediator_obj = db.query(User).filter(User.id == bet.mediator_id).first()

        response = BetResponse(
            id=bet.id,
            room_id=bet.room_id,
            user_id=bet.user_id,
            user_username=user_obj.username if user_obj else "Unknown",
            description=bet.description,
            amount=bet.amount,
            status=bet.status,
            result=bet.result,
            approved_by=bet.approved_by,
            approved_by_username=None,
            mediator_id=bet.mediator_id,
            mediator_username=mediator_obj.username if mediator_obj else "Unknown",
            created_at=bet.created_at,
            start_time=bet.start_time,
            end_time=bet.end_time
        )
        
        logger.info(f"Bet {bet.id} created by user {user.id} in room {bet_data.room_id}")
        return response
    except Exception as e:
        logger.error(f"Error creating bet: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/", response_model=List[BetResponse])
async def get_bets(
    room_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Verify user is a member of the room
        member = db.query(RoomMember).filter(
            RoomMember.room_id == room_id,
            RoomMember.user_id == user.id
        ).first()
        if not member:
            logger.error(f"User {user.id} is not a member of room {room_id}")
            raise HTTPException(status_code=403, detail="User is not a member of this room")

        bets = db.query(Bet).filter(Bet.room_id == room_id).all()
        responses = []
        for bet in bets:
            user_obj = db.query(User).filter(User.id == bet.user_id).first()
            approver = db.query(User).filter(User.id == bet.approved_by).first() if bet.approved_by else None
            mediator = db.query(User).filter(User.id == bet.mediator_id).first()
            response = BetResponse(
                id=bet.id,
                room_id=bet.room_id,
                user_id=bet.user_id,
                user_username=user_obj.username if user_obj else "Unknown",
                description=bet.description,
                amount=bet.amount,
                status=bet.status,
                result=bet.result,
                approved_by=bet.approved_by,
                approved_by_username=approver.username if approver else None,
                mediator_id=bet.mediator_id,
                mediator_username=mediator.username if mediator else "Unknown",
                created_at=bet.created_at,
                start_time=bet.start_time,
                end_time=bet.end_time
            )
            responses.append(response)
        
        logger.info(f"User {user.id} fetched {len(bets)} bets for room {room_id}")
        return responses
    except Exception as e:
        logger.error(f"Error fetching bets for room {room_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")