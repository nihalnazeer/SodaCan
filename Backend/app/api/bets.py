from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.bet import Bet, BetStatus, BetResult
from app.models.user import User
from app.models.room import Room
from app.models.room_member import RoomMember, Role
from app.schemas.bet import BetCreate, BetResponse, BetUpdate
from app.core.auth import get_current_user
import logging
from datetime import datetime, timezone

router = APIRouter()
logging.basicConfig(filename='log.txt', level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

@router.post("/", response_model=BetResponse)
async def create_bet(
    bet_data: BetCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new bet in a room, assigning the room's SUPERUSER as the mediator."""
    try:
        # Validate user coins
        if user.coins < bet_data.amount:
            logging.error(f"User {user.id} has insufficient coins: {user.coins} < {bet_data.amount}")
            raise HTTPException(status_code=400, detail="Insufficient coins")

        # Validate room exists
        room = db.query(Room).filter(Room.id == bet_data.room_id).first()
        if not room:
            logging.error(f"Room {bet_data.room_id} not found")
            raise HTTPException(status_code=404, detail="Room not found")

        # Check if user is a room member
        is_member = db.query(RoomMember).filter(
            RoomMember.room_id == bet_data.room_id,
            RoomMember.user_id == user.id
        ).first()
        if not is_member:
            logging.error(f"User {user.id} is not a member of room {bet_data.room_id}")
            raise HTTPException(status_code=403, detail="User is not a room member")

        # Select the SUPERUSER as mediator
        superuser = db.query(RoomMember).filter(
            RoomMember.room_id == bet_data.room_id,
            RoomMember.role == Role.SUPERUSER
        ).first()
        if not superuser:
            logging.error(f"No SUPERUSER found for room {bet_data.room_id}")
            raise HTTPException(status_code=400, detail="No SUPERUSER available in the room")

        # Create bet
        bet = Bet(
            room_id=bet_data.room_id,
            user_id=user.id,
            description=bet_data.description,
            amount=bet_data.amount,
            status=BetStatus.PENDING,
            result=BetResult.UNKNOWN,
            mediator_id=superuser.user_id,
            start_time=datetime.now(timezone.utc),
            end_time=bet_data.end_time
        )
        db.add(bet)
        db.commit()
        db.refresh(bet)

        # Populate response with usernames
        bet.username = user.username
        mediator = db.query(User).filter(User.id == superuser.user_id).first()
        bet.mediator_username = mediator.username if mediator else None

        logging.info(f"Bet {bet.id} created by user {user.id} in room {bet_data.room_id} with SUPERUSER mediator {superuser.user_id}")
        return bet
    except Exception as e:
        logging.error(f"Error creating bet for user {user.id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/", response_model=list[BetResponse])
async def get_bets(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all bets for the authenticated user."""
    try:
        bets = db.query(Bet).filter(Bet.user_id == user.id).all()
        for bet in bets:
            bet.username = user.username
            mediator = db.query(User).filter(User.id == bet.mediator_id).first()
            bet.mediator_username = mediator.username if mediator else None
            if bet.approved_by:
                approver = db.query(User).filter(User.id == bet.approved_by).first()
                bet.approver_username = approver.username if approver else None
        logging.info(f"User {user.id} fetched {len(bets)} bets")
        return bets
    except Exception as e:
        logging.error(f"Error fetching bets for user {user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/rooms/{room_id}", response_model=list[BetResponse])
async def get_room_bets(
    room_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all bets in a room, showing APPROVED bets to non-admins."""
    try:
        # Check if user is a room member
        is_member = db.query(RoomMember).filter(
            RoomMember.room_id == room_id,
            RoomMember.user_id == user.id
        ).first()
        if not is_member:
            logging.error(f"User {user.id} is not a member of room {room_id}")
            raise HTTPException(status_code=403, detail="User is not a room member")

        # Check if user is SUPERUSER or ADMIN
        is_admin = db.query(RoomMember).filter(
            RoomMember.room_id == room_id,
            RoomMember.user_id == user.id,
            RoomMember.role.in_([Role.SUPERUSER, Role.ADMIN])
        ).first()

        # Fetch bets based on role
        query = db.query(Bet).filter(Bet.room_id == room_id)
        if not is_admin:
            query = query.filter(Bet.status == BetStatus.APPROVED)
        bets = query.all()

        # Populate usernames
        for bet in bets:
            bet_user = db.query(User).filter(User.id == bet.user_id).first()
            bet.username = bet_user.username if bet_user else None
            mediator = db.query(User).filter(User.id == bet.mediator_id).first()
            bet.mediator_username = mediator.username if mediator else None
            if bet.approved_by:
                approver = db.query(User).filter(User.id == bet.approved_by).first()
                bet.approver_username = approver.username if approver else None

        logging.info(f"User {user.id} fetched {len(bets)} bets for room {room_id}")
        return bets
    except Exception as e:
        logging.error(f"Error fetching bets for room {room_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.patch("/{bet_id}", response_model=BetResponse)
async def update_bet(
    bet_id: int,
    update_data: BetUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Approve or reject a bet, restricted to SUPERUSER or ADMIN."""
    try:
        bet = db.query(Bet).filter(Bet.id == bet_id).first()
        if not bet:
            logging.error(f"Bet {bet_id} not found")
            raise HTTPException(status_code=404, detail="Bet not found")

        # Verify user is SUPERUSER or ADMIN for the room
        is_admin = db.query(RoomMember).filter(
            RoomMember.room_id == bet.room_id,
            RoomMember.user_id == user.id,
            RoomMember.role.in_([Role.SUPERUSER, Role.ADMIN])
        ).first()
        if not is_admin:
            logging.error(f"User {user.id} is not a SUPERUSER or ADMIN for room {bet.room_id}")
            raise HTTPException(status_code=403, detail="User is not a SUPERUSER or ADMIN")

        # Validate status transition
        if bet.status != BetStatus.PENDING:
            logging.error(f"Bet {bet_id} is not in PENDING status: {bet.status}")
            raise HTTPException(status_code=400, detail="Bet is not pending")
        if update_data.status not in [BetStatus.APPROVED, BetStatus.REJECTED]:
            logging.error(f"Invalid status update for bet {bet_id}: {update_data.status}")
            raise HTTPException(status_code=400, detail="Invalid status")

        # Update bet status
        bet.status = update_data.status
        if update_data.status == BetStatus.APPROVED:
            bet.approved_by = user.id
            # Deduct coins from user
            bet_user = db.query(User).filter(User.id == bet.user_id).first()
            if bet_user.coins < bet.amount:
                logging.error(f"User {bet_user.id} has insufficient coins for bet {bet_id}")
                raise HTTPException(status_code=400, detail="User has insufficient coins")
            bet_user.coins -= bet.amount
            db.add(bet_user)

        db.add(bet)
        db.commit()
        db.refresh(bet)

        # Populate usernames
        bet_user = db.query(User).filter(User.id == bet.user_id).first()
        bet.username = bet_user.username if bet_user else None
        mediator = db.query(User).filter(User.id == bet.mediator_id).first()
        bet.mediator_username = mediator.username if mediator else None
        if bet.approved_by:
            approver = db.query(User).filter(User.id == bet.approved_by).first()
            bet.approver_username = approver.username if approver else None

        logging.info(f"Bet {bet_id} updated to {update_data.status} by user {user.id}")
        return bet
    except Exception as e:
        logging.error(f"Error updating bet {bet_id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal Server Error")