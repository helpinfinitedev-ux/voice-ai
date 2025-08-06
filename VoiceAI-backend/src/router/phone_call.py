import uuid
from src.router.base import Base
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

class PhoneCall(Base):
    async def call(self, request: Request):
        post_body = await request.json()
        
        # TODO - Change to_number to phone_number in Zapier integration
        if "agent_id" not in post_body or "to_number" not in post_body:
            return JSONResponse(status_code=400, content={"message": "Invalid data"})
        
        agent_id = post_body["agent_id"]
        to_number = post_body["to_number"]

        del post_body["agent_id"]
        del post_body["to_number"]

        campaign_id = str(uuid.uuid4()) + ":" + to_number

        filter = {
            "agent_id": agent_id
        }

        agent_data = self.phone_agents_collection.find_one(filter)
        if agent_data == None or "phone_number" not in agent_data:
            return JSONResponse(status_code=404, content={"message": "Agent not found"})

        from_number = agent_data["phone_number"]
        self.twilio.create_phone_call(from_number, to_number, agent_id, campaign_id, template_data=post_body)

        return JSONResponse(status_code=200, content={"message": "Phone call made successfully"})

router = APIRouter()
phone_call = PhoneCall()

@router.post("/make-phone-call")
async def make_phone_call(request: Request):
    return await phone_call.call(request)