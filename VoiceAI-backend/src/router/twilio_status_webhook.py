import pytz
import datetime
from urllib import parse
from src.router.base import Base
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from src.util.utils import current_time_in_unix_timestamp, num_of_milliseconds_in_hours

class TwilioStatusWebhook(Base):
    async def status(self, request: Request, agent_id: str, campaign_id: str):
        req_body = await request.form()
        if "CallStatus" not in req_body or "To" not in req_body:
            return JSONResponse(status_code=400, content={"message": "Invalid data"})
        
        to_number = req_body["To"]
        call_status = req_body["CallStatus"]

        match call_status:
            case "no-answer" | "busy" | "canceled" | "failed":
                tokens = parse.unquote(campaign_id).split(":")
                lead_phone_number = tokens[1]
                
                if lead_phone_number != to_number:
                    return JSONResponse(status_code=200, content={"message": "Invalid data"})

                filter = {
                    "campaign_id": tokens[0]
                }

                campaign_data = self.campaign_collection.find_one(filter)
                if campaign_data == None:
                    return JSONResponse(status_code=404, content={"message": "Campaign id not found"})
                
                campaign_data = dict(campaign_data)
                retry_duration = campaign_data["retry_duration"] or 3
                start_time = current_time_in_unix_timestamp() + num_of_milliseconds_in_hours(retry_duration)

                updated_lead_data = {
                    "$set": {
                        "leads.$[i].status": call_status,
                        "leads.$[i].called_at": current_time_in_unix_timestamp(),
                        "leads.$[i].scheduled_at": start_time
                    }
                }

                array_filters = [
                    {
                        "i.phone_number": lead_phone_number
                    }
                ]

                self.campaign_collection.update_one(filter=filter, update=updated_lead_data, array_filters=array_filters)
                
                updated_campaign_data = self.campaign_collection.find_one(filter)

                if not updated_campaign_data:
                    return JSONResponse(status_code=200, content={"message": "Internal server error"})

                max_retries = updated_campaign_data["max_retries"] or 5

                lead = None
                for item in updated_campaign_data["leads"]:
                    if "phone_number" not in item:
                        continue

                    if item["phone_number"] == lead_phone_number:
                        lead = item
                        break
                
                if lead == None:
                    return JSONResponse(status_code=200, content={"message": "successfully updated"})
                
                if "retries" not in lead:
                    return JSONResponse(status_code=200, content={"message": "Invalid lead data"})
                
                if lead["retries"] >= max_retries:
                    return JSONResponse(status_code=200, content={"message": "Max retries reached"})

                unique_worker_id = tokens[0] + ":" + lead_phone_number
                worker_data = {
                    "worker_id": unique_worker_id,
                    "agent_id": agent_id,
                    "begin_message_template": updated_campaign_data["begin_message_template"],
                    "prompt": updated_campaign_data["prompt"],
                    "call_time": start_time,
                    "days": updated_campaign_data["days"],
                    "lead": lead,
                    "timezone": updated_campaign_data["timezone"]
                }

                timezone = pytz.timezone(updated_campaign_data["timezone"])

                self.queue.enqueue_at(
                    datetime=datetime.datetime.fromtimestamp(float(start_time/1000), tz=timezone),
                    f='src.worker.exec_campaign.process_campaign',
                    args=(worker_data,),
                    job_id=unique_worker_id
                )

                return JSONResponse(status_code=200, content={"message": "Webhook received successfully"})
            
        return JSONResponse(status_code=200, content={"message": "success"})
    
router = APIRouter()

@router.post("/twilio-status-webhook")
async def handle_twilio_status_webhook(request: Request, agent_id: str, campaign_id: str):
    return await TwilioStatusWebhook().status(request, agent_id, campaign_id)