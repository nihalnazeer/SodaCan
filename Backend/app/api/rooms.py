from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging
import uuid
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

try:
    from app.core.database import get_db
    from app.models.room import Room, RoomStatus
    from app.models.room_member import RoomMember, Role
    from app.models.user import User
    from app.schemas.room import RoomCreate, RoomResponse, RoomMemberOut
    from app.core.auth import get_current_user
except Exception as e:
    logger.error(f"Failed to import dependencies: {str(e)}", exc_info=True)
    raise

router = APIRouter(tags=["rooms"])
logging.basicConfig(filename='log.txt', level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger.debug("Loading rooms.py module")

# Helper function to create RoomResponse
def create_room_response(room: Room, member_count: int) -> RoomResponse:
    return RoomResponse(
        id=room.id,
        creator_id=room.creator_id,
        name=room.name,
        description=room.description,
        status=room.status,
        is_public=room.is_public,
        token=room.token,
        member_count=member_count,
        created_at=room.created_at,
        updated_at=room.updated_at
    )

@router.get("/me", response_model=List[RoomResponse])
async def get_user_rooms(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        rooms_with_counts = db.query(
            Room,
            func.count(RoomMember.id).label("member_count")
        ).join(
            RoomMember,
            Room.id == RoomMember.room_id
        ).filter(
            RoomMember.user_id == user.id
        ).group_by(Room.id).all()

        result = [create_room_response(room, member_count) for room, member_count in rooms_with_counts]
        logger.info(f"Successfully fetched {len(result)} rooms for user {user.id}")
        return result

    except Exception as e:
        logger.error(f"Error fetching rooms for user {user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch user rooms. Please try again later."
        )

@router.get("/public/view", response_model=List[RoomResponse])
async def get_public_rooms(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    try:
        rooms_with_counts = db.query(
            Room,
            func.count(RoomMember.id).label("member_count")
        ).outerjoin(
            RoomMember,
            Room.id == RoomMember.room_id
        ).filter(
            Room.is_public == True,
            Room.status == RoomStatus.OPEN
        ).group_by(Room.id).offset(skip).limit(limit).all()

        result = [create_room_response(room, member_count) for room, member_count in rooms_with_counts]
        logger.info(f"Successfully fetched {len(result)} public rooms")
        return result

    except Exception as e:
        logger.error(f"Error fetching public rooms: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch public rooms. Please try again later."
        )

@router.post("/public", response_model=RoomResponse)
async def create_public_room(
    room_data: RoomCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        room = Room(
            creator_id=user.id,
            name=room_data.name,
            description=room_data.description,
            status=RoomStatus.OPEN,
            is_public=True,
            token=None
        )
        db.add(room)
        db.commit()
        db.refresh(room)
        
        room_member = RoomMember(
            room_id=room.id,
            user_id=user.id,
            role=Role.SUPERUSER
        )
        db.add(room_member)
        db.commit()
        
        logger.info(f"Public room {room.id} created by user {user.id}")
        return create_room_response(room, 1)  # New room has 1 member (creator)

    except Exception as e:
        logger.error(f"Error creating public room: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to create public room. Please try again later."
        )

@router.post("/private", response_model=RoomResponse)
async def create_private_room(
    room_data: RoomCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        room = Room(
            creator_id=user.id,
            name=room_data.name,
            description=room_data.description,
            status=RoomStatus.OPEN,
            is_public=False,
            token=str(uuid.uuid4())
        )
        db.add(room)
        db.commit()
        db.refresh(room)
        
        room_member = RoomMember(
            room_id=room.id,
            user_id=user.id,
            role=Role.SUPERUSER
        )
        db.add(room_member)
        db.commit()
        
        logger.info(f"Private room {room.id} created by user {user.id}")
        return create_room_response(room, 1)  # New room has 1 member (creator)

    except Exception as e:
        logger.error(f"Error creating private room: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to create private room. Please try again later."
        )

@router.post("/{room_id}/join", response_model=dict)
async def join_room(
    room_id: int,
    token: str = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            logger.error(f"Room {room_id} not found")
            raise HTTPException(status_code=404, detail="Room not found")
        
        if not room.is_public and (not token or room.token != token):
            logger.error(f"Invalid token for private room {room_id}")
            raise HTTPException(status_code=403, detail="Invalid token")
        
        existing_member = db.query(RoomMember).filter(
            RoomMember.room_id == room_id,
            RoomMember.user_id == user.id
        ).first()
        
        if existing_member:
            logger.error(f"User {user.id} already in room {room_id}")
            raise HTTPException(status_code=400, detail="User already in room")
        
        room_member = RoomMember(
            room_id=room_id,
            user_id=user.id,
            role=Role.MEMBER
        )
        db.add(room_member)
        db.commit()
        
        logger.info(f"User {user.id} joined room {room_id}")
        return {"message": "Successfully joined room"}

    except Exception as e:
        logger.error(f"Error joining room {room_id}: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to join room. Please try again later."
        )

@router.get("/{room_id}", response_model=RoomResponse)
async def get_room_details(
    room_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            logger.error(f"Room {room_id} not found")
            raise HTTPException(status_code=404, detail="Room not found")
        
        if not room.is_public:
            member = db.query(RoomMember).filter(
                RoomMember.room_id == room_id,
                RoomMember.user_id == user.id
            ).first()
            if not member:
                logger.error(f"User {user.id} not authorized for private room {room_id}")
                raise HTTPException(status_code=403, detail="Not authorized to access this room")
        
        member_count = db.query(func.count(RoomMember.id)).filter(RoomMember.room_id == room_id).scalar()
        logger.info(f"User {user.id} fetched details for room {room_id}")
        return create_room_response(room, member_count)

    except Exception as e:
        logger.error(f"Error fetching room {room_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch room details. Please try again later."
        )

@router.get("/private", response_model=List[RoomResponse])
async def get_private_rooms(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        rooms_with_counts = db.query(
            Room,
            func.count(RoomMember.id).label("member_count")
        ).join(
            RoomMember,
            Room.id == RoomMember.room_id
        ).filter(
            RoomMember.user_id == user.id,
            Room.is_public == False
        ).group_by(Room.id).all()

        result = [create_room_response(room, member_count) for room, member_count in rooms_with_counts]
        logger.info(f"User {user.id} fetched {len(result)} private rooms")
        return result

    except Exception as e:
        logger.error(f"Error fetching private rooms for user {user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch private rooms. Please try again later."
        )

@router.get("/search/{token}", response_model=RoomResponse)
async def search_private_room(
    token: str,
    db: Session = Depends(get_db)
):
    try:
        room_with_count = db.query(
            Room,
            func.count(RoomMember.id).label("member_count")
        ).outerjoin(
            RoomMember,
            Room.id == RoomMember.room_id
        ).filter(
            Room.token == token,
            Room.is_public == False
        ).group_by(Room.id).first()

        if not room_with_count:
            logger.error(f"Private room with token {token} not found")
            raise HTTPException(status_code=404, detail="Room not found")
        
        room, member_count = room_with_count
        logger.info(f"Found private room with token {token}")
        return create_room_response(room, member_count)

    except Exception as e:
        logger.error(f"Error searching for room with token {token}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to search for room. Please try again later."
        )

@router.get("/room/{room_id}/members", response_model=List[RoomMemberOut])
async def get_room_members(
    room_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Verify user is member of the room
        is_member = db.query(RoomMember).filter(
            RoomMember.room_id == room_id,
            RoomMember.user_id == user.id
        ).first()
        if not is_member:
            logger.error(f"User {user.id} is not a member of room {room_id}")
            raise HTTPException(status_code=403, detail="User is not a member of this room")
        
        # Get all members
        members = db.query(RoomMember).filter(RoomMember.room_id == room_id).all()
        creator_id = db.query(Room.creator_id).filter(Room.id == room_id).scalar()
        
        result = [
            RoomMemberOut(
                id=m.user_id,
                username=db.query(User).filter(User.id == m.user_id).first().username,
                is_creator=(m.user_id == creator_id)
            )
            for m in members
        ]
        
        logger.info(f"User {user.id} fetched {len(result)} members for room {room_id}")
        return result

    except Exception as e:
        logger.error(f"Error fetching members for room {room_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch room members. Please try again later."
        )

@router.delete("/public/{room_id}")
async def delete_public_room(
    room_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        room = db.query(Room).filter(Room.id == room_id, Room.is_public == True).first()
        if not room:
            logger.error(f"Public room {room_id} not found")
            raise HTTPException(status_code=404, detail="Room not found")
        
        if room.creator_id != user.id:
            logger.error(f"User {user.id} is not the creator of room {room_id}")
            raise HTTPException(status_code=403, detail="Only the creator can delete the room")
        
        db.delete(room)
        db.commit()
        logger.info(f"Public room {room_id} deleted by user {user.id}")
        return {"message": "Room deleted successfully"}

    except Exception as e:
        logger.error(f"Error deleting public room {room_id}: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to delete room. Please try again later."
        )

@router.delete("/private/{token}")
async def delete_private_room(
    token: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        room = db.query(Room).filter(Room.token == token, Room.is_public == False).first()
        if not room:
            logger.error(f"Private room with token {token} not found")
            raise HTTPException(status_code=404, detail="Room not found")
        
        if room.creator_id != user.id:
            logger.error(f"User {user.id} is not the creator of room {room.id}")
            raise HTTPException(status_code=403, detail="Only the creator can delete the room")
        
        db.delete(room)
        db.commit()
        logger.info(f"Private room {room.id} deleted by user {user.id}")
        return {"message": "Room deleted successfully"}

    except Exception as e:
        logger.error(f"Error deleting private room with token {token}: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to delete room. Please try again later."
        )