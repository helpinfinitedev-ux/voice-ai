from fastapi import APIRouter
from src.db.mongodb import get_database
from fastapi.responses import JSONResponse

router = APIRouter()

db = get_database()

subscription_collection = db['subscriptions']
users_collection = db["users"]

@router.get("/users/{user_id}")
async def get_user_by_user_id(user_id: str):
    user = users_collection.find_one({"user_id": user_id})
    if not user:
        return JSONResponse(status_code=404, content={"message": "User not found"})
    
    del user["_id"]
    
    subscription = subscription_collection.find_one({"user_id": user_id})
    if subscription:
        del subscription["_id"]
        user["subscription"] = subscription

    return JSONResponse(status_code = 200, content = {"user":user})