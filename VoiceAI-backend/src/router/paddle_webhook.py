import hmac
import hashlib
import datetime
from src.router.base import Base
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from src.models.subscription import PlanInfo
from src.util.utils import current_time_in_unix_timestamp

class PaddleWebhook(Base):
    async def callback(self, request: Request):
        paddle_signature = request.headers.get("paddle-signature")
        if paddle_signature is None:
            return JSONResponse(status_code=400, content={"message": "Invalid request"})
            
        tokens = paddle_signature.split(";")
        ts = tokens[0]
        h1 = tokens[1]

        timestamp = ts.split("=")[1]
        signature = h1.split("=")[1]
        
        current_time_in_seconds = current_time_in_unix_timestamp() / 1000

        # Check if timestamp is greater than now + 5 seconds
        if int(timestamp) > current_time_in_seconds + 5:
            return JSONResponse(status_code=400, content={"message": "Invalid request"})
        
        bytes_body = await request.body()

        payload = timestamp + ":" + bytes_body.decode()

        computed_signature = hmac.new(
            key=self.PADDLE_WEBHOOK_SECRET_KEY.encode(),
            msg=payload.encode(),
            digestmod=hashlib.sha256
        ).hexdigest()

        if computed_signature != signature:
            return JSONResponse(status_code=401, content={"message": "Unauthorized"})
        
        body = await request.json()
        data = body['data']

        if body.get('event_type') == 'subscription.created':
            user_id = data['custom_data']['userId']
            agents = data['custom_data']['agent']
            plan_info = PlanInfo(
            plan_name=data['custom_data']['plan_name'],
            amount=data['custom_data']['amount'],
            conversations=data['custom_data']['conversations'], agents=agents, totalConversations=data['custom_data']['conversations'])

            subscription_id =data['id']
            plan_id = data['items'][0]['price']['id']
        
            utc_date_string =  data['created_at']

            utc_datetime = datetime.datetime.strptime(utc_date_string, '%Y-%m-%dT%H:%M:%S.%fZ')

            # Convert datetime object to Unix timestamp
            unix_timestamp = int(utc_datetime.timestamp())*1000
            end_date = unix_timestamp + 30*24*60*60*1000
            subscription_doc = {
                "user_id": user_id,
                "subscription_id": subscription_id,
                "plan_id": plan_id,
                "plan_info": plan_info.model_dump(),
                "start_date": int(unix_timestamp),
                "end_date":int(end_date),
            
            }
            existing_subscription = self.subscription_collection.find_one({"user_id": user_id})
            plan = {
                'conversations':subscription_doc['plan_info']['conversations'],
                'start_date':subscription_doc['start_date'],
                'end_date':subscription_doc['end_date'],
                'plan_id':subscription_doc['plan_id'],
                'subscription_id':subscription_doc['subscription_id'],
                'amount':subscription_doc['plan_info']['amount'],
                'plan_name':subscription_doc['plan_info']['plan_name'],
                'agents':subscription_doc['plan_info']['agents'],
                'totalConversations':subscription_doc['plan_info']['conversations']
            }
            updated_user_data = {
                "$set": {
                    "plan": plan
                }
            }
            self.users_collection.update_one({"user_id": user_id}, updated_user_data)
            if existing_subscription:
                self.subscription_collection.update_one({"user_id": user_id}, {"$set": subscription_doc})
                message = "Subscription updated for user {}".format(user_id)
            else:
                # If no subscription exists, insert the new subscription document
                self.subscription_collection.insert_one(subscription_doc)
                message = "Subscription created for user {}".format(user_id)
        
            return JSONResponse(status_code=200, content={"subscription": subscription_doc, 'message': message})
        return JSONResponse(status_code=200, content={"message": "webhook listened to event"})

router = APIRouter()
webhook = PaddleWebhook()

@router.post("/paddle-webhook")
async def paddle_webhook(request: Request):
    return await webhook.callback(request)