from src.router.base import Base
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from src.util.utils import current_time_in_unix_timestamp

class RetellWebhook(Base):
    async def callback(self, request: Request):
        post_data = await request.json()

        event_type = post_data['event']
        if event_type != 'call_ended':
            return JSONResponse(status_code=200, content={"received": True})
        
        agent_id = post_data['data']['agent_id']
        
        call_log_data = {
            "call_id": post_data['data']['call_id'],
            "agent_id": agent_id,
            "start_timestamp": post_data['data']['start_timestamp'],
            "end_timestamp": post_data['data']['end_timestamp'],
            "read": False
        }

        if "from_number" in post_data["data"]:
            call_log_data["from_number"] =  post_data['data']['from_number']

        if "to_number" in post_data['data']:
            call_log_data['to_number'] = post_data['data']['to_number']

        self.phone_call_logs_collection.insert_one(call_log_data)

        campaign_id = self.redis.hget(self.AGENT_ID_TO_CAMPAIGN_ID, agent_id)
        if campaign_id:
            campaign_id = str(campaign_id)
            tokens = campaign_id.split(":")
            lead_phone_number = tokens[1]

            filter = {
                "campaign_id": tokens[0]
            }

            updated_lead_data = {
                "$set": {
                    "leads.$[i].status": "completed",
                    "leads.$[i].called_at": current_time_in_unix_timestamp()
                }
            }

            array_filters = [
                {
                    "i.phone_number": lead_phone_number
                }
            ]

            self.campaign_collection.update_one(filter=filter, update=updated_lead_data, array_filters=array_filters)
            prompt = self.redis.hget(self.CAMPAIGN_ID_TO_PROMPT, campaign_id)
            if prompt:
                self.redis.hdel(self.CAMPAIGN_ID_TO_PROMPT, campaign_id)

            if self.redis.hget(self.CAMPAIGN_ID_TO_BEGIN_MESSAGE, campaign_id):
                self.redis.hdel(self.CAMPAIGN_ID_TO_BEGIN_MESSAGE, campaign_id)

            if self.redis.hget(self.AGENT_ID_TO_CAMPAIGN_ID, agent_id):
                self.redis.hdel(self.AGENT_ID_TO_CAMPAIGN_ID, agent_id)

            if self.redis.hget(self.AGENT_ID_TO_TEMPLATE_DATA, agent_id):
                self.redis.hdel(self.AGENT_ID_TO_TEMPLATE_DATA, agent_id)

        filter = {
            "agent_id": agent_id
        }

        agent_data = self.phone_agents_collection.find_one(filter)
        if agent_data == None or "user_id" not in agent_data:
            return JSONResponse(status_code=200, content={"received": True})
        
        filter = {
            "user_id": agent_data["user_id"]
        }
        
        user_data = self.users_collection.find_one(filter)

        if user_data == None or "plan" not in user_data:
            return JSONResponse(status_code=200, content={"received": True})
        
        updated_user_data = {
            "$set": {
                "plan.conversations": user_data["plan"]["conversations"] - 1
            }
        }

        self.users_collection.update_one(filter, update=updated_user_data)

        return JSONResponse(status_code=200, content={"received": True})

router = APIRouter()
webhook = RetellWebhook()

@router.post("/retell-webhook")
async def retell_webhook(request: Request):
    return await webhook.callback(request)