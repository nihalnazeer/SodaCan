from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_messages():
    return {"message": "List of messages"}
