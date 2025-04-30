from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.users import router as user_router
from app.api.rooms import router as room_router
from app.api.bets import router as bet_router
from app.api.messages import router as message_router
from app.core.auth import router as auth_router
from app.api.notifications import router as notification_router
from app.core.database import init_db
import logging

# Set up logging
logging.basicConfig(
    filename='log.txt',
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create the FastAPI app
app = FastAPI(
    title='Welcome to SodaCan',
    description='A real-time chat and betting app for users to interact with each other.',
    version='1.0.0'
)

# CORS configuration for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-production-frontend.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Include the routers for different endpoints
app.include_router(user_router, prefix="/api/users", tags=["Users"])
app.include_router(room_router, prefix="/api/rooms", tags=["Rooms"])
app.include_router(bet_router, prefix="/api/bets", tags=["Bets"])
app.include_router(message_router, prefix="/api/messages", tags=["Messages"])
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(notification_router, prefix="/api/notifications", tags=["Notifications"])

# Event to run during startup
@app.on_event("startup")
async def startup_event():
    try:
        # Initialize the database
        init_db()
        logger.info("Database initialized successfully!")
    except Exception as e:
        logger.error(f"Error during DB initialization: {str(e)}", exc_info=True)
        raise e

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to SodaCan API!"}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "OK"}