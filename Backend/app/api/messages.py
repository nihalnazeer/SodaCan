from fastapi import APIRouter, Depends, HTTPException, WebSocket
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.message import Message
from app.models.user import User
from app.models.room import Room
from app.schemas.message import MessageCreate, MessageResponse
from app.core.auth import get_current_user
from app.core.supabase import get_supabase_client, get_async_supabase_client
from supabase import Client, AsyncClient
import logging
import json

router = APIRouter()
logging.basicConfig(filename='log.txt', level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@router.post("/", response_model=MessageResponse)
async def send_message(
    message: MessageCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    supabase: Client = Depends(get_supabase_client)
):
    """Send a message to a room."""
    try:
        room = db.query(Room).filter(
            Room.id == message.room_id,
            Room.status == "OPEN"
        ).first()
        if not room:
            logger.error(f"Room {message.room_id} not found or closed")
            raise HTTPException(status_code=404, detail="Room not found or closed")
        
        from app.models.room_member import RoomMember
        membership = db.query(RoomMember).filter(
            RoomMember.room_id == message.room_id,
            RoomMember.user_id == user.id
        ).first()
        if not membership:
            logger.error(f"User {user.id} is not a member of room {message.room_id}")
            raise HTTPException(status_code=403, detail="You are not a member of this room")
        
        db_message = Message(
            room_id=message.room_id,
            user_id=user.id,
            content=message.content
        )
        db.add(db_message)
        db.commit()
        db.refresh(db_message)
        logger.info(f"User {user.id} sent message {db_message.id} in room {message.room_id}")
        return db_message
    except Exception as e:
        logger.error(f"Error sending message for user {user.id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/room/{room_id}", response_model=list[MessageResponse])
async def get_room_messages(
    room_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all messages in a room."""
    try:
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            logger.error(f"Room {room_id} not found")
            raise HTTPException(status_code=404, detail="Room not found")
        
        from app.models.room_member import RoomMember
        membership = db.query(RoomMember).filter(
            RoomMember.room_id == room_id,
            RoomMember.user_id == user.id
        ).first()
        if not membership:
            logger.error(f"User {user.id} is not a member of room {room_id}")
            raise HTTPException(status_code=403, detail="You are not a member of this room")
        
        messages = db.query(Message).filter(Message.room_id == room_id).order_by(Message.created_at.asc()).all()
        logger.info(f"User {user.id} fetched {len(messages)} messages from room {room_id}")
        return messages
    except Exception as e:
        logger.error(f"Error fetching messages for room {room_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

class WebSocketDependency:
    """Special class to allow using async dependencies in WebSocket endpoints."""
    async def __call__(self, websocket: WebSocket):
        client = await get_async_supabase_client()
        return client

@router.websocket("/ws/{room_id}")
async def websocket_messages(
    websocket: WebSocket,
    room_id: int,
    db: Session = Depends(get_db),
    supabase: AsyncClient = Depends(WebSocketDependency())
):
    """WebSocket endpoint for real-time messaging in a room."""
    await websocket.accept()
    channel = None
    try:
        room = db.query(Room).filter(Room.id == room_id, Room.status == "OPEN").first()
        if not room:
            await websocket.send_json({"error": "Room not found or closed"})
            await websocket.close()
            return
        
        logger.debug(f"Supabase client type: {type(supabase)}")
        if not isinstance(supabase, AsyncClient):
            logger.error(f"Expected AsyncClient, got {type(supabase)}")
            raise ValueError("Supabase client is not an AsyncClient")

        async def handle_message(payload):
            if payload.get("eventType") == "INSERT":
                message = payload.get("record", {})
                if message.get("room_id") == room_id:
                    await websocket.send_json({
                        "id": message.get("id"),
                        "room_id": message.get("room_id"),
                        "user_id": message.get("user_id"),
                        "content": message.get("content"),
                        "created_at": message.get("created_at")
                    })

        channel = supabase.channel(f"public:messages:room_id=eq.{room_id}")
        channel.on("INSERT", handle_message)
        await channel.subscribe()
        logger.info(f"Subscribed to Supabase channel for room {room_id}")

        while True:
            await websocket.receive_text()
    except Exception as e:
        logger.error(f"WebSocket error for room {room_id}: {str(e)}")
        await websocket.send_json({"error": "Internal server error"})
    finally:
        if channel:
            await channel.unsubscribe()
        await websocket.close()
        logger.info(f"WebSocket closed for room {room_id}")