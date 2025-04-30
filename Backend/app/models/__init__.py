# app/models/__init__.py
from .base import Base

# Lazy loading pattern
def __getattr__(name):
    if name == "User":
        from .user import User
        return User
    elif name == "Room":
        from .room import Room
        return Room
    elif name == "RoomMember":
        from .room_member import RoomMember
        return RoomMember
    elif name == "Message":
        from .message import Message
        return Message
    elif name == "Bet":
        from .bet import Bet
        return Bet
    elif name == "RefreshToken":
        from .refresh_token import RefreshToken
        return RefreshToken
    elif name == "Notification":
        from .notification import Notification
        return Notification
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

__all__ = ["Base", "User", "Room", "RoomMember", "Message", "Bet", "RefreshToken", "Notification"]