from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.users import router as user_router
from app.api.rooms import router as room_router
from app.api.bets import router as bet_router
from app.api.messages import router as message_router
from app.core.database import init_db

app = FastAPI(
    title='Welcome to SodaCan',
    version='1.0.0'
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(user_router, prefix="/api/users", tags=["Users"])
app.include_router(room_router, prefix="/api/rooms", tags=["Rooms"])
app.include_router(bet_router, prefix="/api/bets", tags=["Bets"])
app.include_router(message_router, prefix="/api/messages", tags=["Messages"])

@app.on_event("startup")
async def startup_event():
    init_db()

@app.get("/")
async def root():
    return {"message": "Welcome to SodaCan API!"}