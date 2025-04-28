from pusher import Pusher
from fastapi import Depends
from app.config import settings

class PusherService:
    def __init__(self):
        self.client = Pusher(
            app_id=settings.pusher_app_id,
            key=settings.pusher_key,
            secret=settings.pusher_secret,
            cluster=settings.pusher_cluster
        )

def get_pusher() -> PusherService:
    return PusherService()