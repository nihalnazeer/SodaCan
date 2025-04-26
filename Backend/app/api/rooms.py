from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.room import Room, RoomStatus
from app.models.user import User
from app.models.room_member import RoomMember
from app.schemas.room import RoomCreate, RoomResponse
from app.core.auth import get_current_user
import uuid
import logging

# Configure logging
logging.basicConfig(filename='log.txt', level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

router = APIRouter()

@router.post("/public", response_model=RoomResponse)
async def create_public_room(room: RoomCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a public room with a name, visible to all users."""
    try:
        db_room = Room(
            creator_id=user.id,
            name=room.name,
            status=RoomStatus.OPEN,
            is_public=True,
            token=None
        )
        db.add(db_room)
        db.commit()
        db.refresh(db_room)
        logging.info(f"User {user.id} created public room {db_room.id}: {room.name}")
        return db_room
    except Exception as e:
        logging.error(f"Error creating public room: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/private", response_model=RoomResponse)
async def create_private_room(room: RoomCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a private room with a name, generates a unique token (room number)."""
    try:
        token = str(uuid.uuid4())
        db_room = Room(
            creator_id=user.id,
            name=room.name,
            status=RoomStatus.OPEN,
            is_public=False,
            token=token
        )
        db.add(db_room)
        db.commit()
        db.refresh(db_room)
        logging.info(f"User {user.id} created private room {db_room.id}: {room.name}")
        return db_room
    except Exception as e:
        logging.error(f"Error creating private room: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/public", response_model=list[RoomResponse])
async def get_public_rooms(db: Session = Depends(get_db)):
    """List all public, open rooms."""
    try:
        rooms = db.query(Room).filter(Room.is_public == True, Room.status == RoomStatus.OPEN).all()
        logging.info(f"Fetched {len(rooms)} public rooms")
        return rooms
    except Exception as e:
        logging.error(f"Error fetching public rooms: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/public/join/{id}", response_model=RoomResponse)
async def join_public_room(id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Join a public room by ID."""
    try:
        room = db.query(Room).filter(Room.id == id, Room.is_public == True, Room.status == RoomStatus.OPEN).first()
        if not room:
            raise HTTPException(status_code=404, detail="Public room not found or closed")
        
        # Check if room is full (e.g., max 100 members)
        member_count = db.query(RoomMember).filter(RoomMember.room_id == id).count()
        if member_count >= 100:
            raise HTTPException(status_code=400, detail="Room is full")
        
        # Check if the user is already a member
        if db.query(RoomMember).filter(RoomMember.user_id == user.id, RoomMember.room_id == id).first():
            raise HTTPException(status_code=400, detail="You are already a member of this room")
        
        # Add the user to the room
        room_member = RoomMember(user_id=user.id, room_id=room.id)
        db.add(room_member)
        db.commit()
        db.refresh(room_member)
        logging.info(f"User {user.id} joined public room {id}")
        return room
    except Exception as e:
        logging.error(f"Error joining public room {id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/private", response_model=list[RoomResponse])
async def get_private_rooms(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List private rooms created by the authenticated user."""
    try:
        rooms = db.query(Room).filter(Room.is_public == False, Room.creator_id == user.id).all()
        logging.info(f"User {user.id} fetched {len(rooms)} private rooms")
        return rooms
    except Exception as e:
        logging.error(f"Error fetching private rooms: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/private/join", response_model=RoomResponse)
async def join_private_room(body: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Join a private room by token."""
    try:
        token = body.get("token")
        if not token:
            raise HTTPException(status_code=400, detail="Token is required")
        
        room = db.query(Room).filter(Room.token == token, Room.is_public == False, Room.status == RoomStatus.OPEN).first()
        if not room:
            raise HTTPException(status_code=404, detail="Private room not found or closed CONNECT")
        
        # Check if room is full (e.g., max 100 members)
        member_count = db.query(RoomMember).filter(RoomMember.room_id == room.id).count()
        if member_count >= 100:
            raise HTTPException(status_code=400, detail="Room is full")
        
        # Check if the user is already a member
        if db.query(RoomMember).filter(RoomMember.user_id == user.id, RoomMember.room_id == room.id).first():
            raise HTTPException(status_code=400, detail="You are already a member of this room")
        
        # Add the user to the room
        room_member = RoomMember(user_id=user.id, room_id=room.id)
        db.add(room_member)
        db.commit()
        db.refresh(room_member)
        logging.info(f"User {user.id} joined private room {room.id} via token {token}")
        return room
    except Exception as e:
        logging.error(f"Error joining private room with token {token}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/search/{token}", response_model=RoomResponse)
async def search_private_room(token: str, db: Session = Depends(get_db)):
    """Search for a private room by its token (room number)."""
    try:
        room = db.query(Room).filter(Room.token == token, Room.is_public == False).first()
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        logging.info(f"Searched private room with token {token}")
        return room
    except Exception as e:
        logging.error(f"Error searching private room with token {token}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.delete("/public/{id}")
async def delete_public_room(id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a public room by ID (creator only)."""
    try:
        room = db.query(Room).filter(Room.id == id, Room.is_public == True).first()
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        if room.creator_id != user.id:
            raise HTTPException(status_code=403, detail="Only the creator can delete the room")
        
        # Delete associated room_members
        db.query(RoomMember).filter(RoomMember.room_id == id).delete()
        db.delete(room)
        db.commit()
        logging.info(f"User {user.id} deleted public room {id}")
        return {"message": "Public room deleted successfully"}
    except Exception as e:
        logging.error(f"Error deleting public room {id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.delete("/private/{token}")
async def delete_private_room(token: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a private room by token (creator only)."""
    try:
        room = db.query(Room).filter(Room.token == token, Room.is_public == False).first()
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        if room.creator_id != user.id:
            raise HTTPException(status_code=403, detail="Only the creator can delete the room")
        
        # Delete associated room_members
        db.query(RoomMember).filter(RoomMember.room_id == room.id).delete()
        db.delete(room)
        db.commit()
        logging.info(f"User {user.id} deleted private room with token {token}")
        return {"message": "Private room deleted successfully"}
    except Exception as e:
        logging.error(f"Error deleting private room with token {token}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")