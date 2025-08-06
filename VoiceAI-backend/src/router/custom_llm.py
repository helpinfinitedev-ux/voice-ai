import json
import pytz
import asyncio
import datetime
from string import Template
from src.router.base import Base
from fastapi import APIRouter, WebSocket
from src.calendly.apis import get_user_scheduled_events
from src.util.utils import current_time_in_unix_timestamp, is_current_time_within_range

class CustomLLM(Base):
    async def process(self, websocket: WebSocket, agent_id: str, call_id: str):
        await websocket.accept()

        filter = {
            "agent_id": agent_id
        }

        phone_agent = self.phone_agents_collection.find_one(filter)
        if phone_agent == None:
            return

        phone_agent = dict(phone_agent)
        prompt = phone_agent["prompt"]
        begin_message = phone_agent["begin_message"]

        # TODO: Might not need to save the agent_id_to_campaign_id
        unique_campaign_id = self.redis.hget(self.AGENT_ID_TO_CAMPAIGN_ID, agent_id)
        if unique_campaign_id:
            prompt = str(self.redis.hget(self.CAMPAIGN_ID_TO_PROMPT, str(unique_campaign_id)))
            begin_message = str(self.redis.hget(self.CAMPAIGN_ID_TO_BEGIN_MESSAGE, str(unique_campaign_id)))

        template_data = self.redis.hget(self.AGENT_ID_TO_TEMPLATE_DATA, agent_id)
        if template_data:
            try:
                template_data = json.loads(str(template_data))
                begin_message = Template(begin_message).safe_substitute(template_data)
                prompt = Template(prompt).safe_substitute(template_data)
            except Exception as e:
                print("unable to substitute templates in begin_message and prompt: ", e, flush=True)

        if "availability_schedule" in phone_agent and phone_agent["availability_schedule"] != "":
            current_timezone = "UTC"
            if "timezone" in phone_agent and phone_agent["timezone"] != "":
                current_timezone = phone_agent["timezone"]
            
            prompt += ("\n\nToday's date is: " + datetime.datetime.now(pytz.timezone(current_timezone)).strftime("%A, %B %-d %Y") + ".\n\nALWAYS use today's date into context when providing schedules to the user or responding to questions or queries.")

            prompt += ("\n\nHere is weekly availability schedule: \n\n" + phone_agent["availability_schedule"] + ". Convert all 24-hour time to 12-hour time. For example: 09:00 becomes 9 AM, 14:00 becomes 2 PM, 17:30 becomes 5:30 PM and 21:00 becomes 9 PM.")
            
            filter = {
                "user_id": phone_agent["user_id"]
            }

            token = self.calendly_tokens.find_one(filter)
            if token == None:
                return
            
            token = dict(token)

            data = {
                "grant_type": "refresh_token",
                "refresh_token": token["refresh_token"]
            }

            scheduled_events, updated_refresh_token = get_user_scheduled_events(data, token["owner"], current_timezone)
            if updated_refresh_token:
                updated_refresh_token_data = {
                    "$set": {
                        "refresh_token": updated_refresh_token,
                        "updated_at": current_time_in_unix_timestamp()
                    }
                }

                self.calendly_tokens.update_one(filter, updated_refresh_token_data)

            if scheduled_events:
                prompt += ("\n\nThe following are unavailable periods: \n\n" + scheduled_events + "\n\nUse the information to answer a user when a user is trying to find out the available period for a specific day or period.")

            prompt += ("\n\nAlways inform the user of your current timezone only when they attempt to book an appointment or a schedule. Your current timezone is: " + current_timezone + ".")


        prompt += ("\n\nALWAYS answer the user's questions when asked about availability and current or future schedules. \
                Whenever a user specifies a possible time to book an appointment, check the available working hours for that day and current booked periods for that day to avoid conflicting schedules. \
                Only use the end_call function when user explicitly asks to end the call otherwise, reply as if you are a helpful assistant.\n")

        transfer_events = None
        if "transfer_events" in phone_agent:
            transfer_events = phone_agent["transfer_events"] or ""
        
        if not transfer_events:
            prompt += "\n\nWhen asked to transfer the call, inform the user that the call cannot be transferred at this time due to unavailability of personnel and DO NOT call or invoke the 'transfer_call' function."        

        non_transfer_timeline = phone_agent["non_transfer_timeline"] or ""
        timezone = phone_agent["timezone"] or ""

        start_time, end_time = "", ""
        if non_transfer_timeline != None and non_transfer_timeline != "":
            non_transfer_timeline_tokens = non_transfer_timeline.split("-");
            start_time = non_transfer_timeline_tokens[0].strip()
            end_time = non_transfer_timeline_tokens[1].strip()

        conversational_memory = []
        response_id = 0

        async def stream_response(request, prompt, conversational_memory, start_time, end_time, timezone):
            nonlocal response_id
            async for text in self.custom_llm_client.draft_response(request, prompt, conversational_memory, transfer_events):
                if "action" in text and "transfer" in text["action"]:
                    if start_time == "" or end_time == "":
                        return

                    transfer_to_phone_number = None
                    if transfer_events:
                        for event in transfer_events:
                            if "name" in event and "phone_number" in event and text["action"] == event["name"]:
                                transfer_to_phone_number = event["phone_number"]
                                break
                    if not is_current_time_within_range(start_time, end_time, timezone) and transfer_to_phone_number:
                        call_sid = str(self.redis.hget(self.RETELL_CALL_ID_TO_TWILIO_CALL_SID, call_id))
                        self.twilio.transfer_call(call_sid, transfer_to_phone_number)
                    else:
                        no_transfer_data = self.custom_llm_client.no_transfer_response(request['response_id'])
                        no_transfer_data_str = json.dumps(no_transfer_data)
                        await websocket.send_text(no_transfer_data_str)
                        conversational_memory.append({"role": "assistant", "content": no_transfer_data["content"]})                    
                else:
                    text_json = json.dumps(text)
                    await websocket.send_text(text_json)

                if request['response_id'] < response_id:
                    return 

        try:
            while True:
                message = await websocket.receive_text()
                request = json.loads(message)

                if 'response_id' not in request:
                    continue 

                response_id = request['response_id']
                asyncio.create_task(stream_response(request, prompt, conversational_memory, start_time, end_time, timezone))

        except Exception as e:
            print(f'LLM WebSocket error for {call_id}: {e}')
        finally:
            try:
                await websocket.close()
            except RuntimeError as e:
                print(f"Websocket already closed for {call_id}")
            print(f"Closing llm ws for: {call_id}")

router = APIRouter()

@router.websocket("/llm/{agent_id}/{call_id}")
async def custom_llm_endpoint(websocket: WebSocket, agent_id: str, call_id: str):
    await CustomLLM().process(websocket, agent_id, call_id)
