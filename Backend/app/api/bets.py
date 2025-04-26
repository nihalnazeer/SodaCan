from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_bets():
    return {"message" : "List of Bets"}
