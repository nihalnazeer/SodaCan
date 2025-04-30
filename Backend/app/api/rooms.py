from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.room import Room, RoomStatus
from app.models.room_member import RoomMember, Role
from app.models.user import User
from app.schemas.room import RoomCreate, RoomResponse
from app.core.auth import get_current_user
import logging
import uuid
from pydantic import BaseModel, constr
from sqlalchemy import func
from typing import Optional, List

router = APIRouter(prefix="/api/rooms", tags=["rooms"])
logging.basicConfig(filename='log.txt', level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

class RoomCreate(BaseModel):
    name: constr(min_length=3, strip_whitespace=True)
    description: Optional[str] = None

class RoomResponse(BaseModel):
    id: int
    creator_id: int
    name: str
    description: Optional[str]
    status: RoomStatus
    is_public: bool
    token: Optional[str]
    member_count: int

@router.get("/{room_id}", response_model=RoomResponse)
async def get_room_details(
    room_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            logging.error(f"Room {room_id} not found")
            raise HTTPException(status_code=404, detail="Room not found")
        if not room.is_public:
            member = db.query(RoomMember).filter(
                RoomMember.room_id == room_id,
                RoomMember.user_id == user.id
            ).first()
            if not member:
                logging.error(f"User {user.id} not authorized for private room {room_id}")
                raise HTTPException(status_code=403, detail="Not authorized to access this room")
        member_count = db.query(func.count(RoomMember.id)).filter(RoomMember.room_id == room_id).scalar()
        logging.info(f"User {user.id} fetched details for room {room_id}")
        return {**room.__dict__, "member_count": member_count}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching room {room_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/public", response_model=RoomResponse)
async def create_public_room(
    room_data: RoomCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    try:
        room = Room(
            creator_id=user.id,
            name=room_data.name,
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
        
        logging.info(f"Public room {room.id} created by user {user.id} with SUPERUSER role")
        return {**room.__dict__, "member_count": 1}
    except Exception as e:
        logging.error(f"Error creating public room: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/private", response_model=RoomResponse)
async def create_private_room(
    room_data: RoomCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    try:
        room = Room(
            creator_id=user.id,
            name=room_data.name,
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
        
        logging.info(f"Private room {room.id} created by user {user.id} with SUPERUSER role")
        return {**room.__dict__, "member_count": 1}
    except Exception as e:
        logging.error(f"Error creating private room: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal Server Error")

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
            logging.error(f"Room {room_id} not found")
            raise HTTPException(status_code=404, detail="Room not found")
        if not room.is_public and (not token or room.token != token):
            logging.error(f"Invalid token for private room {room_id}")
            raise HTTPException(status_code=403, detail="Invalid token")
        existing_member = db.query(RoomMember).filter(
            RoomMember.room_id == room_id,
            RoomMember.user_id == user.id
        ).first()
        if existing_member:
            logging.error(f"User {user.id} already in room {room_id}")
            raise HTTPException(status_code=400, detail="User already in room")
        room_member = RoomMember(
            room_id=room_id,
            user_id=user.id,
            role=Role.MEMBER
        )
        db.add(room_member)
        db.commit()
        logging.info(f"User {user.id} joined room {room_id} as MEMBER")
        return {"message": "Successfully joined room"}
    except Exception as e:
        logging.error(f"Error joining room {room_id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/", response_model=List[RoomResponse])
async def get_all_rooms(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        rooms = (
            db.query(Room, func.count(RoomMember.id).label("member_count"))
            .join(RoomMember, Room.id == RoomMember.room_id)
            .filter(RoomMember.user_id == user.id)
            .group_by(Room.id)
            .all()
        )
        logging.info(f"User {user.id} fetched {len(rooms)} rooms")
        return [{**room.__dict__, "member_count": member_count} for room, member_count in rooms]
    except Exception as e:
        logging.error(f"Error fetching rooms for user {user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/public/view", response_model=List[RoomResponse])
async def get_public_rooms(db: Session = Depends(get_db)):
    try:
        rooms = (
            db.query(Room, func.count(RoomMember.id).label("member_count"))
            .outerjoin(RoomMember, Room.id == RoomMember.room_id)
            .filter(Room.is_public == True)
            .group_by(Room.id)
            .all()
        )
        logging.info(f"Fetched {len(rooms)} public rooms")
        return [{**room.__dict__, "member_count": member_count} for room, member_count in rooms]
    except Exception as e:
        logging.error(f"Error fetching public rooms: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/private", response_model=List[RoomResponse])
async def get_private_rooms(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        rooms = (
            db.query(Room, func.count(RoomMember.id).label("member_count"))
            .join(RoomMember, Room.id == RoomMember.room_id)
            .filter(RoomMember.user_id == user.id, Room.is_public == False)
            .group_by(Room.id)
            .all()
        )
        logging.info(f"User {user.id} fetched {len(rooms)} private rooms")
        return [{**room.__dict__, "member_count": member_count} for room, member_count in rooms]
    except Exception as e:
        logging.error(f"Error fetching private rooms for user {user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/search/{token}", response_model=RoomResponse)
async def search_private_room(token: str, db: Session = Depends(get_db)):
    try:
        room = (
            db.query(Room, func.count(RoomMember.id).label("member_count"))
            .outerjoin(RoomMember, Room.id == RoomMember.room_id)
            .filter(Room.token == token, Room.is_public == False)
            .group_by(Room.id)
            .first()
        )
        if not room:
            logging.error(f"Private room with token {token} not found")
            raise HTTPException(status_code=404, detail="Room not found")
        room_obj, member_count = room
        logging.info(f"Found private room with token {token}")
        return {**room_obj.__dict__, "member_count": member_count}
    except Exception as e:
        logging.error(f"Error searching for room with token {token}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/room/{room_id}/members")
async def get_room_members(
    room_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        is_member = db.query(RoomMember).filter(
            RoomMember.room_id == room_id,
            RoomMember.user_id == user.id
        ).first()
        if not is_member:
            logging.error(f"User {user.id} is not a member of room {room_id}")
            raise HTTPException(status_code=403, detail="User is not a member of this room")
        members = db.query(RoomMember).filter(RoomMember.room_id == room_id).all()
        result = [{"id": m.user_id, "username": db.query(User).filter(User.id == m.user_id).first().username} for m in members]
        logging.info(f"User {user.id} fetched {len(members)} members for room {room_id}")
        return result
    except Exception as e:
        logging.error(f"Error fetching members for room {room_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.delete("/public/{room_id}")
async def delete_public_room(
    room_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        room = db.query(Room).filter(Room.id == room_id, Room.is_public == True).first()
        if not room:
            logging.error(f"Public room {room_id} not found")
            raise HTTPException(status_code=404, detail="Room not found")
        if room.creator_id != user.id:
            logging.error(f"User {user.id} is not the creator of room {room_id}")
            raise HTTPException(status_code=403, detail="Only the creator can delete the room")
        db.delete(room)
        db.commit()
        logging.info(f"Public room {room_id} deleted by user {user.id}")
        return {"message": "Room deleted successfully"}
    except Exception as e:
        logging.error(f"Error deleting public room {room_id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.delete("/private/{token}")
async def delete_private_room(
    token: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        room = db.query(Room).filter(Room.token == token, Room.is_public == False).first()
        if not room:
            logging.error(f"Private room with token {token} not found")
            raise HTTPException(status_code=404, detail="Room not found")
        if room.creator_id != user.id:
            logging.error(f"User {user.id} is not the creator of room {room.id}")
            raise HTTPException(status_code=403, detail="Only the creator can delete the room")
        db.delete(room)
        db.commit()
        logging.info(f"Private room {room.id} deleted by user {user.id}")
        return {"message": "Room deleted successfully"}
    except Exception as e:
        logging.error(f"Error deleting private room with token {token}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal Server Error")