from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
import logging
import json
from pusher import Pusher
from app.core.database import get_db
from app.models.message import Message
from app.models.user import User
from app.models.room import Room
from app.schemas.message import MessageCreate, MessageResponse, TestMessageCreate
from app.core.auth import get_current_user
from app.core.pusher import get_pusher, PusherService
from datetime import datetime, timezone

router = APIRouter()
logger = logging.getLogger(__name__)
logging.basicConfig(
    filename='log.txt',
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, room_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[room_id] = websocket
        logger.info(f"New WebSocket connection for room {room_id}")

    def disconnect(self, room_id: int):
        if room_id in self.active_connections:
            del self.active_connections[room_id]
            logger.info(f"WebSocket connection closed for room {room_id}")

    async def send_personal_message(self, message: str, room_id: int):
        if room_id in self.active_connections:
            await self.active_connections[room_id].send_text(message)

manager = ConnectionManager()

@router.post("/", response_model=MessageResponse)
async def send_message(
    message: MessageCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    pusher_service: PusherService = Depends(get_pusher)
):
    """Send a message to a room."""
    try:
        logger.debug(f"Attempting to send message to room {message.room_id} by user {user.id}")
        room = db.query(Room).filter(
            Room.id == message.room_id,
            Room.status == "OPEN"
        ).first()
        if not room:
            logger.warning(f"Room {message.room_id} not found or closed")
            raise HTTPException(status_code=404, detail="Room not found or closed")

        from app.models.room_member import RoomMember
        membership = db.query(RoomMember).filter(
            RoomMember.room_id == message.room_id,
            RoomMember.user_id == user.id
        ).first()
        if not membership:
            logger.warning(f"User {user.id} not a member of room {message.room_id}")
            raise HTTPException(status_code=403, detail="You are not a member of this room")
        
        # Create message with explicit created_at
        db_message = Message(
            room_id=message.room_id,
            user_id=user.id,
            content=message.content,
            created_at=datetime.now(timezone.utc)
        )
        db.add(db_message)
        db.commit()
        db.refresh(db_message)
        logger.info(f"Message created: {db_message.id}")

        # Ensure created_at is not None
        created_at = db_message.created_at or datetime.now(timezone.utc)
        
        pusher_response = pusher_service.client.trigger(
            f"room-{message.room_id}",
            "new-message",
            {
                "id": db_message.id,
                "room_id": db_message.room_id,
                "user_id": db_message.user_id,
                "content": db_message.content,
                "created_at": created_at.isoformat(),
                "username": user.username  # Send username for frontend display
            }
        )
        logger.debug(f"Pusher trigger response for room-{message.room_id}: {pusher_response}")

        # Set username in response
        db_message.username = user.username
        return db_message
    except HTTPException as he:
        db.rollback()
        logger.error(f"HTTP error in send_message: {str(he)}")
        raise he
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error in send_message: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")

@router.get("/room/{room_id}", response_model=List[MessageResponse])
async def get_room_messages(
    room_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all messages in a room."""
    try:
        logger.debug(f"Fetching messages for room {room_id} by user {user.id}")
        room = db.query(Room).get(room_id)
        if not room:
            logger.warning(f"Room not found: {room_id}")
            raise HTTPException(status_code=404, detail="Room not found")

        from app.models.room_member import RoomMember
        membership = db.query(RoomMember).filter(
            RoomMember.room_id == room_id,
            RoomMember.user_id == user.id
        ).first()
        if not membership:
            logger.warning(f"User {user.id} not member of room {room_id}")
            raise HTTPException(status_code=403, detail="You are not a member of this room")

        messages = db.query(Message).filter(
            Message.room_id == room_id
        ).order_by(
            Message.created_at.asc()
        ).all()
        
        # Ensure created_at is not None and set username
        for message in messages:
            if message.created_at is None:
                message.created_at = datetime.now(timezone.utc)
                db.add(message)
            if message.user_id is None:
                message.username = "SodaBot"  # System messages
            else:
                user = db.query(User).filter(User.id == message.user_id).first()
                message.username = user.username if user else "Unknown"
        db.commit()
        
        logger.info(f"Retrieved {len(messages)} messages for room {room_id}")
        return messages

    except HTTPException as he:
        logger.error(f"HTTP error in get_room_messages: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"Unexpected error in get_room_messages: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve messages: {str(e)}")

@router.websocket("/ws/{room_id}")
async def websocket_messages(
    websocket: WebSocket,
    room_id: int,
    token: str = None
):
    """WebSocket endpoint for real-time messaging in a room."""
    await manager.connect(room_id, websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received WebSocket message for room {room_id}: {data}")
            await manager.send_personal_message(f"You said: {data}", room_id)
            
    except WebSocketDisconnect:
        manager.disconnect(room_id)
        logger.info(f"Client disconnected from room {room_id}")
    except Exception as e:
        manager.disconnect(room_id)
        logger.error(f"WebSocket error for room {room_id}: {str(e)}", exc_info=True)
        await websocket.close(code=1011)

@router.post("/send-test-message")
async def send_test_message(
    test_message: TestMessageCreate,
    pusher_service: PusherService = Depends(get_pusher)
):
    """Endpoint for testing Pusher messages (dev only)"""
    try:
        created_at = datetime.now(timezone.utc)
        pusher_response = pusher_service.client.trigger(
            f"room-{test_message.room_id}",
            "new-message",
            {
                "id": None,  # Test messages don't have a DB ID
                "test_message": test_message.message,
                "room_id": test_message.room_id,
                "user_id": None,
                "created_at": created_at.isoformat(),
                "username": "TestBot"
            }
        )
        logger.info(f"Test message sent to room {test_message.room_id}: {pusher_response}")
        return {"status": "Test message sent"}
    except Exception as e:
        logger.error(f"Error sending test message: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to send test message: {str(e)}")