from src.router.base import Base
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from src.auth.creation import save_new_user_data, delete_user_data
from src.auth.session import save_user_session, remove_user_session

class ClerkWebhook(Base):
    async def callback(self, request: Request):
        body = await request.json()

        if "type" not in body or "data" not in body:
            return JSONResponse(status_code=400, content={"message": "Invalid payload"})
        
        type = body["type"]
        match type:
            case "user.created":
                save_new_user_data(body["data"])
            case "user.deleted":
                delete_user_data(body["data"])
            case "session.created":
                save_user_session(body["data"])
            case "session.ended" | "session.removed" | "session.revoked":
                remove_user_session(body["data"])

        return JSONResponse(status_code = 200, content = {"message":"webhook listened to event"})

router = APIRouter()
webhook = ClerkWebhook()

@router.post("/clerk-webhook")
async def clerk_webhook(request: Request):
    return await webhook.callback(request)
