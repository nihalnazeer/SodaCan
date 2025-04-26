from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.room import Room, RoomStatus
from app.models.user import User
from app.models.room_member import RoomMember  # Ensure RoomMember is imported
from app.schemas.room import RoomCreate, RoomResponse
from app.core.auth import get_current_user
import uuid

router = APIRouter()

@router.post("/public", response_model=RoomResponse)
async def create_public_room(room: RoomCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a public room with a name, visible to all users."""
    db_room = Room(
        creator_id=user.id,
        name=room.name,
        status=RoomStatus.OPEN,  # Use ENUM value
        is_public=True,
        token=None
    )
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

@router.post("/private", response_model=RoomResponse)
async def create_private_room(room: RoomCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a private room with a name, generates a unique token (room number)."""
    token = str(uuid.uuid4())
    db_room = Room(
        creator_id=user.id,
        name=room.name,
        status=RoomStatus.OPEN,  # Use ENUM value
        is_public=False,
        token=token
    )
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

@router.get("/public", response_model=list[RoomResponse])
async def get_public_rooms(db: Session = Depends(get_db)):
    """List all public, open rooms."""
    rooms = db.query(Room).filter(Room.is_public == True, Room.status == RoomStatus.OPEN).all()
    return rooms

@router.post("/public/join/{id}", response_model=RoomResponse)
async def join_public_room(id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Join a public room by ID."""
    room = db.query(Room).filter(Room.id == id, Room.is_public == True, Room.status == RoomStatus.OPEN).first()
    if not room:
        raise HTTPException(status_code=404, detail="Public room not found or closed")
    
    # Check if the user is already a member of the room
    if db.query(RoomMember).filter(RoomMember.user_id == user.id, RoomMember.room_id == id).first():
        raise HTTPException(status_code=400, detail="You are already a member of this room")
    
    # Add the user to the room
    room_member = RoomMember(user_id=user.id, room_id=room.id)
    db.add(room_member)
    db.commit()
    db.refresh(room_member)
    
    return room

@router.get("/private", response_model=list[RoomResponse])
async def get_private_rooms(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List private rooms created by the authenticated user."""
    rooms = db.query(Room).filter(Room.is_public == False, Room.creator_id == user.id).all()
    return rooms

@router.post("/private/join", response_model=RoomResponse)
async def join_private_room(token: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Join a private room by token."""
    room = db.query(Room).filter(Room.token == token, Room.is_public == False, Room.status == RoomStatus.OPEN).first()
    if not room:
        raise HTTPException(status_code=404, detail="Private room not found or closed")
    
    # Check if the user is already a member of the room
    if db.query(RoomMember).filter(RoomMember.user_id == user.id, RoomMember.room_id == room.id).first():
        raise HTTPException(status_code=400, detail="You are already a member of this room")
    
    # Add the user to the room
    room_member = RoomMember(user_id=user.id, room_id=room.id)
    db.add(room_member)
    db.commit()
    db.refresh(room_member)
    
    return room

@router.get("/search/{token}", response_model=RoomResponse)
async def search_private_room(token: str, db: Session = Depends(get_db)):
    """Search for a private room by its token (room number)."""
    room = db.query(Room).filter(Room.token == token, Room.is_public == False).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@router.delete("/public/{id}")
async def delete_public_room(id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a public room by ID (creator only)."""
    room = db.query(Room).filter(Room.id == id, Room.is_public == True).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room.creator_id != user.id:
        raise HTTPException(status_code=403, detail="Only the creator can delete the room")
    db.delete(room)
    db.commit()
    return {"message": "Public room deleted successfully"}

@router.delete("/private/{token}")
async def delete_private_room(token: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a private room by token (creator only)."""
    room = db.query(Room).filter(Room.token == token, Room.is_public == False).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room.creator_id != user.id:
        raise HTTPException(status_code=403, detail="Only the creator can delete the room")
    db.delete(room)
    db.commit()
    return {"message": "Private room deleted successfully"}
