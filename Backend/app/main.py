from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.users import router as user_router
from app.api.bets import router as bet_router
from app.api.messages import router as message_router
from app.core.auth import router as auth_router
from app.api.notifications import router as notification_router
from app.core.database import init_db
from app.config import settings
import logging

logging.basicConfig(
    filename='log.txt',
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    force=True
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title='Welcome to SodaCan',
    description='A real-time chat and betting app for users to interact with each other.',
    version='1.0.0'
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parsed_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

logger.debug("Starting router imports")
try:
    logger.debug("Importing user_router")
    app.include_router(user_router, prefix="/api/users", tags=["Users"])
except Exception as e:
    logger.error(f"Failed to import user_router: {str(e)}", exc_info=True)
    raise
try:
    logger.debug("Importing room_router")
    from app.api.rooms import router as room_router
    logger.debug("Including room_router")
    app.include_router(room_router, prefix="/api/rooms", tags=["Rooms"])
except Exception as e:
    logger.error(f"Failed to import room_router: {str(e)}", exc_info=True)
    raise
try:
    logger.debug("Importing bet_router")
    app.include_router(bet_router, prefix="/api/bets", tags=["Bets"])
except Exception as e:
    logger.error(f"Failed to import bet_router: {str(e)}", exc_info=True)
    raise
try:
    logger.debug("Importing message_router")
    app.include_router(message_router, prefix="/api/messages", tags=["Messages"])
except Exception as e:
    logger.error(f"Failed to import message_router: {str(e)}", exc_info=True)
    raise
try:
    logger.debug("Importing auth_router")
    app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
except Exception as e:
    logger.error(f"Failed to import auth_router: {str(e)}", exc_info=True)
    raise
try:
    logger.debug("Importing notification_router")
    app.include_router(notification_router, prefix="/api/notifications", tags=["Notifications"])
except Exception as e:
    logger.error(f"Failed to import notification_router: {str(e)}", exc_info=True)
    raise
logger.debug("Completed router imports")

@app.on_event("startup")
async def startup_event():
    try:
        init_db()
        logger.info("Database initialized successfully!")
    except Exception as e:
        logger.error(f"Error during DB initialization: {str(e)}", exc_info=True)
        raise e

@app.get("/")
async def root():
    return {"message": "Welcome to SodaCan API!"}

@app.get("/health")
async def health_check():
    return {"status": "OK"}

@app.get("/debug/routes")
async def debug_routes():
    routes = [{"path": route.path, "methods": list(route.methods)} for route in app.routes]
    return {"routes": routes}