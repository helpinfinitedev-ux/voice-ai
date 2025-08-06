import os
import time
import datetime
from src.router.base import Base
from fastapi.responses import JSONResponse
from src.calendly.apis import authorize_account
from fastapi import APIRouter, Request, HTTPException
from src.util.utils import current_time_in_unix_timestamp
from src.calendly.worker import convert_schedule_to_string
from src.calendly.apis import authorize_account, get_user_availability_schedules, get_user_scheduled_events

class Calendly(Base):
    async def authorize(self, request: Request):
        post_body = await request.json()

        user_id = post_body["user_id"]
        oauth_code = post_body["oauth_code"]

        data = {
            "grant_type": "authorization_code",
            "code": oauth_code,
            "redirect_uri": os.getenv("FRONT_END_BASE_URL")
        }

        res = authorize_account(data)
        if not res:
            raise HTTPException(status_code=500, detail="Unable to authorize calendly account")
        
        timestamp = current_time_in_unix_timestamp()

        filter = {
            "user_id": user_id
        }

        calendly_token = self.calendly_tokens.find_one(filter=filter)
        if calendly_token == None:
            token_data = {
                "user_id": user_id,
                "owner": res["owner"],
                "refresh_token": res["refresh_token"],
                "created_at": timestamp,
                "updated_at": timestamp
            }

            self.calendly_tokens.insert_one(token_data)
        else:
            updated_token_data = {
                "$set": {
                    "refresh_token": res["refresh_token"],
                    "updated_at": timestamp
                }
            }

            self.calendly_tokens.update_one(filter, updated_token_data)

        return JSONResponse(status_code=200, content={"message": "Calendly account authorized"})
    
    async def schedules(self, user_id: str):
        filter = {
            "user_id": user_id 
        }

        token = self.calendly_tokens.find_one(filter)
        if token == None:
            raise HTTPException(status_code=404, detail="Not found")
        
        data = {
            "grant_type": "refresh_token",
            "refresh_token": token["refresh_token"]
        }

        owner = token["owner"]

        schedule, updated_refresh_token = get_user_availability_schedules(data, owner)
        
        date_time = datetime.datetime.now(tz=datetime.timezone.utc)
        timestamp = int(time.mktime(date_time.timetuple()))
        
        if updated_refresh_token:
            updated_refresh_token_data = {
                "$set": {
                    "refresh_token": updated_refresh_token,
                    "updated_at": timestamp
                }
            }

            self.calendly_tokens.update_one(filter, updated_refresh_token_data)

        if not schedule:
            raise HTTPException(status_code=500, detail="Unable to fetch calendly schedules")
        
        return JSONResponse(status_code=200, content={"schedule": convert_schedule_to_string(schedule)})


router = APIRouter()
calendly = Calendly()

@router.post("/calendly/authorize")
async def create_calendly_oauth_tokens(request: Request):
    return await calendly.authorize(request)

# TODO - user_id should be a query_parameter
@router.get("/users/{user_id}/calendly/schedules")
async def get_calendly_schedules(user_id: str):
    return await calendly.schedules(user_id)