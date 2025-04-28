from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.room import Room
from app.models.user import User
from app.models.room_member import RoomMember
from app.models.message import Message
from app.schemas.room import RoomCreate, RoomResponse
from app.core.auth import get_current_user
import uuid
import logging

logging.basicConfig(filename='log.txt', level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

router = APIRouter()

@router.get("/", response_model=list[RoomResponse])
async def get_all_rooms(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all rooms (public and private) the user is a member of."""
    try:
        rooms = (
            db.query(Room)
            .join(RoomMember, Room.id == RoomMember.room_id)
            .filter(RoomMember.user_id == user.id, Room.status == "OPEN")
            .all()
        )
        logging.info(f"User {user.id} fetched {len(rooms)} rooms")
        return rooms
    except Exception as e:
        logging.error(f"Error fetching rooms: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/public", response_model=RoomResponse)
async def create_public_room(room: RoomCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a public room with a name, visible to all users."""
    try:
        db_room = Room(
            creator_id=user.id,
            name=room.name,
            status="OPEN",
            is_public=True,
            token=None
        )
        db.add(db_room)
        db.commit()
        db.refresh(db_room)

        # Add creator to RoomMember
        room_member = RoomMember(user_id=user.id, room_id=db_room.id)
        db.add(room_member)
        db.commit()

        logging.info(f"User {user.id} created public room {db_room.id}: {room.name}, added as member")
        return db_room
    except Exception as e:
        db.rollback()
        logging.error(f"Error creating public room: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/private", response_model=RoomResponse)
async def create_private_room(room: RoomCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a private room with a name, generates a unique token (room number)."""
    try:
        token = str(uuid.uuid4())
        db_room = Room(
            creator_id=user.id,
            name=room.name,
            status="OPEN",
            is_public=False,
            token=token
        )
        db.add(db_room)
        db.commit()
        db.refresh(db_room)

        # Add creator to RoomMember
        room_member = RoomMember(user_id=user.id, room_id=db_room.id)
        db.add(room_member)
        db.commit()

        logging.info(f"User {user.id} created private room {db_room.id}: {room.name}, token: {token}, added as member")
        return db_room
    except Exception as e:
        db.rollback()
        logging.error(f"Error creating private room: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/public", response_model=list[RoomResponse])
async def get_public_rooms(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all public, open rooms."""
    try:
        rooms = db.query(Room).filter(Room.is_public == True, Room.status == "OPEN").all()
        logging.info(f"User {user.id} fetched {len(rooms)} public rooms")
        return rooms
    except Exception as e:
        logging.error(f"Error fetching public rooms: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/public/join/{id}", response_model=RoomResponse)
async def join_public_room(id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Join a public room by ID."""
    try:
        # Check if room exists and is open
        room = db.query(Room).filter(Room.id == id, Room.is_public == True, Room.status == "OPEN").first()
        if not room:
            logging.error(f"Public room {id} not found or closed")
            raise HTTPException(status_code=404, detail="Public room not found or closed")
        
        # Check if room is full (max 100 members)
        member_count = db.query(RoomMember).filter(RoomMember.room_id == id).count()
        if member_count >= 100:
            logging.error(f"Public room {id} is full")
            raise HTTPException(status_code=400, detail="Room is full")
        
        # Check if user is already a member
        existing_member = db.query(RoomMember).filter(RoomMember.user_id == user.id, RoomMember.room_id == id).first()
        if existing_member:
            logging.warning(f"User {user.id} already a member of public room {id}")
            raise HTTPException(status_code=400, detail="You are already a member of this room")
        
        # Add user to room
        room_member = RoomMember(user_id=user.id, room_id=room.id)
        db.add(room_member)
        db.commit()
        db.refresh(room_member)
        
        # Send SodaBot welcome message
        welcome_message = Message(
            room_id=room.id,
            user_id=None,  # No user ID to indicate it's from SodaBot
            content=f"Welcome to {room.name}! Start chatting in the #chat channel.",
            username="SodaBot"  # Explicitly set username
        )
        db.add(welcome_message)
        db.commit()
        db.refresh(welcome_message)

        logging.info(f"User {user.id} joined public room {id}, welcome message {welcome_message.id} sent")
        return room
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logging.error(f"Unexpected error joining public room {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/private", response_model=list[RoomResponse])
async def get_private_rooms(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List private rooms created by the authenticated user."""
    try:
        rooms = db.query(Room).filter(Room.is_public == False, Room.creator_id == user.id).all()
        logging.info(f"User {user.id} fetched {len(rooms)} private rooms")
        return rooms
    except Exception as e:
        logging.error(f"Error fetching private rooms: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/private/join", response_model=RoomResponse)
async def join_private_room(body: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Join a private room by token."""
    try:
        token = body.get("token")
        if not token:
            logging.error("Token not provided for private room join")
            raise HTTPException(status_code=400, detail="Token is required")
        
        room = db.query(Room).filter(Room.token == token, Room.is_public == False, Room.status == "OPEN").first()
        if not room:
            logging.error(f"Private room with token {token} not found or closed")
            raise HTTPException(status_code=404, detail="Private room not found or closed")
        
        # Check if room is full (max 100 members)
        member_count = db.query(RoomMember).filter(RoomMember.room_id == room.id).count()
        if member_count >= 100:
            logging.error(f"Private room {room.id} is full")
            raise HTTPException(status_code=400, detail="Room is full")
        
        # Check if user is already a member
        existing_member = db.query(RoomMember).filter(RoomMember.user_id == user.id, RoomMember.room_id == room.id).first()
        if existing_member:
            logging.warning(f"User {user.id} already a member of private room {room.id}")
            raise HTTPException(status_code=400, detail="You are already a member of this room")
        
        # Add user to room
        room_member = RoomMember(user_id=user.id, room_id=room.id)
        db.add(room_member)
        db.commit()
        db.refresh(room_member)
        
        # Send SodaBot welcome message
        welcome_message = Message(
            room_id=room.id,
            user_id=None,  # No user ID to indicate it's from SodaBot
            content=f"Welcome to {room.name}! Start chatting in the #chat channel.",
            username="SodaBot"  # Explicitly set username
        )
        db.add(welcome_message)
        db.commit()
        db.refresh(welcome_message)

        logging.info(f"User {user.id} joined private room {room.id} via token {token}, welcome message {welcome_message.id} sent")
        return room
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logging.error(f"Unexpected error joining private room with token {token}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/search/{token}", response_model=RoomResponse)
async def search_private_room(token: str, db: Session = Depends(get_db)):
    """Search for a private room by its token (room number)."""
    try:
        room = db.query(Room).filter(Room.token == token, Room.is_public == False).first()
        if not room:
            logging.error(f"Private room with token {token} not found")
            raise HTTPException(status_code=404, detail="Room not found")
        logging.info(f"Searched private room with token {token}")
        return room
    except Exception as e:
        logging.error(f"Error searching private room with token {token}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.delete("/public/{id}")
async def delete_public_room(id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a public room by ID (creator only)."""
    try:
        room = db.query(Room).filter(Room.id == id, Room.is_public == True).first()
        if not room:
            logging.error(f"Public room {id} not found")
            raise HTTPException(status_code=404, detail="Room not found")
        if room.creator_id != user.id:
            logging.error(f"User {user.id} not authorized to delete public room {id}")
            raise HTTPException(status_code=403, detail="Only the creator can delete the room")
        
        # Delete associated room_members
        db.query(RoomMember).filter(RoomMember.room_id == id).delete()
        db.delete(room)
        db.commit()
        logging.info(f"User {user.id} deleted public room {id}")
        return {"message": "Public room deleted successfully"}
    except Exception as e:
        logging.error(f"Error deleting public room {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.delete("/private/{token}")
async def delete_private_room(token: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a private room by token (creator only)."""
    try:
        room = db.query(Room).filter(Room.token == token, Room.is_public == False).first()
        if not room:
            logging.error(f"Private room with token {token} not found")
            raise HTTPException(status_code=404, detail="Room not found")
        if room.creator_id != user.id:
            logging.error(f"User {user.id} not authorized to delete private room with token {token}")
            raise HTTPException(status_code=403, detail="Only the creator can delete the room")
        
        # Delete associated room_members
        db.query(RoomMember).filter(RoomMember.room_id == room.id).delete()
        db.delete(room)
        db.commit()
        logging.info(f"User {user.id} deleted private room with token {token}")
        return {"message": "Private room deleted successfully"}
    except Exception as e:
        logging.error(f"Error deleting private room with token {token}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")