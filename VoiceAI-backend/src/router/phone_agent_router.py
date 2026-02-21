import os
import json
import time
import uuid
import pytz
import hmac
import random
import asyncio
import hashlib
import datetime
from rq import Queue
from urllib import parse
from string import Template
from typing import Annotated
from src.db.redis import get_redis
from src.db.mongodb import get_database
from generateApiKey import generateApiKey
from retell.resources.call import PhoneCallResponse
from src.retell.custom_llm import LlmClient
# from src.retell.anthropic_custom_llm import LlmClient
from src.twilio.twilio_server import TwilioClient
from src.twilio.twilio_helpers import validate_twilio_webhook
from twilio.twiml.voice_response import VoiceResponse
from fastapi.responses import JSONResponse, PlainTextResponse
from src.models.create_agent_request import CreateAgentRequest
from src.models.update_agent_request import ArchiveAgentPayload, UpdateAgentRequest
from fastapi import APIRouter, WebSocket, Request, HTTPException, Header
from src.models.create_campaign_request import CreateCampaignRequest
from src.calendly.apis import authorize_account, get_user_availability_schedules, get_user_scheduled_events
from src.retell.retell_helpers import create_agent, update_agent, delete_agent, get_call, register_call, create_web_call
from src.calendly.worker import convert_schedule_to_string
from src.models.subscription import PlanInfo
from src.auth.session import save_user_session, remove_user_session
from src.auth.creation import save_new_user_data, delete_user_data
from src.util.utils import is_current_time_within_range, current_time_in_unix_timestamp, num_of_milliseconds_in_hours, num_of_milliseconds_in_minutes

all_conversational_memory = {}
call_id_to_call_sid = {}

router = APIRouter()

db = get_database()
phone_agents_collection = db["phone-agents"]
phone_call_logs_collection = db["phone-call-logs"]
calendly_tokens = db["calendly-auth-tokens"]
campaign_collection = db["campaigns"]
subscription_collection = db['subscriptions']
api_keys_collection = db["api-keys"]
users_collection = db["users"]

twilio_client = TwilioClient()
custom_llm_client = LlmClient()

redis_conn = get_redis()
queue = Queue(connection=redis_conn)

agent_id_to_campaign_id = {}
campaign_id_to_prompt = {}
campaign_id_to_begin_message = {}
agent_id_to_template_data = {}
# agent_id_to_machine_detection = {}

RETELL_API_KEY = os.environ['RETELL_API_KEY']

WEBSOCKET_BASE_URL = os.environ['WEBSOCKET_BASE_URL']

PADDLE_WEBHOOK_SECRET_KEY = os.environ['PADDLE_WEBHOOK_SECRET_KEY']

@router.post("/users/{user_id}/agents")
async def create_user_agent(user_id: str, data: CreateAgentRequest):
    create_retell_agent_data = {
        "agent_name": data.name,
        "voice_id": data.voice_id,
        "response_engine": {
            "type": "custom-llm",
            "llm_websocket_url": f"{WEBSOCKET_BASE_URL}/llm/pending"
        }
    }
    retell_agent_object = create_agent(create_retell_agent_data)
    if retell_agent_object == None:
        print("unable to create retell agent", flush=True)
        raise HTTPException(status_code=500, detail="Unable to create-agent")
    
    retell_agent_id = retell_agent_object.agent_id

    update_retell_agent_data = {
        "response_engine": {
            "type": "custom-llm",
            "llm_websocket_url": f"{WEBSOCKET_BASE_URL}/llm/{retell_agent_id}"
        }
    }
    
    update_retell_agent_object = update_agent(retell_agent_id, update_retell_agent_data)
    if update_retell_agent_object == None:
        # Log the error
        print("unable to update retell agent", flush=True)
        raise HTTPException(status_code=500, detail="Unable to create-agent")

    phone_number_object = twilio_client.create_phone_number(retell_agent_id)
    if phone_number_object == None:
        # Log the error
        print("unable to create twilio phone number", flush=True)
        raise HTTPException(status_code=500, detail="Unable to create-agent")
    
    timestamp = current_time_in_unix_timestamp()
    agent_data = {
        "user_id": user_id,
        "name": data.name,
        "agent_id": retell_agent_id,
        "type": "inbound",
        "active":True,
        "phone_number": phone_number_object.phone_number,
        "prompt": data.prompt,
        "begin_message": data.begin_message,
        "transfer_to": data.transfer_to or "",
        "availability_schedule": data.availability_schedule or "",
        "non_transfer_timeline": data.non_transfer_timeline or "",
        "transfer_events": data.transfer_events or [],
        "timezone": data.timezone or "",
        "voice_id": data.voice_id or "",
        "created_at": timestamp,
        "updated_at": timestamp
    }

    phone_agents_collection.insert_one(agent_data)

    del agent_data["_id"]

    return JSONResponse(status_code=201, content=agent_data)

@router.get("/users/{user_id}/agents")
async def get_user_agents(user_id: str):
    res_data = []

    filter = {
        "user_id": user_id
    }

    for agent in phone_agents_collection.find(filter, projection={"_id": False, "user_id": False}):
        res_data.append(agent)

    return JSONResponse(status_code=200, content=res_data)

@router.get("/users/{user_id}/agents/{agent_id}")
async def get_user_agent_details(user_id: str, agent_id: str):
    filter = {
        "user_id": user_id,
        "agent_id": agent_id
    }

    agent = phone_agents_collection.find_one(filter, projection={"_id": False, "user_id": False})
    return JSONResponse(status_code=200, content=agent)

@router.patch("/users/{user_id}/agents/{agent_id}")
async def update_user_agent(user_id: str, agent_id: str, data: UpdateAgentRequest):
    filter = {
        "user_id": user_id,
        "agent_id": agent_id
    }

    agent = phone_agents_collection.find_one(filter, projection={"_id": False})
    if agent == None or "phone_number" not in agent:
        return JSONResponse(status_code=404, content={"message": "agent not found"})
    
    if not data.active:
        phone_number = agent["phone_number"]
        twilio_client.delete_phone_number(phone_number)

    updated_data = {
        "name": data.name,
        "prompt": data.prompt,
        "begin_message": data.begin_message,
        "active":data.active,
        "transfer_to": data.transfer_to or "",
        "availability_schedule": data.availability_schedule or "",
        "non_transfer_timeline": data.non_transfer_timeline or "",
        "timezone": data.timezone or "",
        "voice_id": data.voice_id or "",
        "updated_at": current_time_in_unix_timestamp()
    }
    update_retell_agent_data = {
        "voice_id": data.voice_id
    }
    
    update_agent(agent_id, update_retell_agent_data)
    updated_phone_agent_data = {
        "$set": updated_data
    }

    phone_agents_collection.update_one(filter, updated_phone_agent_data)
    
    return JSONResponse(status_code=200, content=updated_data)

@router.patch("/users/{user_id}/agents/archive/{agent_id}")
async def archive_agent(agent_id: str, payload:ArchiveAgentPayload):
    agent = phone_agents_collection.find_one({'agent_id':agent_id}, projection={"_id": False, "user_id": False})
    result =  phone_agents_collection.update_one(
        {"agent_id":agent_id },
        {"$set": {"active": payload.active}}
    )
   
    
    if result.modified_count:
        return JSONResponse(status_code=200, content={"message": "agent deleted successfully",'agent':agent})
    else:
        raise HTTPException(status_code=404, detail="Agent not found or no update needed")

@router.delete("/users/{user_id}/agents/{agent_id}")
async def delete_user_agent(user_id: str, agent_id: str):
    filter = {
        "user_id": user_id,
        "agent_id": agent_id
    }

    agent = phone_agents_collection.find_one(filter, projection={"_id": False, "user_id": False})
    if agent == None:
        return JSONResponse(status_code=404, content={"message": "agent not found"})
    
    phone_number = agent["phone_number"]
    twilio_client.delete_phone_number(phone_number)

    phone_call_logs_collection.delete_many({"agent_id": agent_id})

    delete_agent(agent_id)

    phone_agents_collection.delete_one(filter)

    return JSONResponse(status_code=200, content={"message": "agent deleted successfully"})

@router.post("/agents/{agent_id}/create-web-call")
async def agent_create_web_call(agent_id: str, request: Request):
    """Create a web call and return access_token for RetellWebClient.startCall()."""
    try:
        req_body = await request.json()
    except Exception:
        req_body = {}
    metadata = req_body.get("metadata") if isinstance(req_body, dict) else None

    response = create_web_call(agent_id=agent_id, metadata=metadata)
    if response is None:
        return JSONResponse(status_code=500, content={"message": "Unable to create web call"})

    return JSONResponse(status_code=201, content={
        "access_token": response.access_token,
        "call_type": getattr(response, "call_type", "web_call"),
    })


@router.post("/agents/{agent_id}/register-call")
async def agent_register_call(agent_id: str, request: Request):
    req_body = await request.json()
    data = {
        "agent_id": agent_id,
        "direction": req_body.get("direction", "inbound"),
        "from_number": req_body.get("from_number", ""),
        "to_number": req_body.get("to_number", ""),
        "metadata": req_body.get("metadata"),
    }

    response = register_call(data)
    if response == None:
        return JSONResponse(status_code=500, content={"message": "Unable to register call"})
    
    # retell-sdk v5: PhoneCallResponse has call_id; sample_rate 8000 for Twilio compat
    res_data = {
        "call_id": response.call_id,
        "sample_rate": 8000,
    }

    return JSONResponse(status_code=201, content=res_data)

@router.post("/twilio-voice-webhook/{agent_id_path}")
async def handle_twilio_voice_webhook(request: Request, agent_id_path: str, campaign_id=None, template_data=None):
    # valid = await validate_twilio_webhook(request)
    # if not valid:
    #     return JSONResponse(status_code=401, content={"message": "Unauthorized"})

    filter = {
        "agent_id": agent_id_path
    }

    agent_data = phone_agents_collection.find_one(filter)
    if agent_data == None or "user_id" not in agent_data:
        return JSONResponse(status_code=400, content={"message": "Unable to verify agent"})

    if "active" not in agent_data or not agent_data["active"]:
        return PlainTextResponse(str(VoiceResponse().reject()), media_type='text/xml')
    
    agent_type = ""
    if "type" in agent_data:
        agent_type = agent_data["type"]

    filter = {
        "user_id": agent_data["user_id"]
    }

    agent_user_data = users_collection.find_one(filter)
    if agent_user_data == None:
        return JSONResponse(status_code=400, content={"message": "Unable to verify agent user"})
    
    if "plan" not in agent_user_data or "conversations" not in agent_user_data["plan"]:
        return JSONResponse(status_code=400, content={"message": "Unable to verify agent user plan"})
    
    if agent_user_data["plan"]["conversations"] <= 0:
        return JSONResponse(status_code=403, content={"message": "Insufficient conversations left"})

    if campaign_id is not None:
        agent_id_to_campaign_id[agent_id_path] = parse.unquote(campaign_id)
        campaign_id_to_prompt[campaign_id] = agent_data["prompt"]
        campaign_id_to_begin_message[campaign_id] = agent_data["begin_message"]

    if template_data != None:
        agent_id_to_template_data[agent_id_path] = json.loads(parse.unquote(template_data))

    try:
        post_data = await request.form()

        if "Direction" not in post_data:
            return JSONResponse(status_code=400, content={"message": "Invalid data"})
        
        call_direction = post_data["Direction"]
        if "outbound" in agent_type and "inbound" in str(call_direction):
            return PlainTextResponse(str(VoiceResponse().reject()), media_type='text/xml')

        if "AnsweredBy" in post_data:
            answered_by = post_data["AnsweredBy"]
            match answered_by:
                case "machine_end_beep" | "machine_end_silence" | "machine_end_other":
                    response = VoiceResponse()
                    message = "Please call back. Thank you!"
                    if "voicemail_message" in agent_data and agent_data["voicemail_message"] != "":
                        message = agent_data["voicemail_message"]

                    response.say(message=message)
                    return PlainTextResponse(str(response), media_type='text/xml')
                    # agent_id_to_machine_detection[agent_id_path] = post_data["CallSid"]

        call_response: PhoneCallResponse = twilio_client.retell.call.register_phone_call(
            agent_id=agent_id_path,
            direction="inbound",
            from_number=str(post_data.get('From', '')),
            to_number=str(post_data.get('To', '')),
            metadata={"twilio_call_sid": post_data['CallSid']},
        )
        if call_response:
            response = VoiceResponse()
            start = response.connect()
            start.stream(url=f"wss://api.retellai.com/audio-websocket/{call_response.call_id}")
            
            call_id_to_call_sid[call_response.call_id] = post_data['CallSid']
            return PlainTextResponse(str(response), media_type='text/xml')
    except Exception as err:
        print(f"Error in twilio voice webhook: {err}")
        return JSONResponse(status_code=500, content={"message": "Internal Server Error"})
    
@router.post("/twilio-status-webhook")
async def handle_twilio_status_webhook(agent_id: str, campaign_id: str, request: Request):
    # valid = await validate_twilio_webhook(request)
    # if not valid:
    #     return JSONResponse(status_code=401, content={"message": "Unauthorized"})
    
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

            campaign_data = campaign_collection.find_one(filter)
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

            campaign_collection.update_one(filter=filter, update=updated_lead_data, array_filters=array_filters)
            
            updated_campaign_data = campaign_collection.find_one(filter)

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

            queue.enqueue_at(
                datetime=datetime.datetime.fromtimestamp(float(start_time/1000), tz=timezone),
                f='src.worker.exec_campaign.process_campaign',
                args=(worker_data,),
                job_id=unique_worker_id
            )

            return JSONResponse(status_code=200, content={"message": "Webhook received successfully"})
        
    return JSONResponse(status_code=200, content={"message": "success"})

@router.post("/twilio-amd-webhook")
async def handle_twilio_amd_webhook(agent_id: str, campaign_id: str, request: Request):
    # valid = await validate_twilio_webhook(request)
    # if not valid:
    #     return JSONResponse(status_code=401, content={"message": "Unauthorized"})

    req_body = await request.form()
    answered_by = req_body["AnsweredBy"]
    call_sid = req_body["CallSid"]
    # if answered_by == "machine_end_beep":
        # agent_id_to_machine_detection[agent_id] = call_sid
    
    return JSONResponse(status_code=200, content={"message": "Success"})

@router.get("/agents/{id}/calls")
async def agent_call_logs(id: str):
    filter = {
        "agent_id": id
    }

    res_data = []

    for log in phone_call_logs_collection.find(filter, projection={"agent_id": False}):
        native_id = log["_id"]
        del log["_id"]
        log["id"] = str(native_id)
        res_data.append(log)
    
    return JSONResponse(status_code=200, content=res_data)

@router.get("/calls/{id}")
async def call_id_details(id: str):
    call_details_object = get_call(id)
    if call_details_object == None:
        # Log the error
        print("unable to get call details", flush=True)
        raise HTTPException(status_code=500, detail="Unable to get call details")
    
    return JSONResponse(status_code=200, content=call_details_object.model_dump())

@router.patch("/calls/{id}")
async def update_call_details(id: str, request: Request):
    filter = {
        "call_id": id
    }

    req_body = await request.json()
    if "read" not in req_body:
        return JSONResponse(status_code=400, content={"message": "Invalid request body"}) 

    updated_phone_call_logs = {
        "$set": {
            "read": req_body["read"]
        }
    }

    phone_call_logs_collection.update_one(filter, updated_phone_call_logs)

    return JSONResponse(status_code=200, content={"message": "Updated successfully"})

@router.websocket("/llm/{agent_id}/{call_id}")
async def custom_llm_endpoint(websocket: WebSocket, agent_id: str, call_id: str):
    await websocket.accept()

    # Might need to move this logic down when the 'message' is provided from the agent or campaign
    # if agent_id in agent_id_to_machine_detection:
    #     amd_message = custom_llm_client.draft_machine_detection_message("Please call back. Thank you!")
    #     await websocket.send_text(json.dumps(amd_message))
    #     del agent_id_to_machine_detection[agent_id]

    #     return

    filter = {
        "agent_id": agent_id
    }

    phone_agent = phone_agents_collection.find_one(filter)
    if phone_agent == None:
        return

    phone_agent = dict(phone_agent)
    prompt = phone_agent["prompt"]
    begin_message = phone_agent["begin_message"]

    # TODO: Might not need to save the agent_id_to_campaign_id
    if agent_id in agent_id_to_campaign_id:
        unique_campaign_id = agent_id_to_campaign_id[agent_id]
        prompt = campaign_id_to_prompt[unique_campaign_id]
        begin_message = campaign_id_to_begin_message[unique_campaign_id]

    if agent_id in agent_id_to_template_data:
        template_data = agent_id_to_template_data[agent_id]
        try:
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

        token = calendly_tokens.find_one(filter)
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

            calendly_tokens.update_one(filter, updated_refresh_token_data)

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

    unique_id = agent_id + ":" + call_id
    conversational_memory = []
    all_conversational_memory[unique_id] = conversational_memory
    response_id = 0

    await websocket.send_text(json.dumps(custom_llm_client.draft_begin_messsage(begin_message)))

    async def stream_response(request, prompt, conversational_memory, start_time, end_time, timezone):
        nonlocal response_id
        async for text in custom_llm_client.draft_response(request, prompt, conversational_memory, transfer_events):
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
                    call_sid = call_id_to_call_sid[call_id]
                    twilio_client.transfer_call(call_sid, transfer_to_phone_number)
                else:
                    no_transfer_data = custom_llm_client.no_transfer_response(request['response_id'])
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

@router.post("/retell-webhook")
async def retell_webhook(request: Request):
    # signature = request.headers.get('X-Retell-Signature')
    post_data = await request.json()
    # response_str = json.dumps(post_data, separators=(',', ':'))
    # verification_result = twilio_client.retell.verify(response_str, RETELL_API_KEY, signature)
    # if not verification_result:
    #     raise HTTPException(status_code=401, detail="Request not authorized")

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

    phone_call_logs_collection.insert_one(call_log_data)

    if agent_id in agent_id_to_campaign_id:
        campaign_id = agent_id_to_campaign_id[agent_id]
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

        campaign_collection.update_one(filter=filter, update=updated_lead_data, array_filters=array_filters)

        if campaign_id in campaign_id_to_prompt:
            del campaign_id_to_prompt[campaign_id]
        if campaign_id in campaign_id_to_begin_message:
            del campaign_id_to_begin_message[campaign_id]
        if agent_id in agent_id_to_campaign_id:
            del agent_id_to_campaign_id[agent_id]
        if agent_id in agent_id_to_template_data:
            del agent_id_to_template_data[agent_id]

    filter = {
        "agent_id": agent_id
    }

    agent_data = phone_agents_collection.find_one(filter)
    if agent_data == None or "user_id" not in agent_data:
        return JSONResponse(status_code=200, content={"received": True})
    
    filter = {
        "user_id": agent_data["user_id"]
    }
    
    user_data = users_collection.find_one(filter)

    if user_data == None or "plan" not in user_data:
        return JSONResponse(status_code=200, content={"received": True})
    
    updated_user_data = {
        "$set": {
            "plan.conversations": user_data["plan"]["conversations"] - 1
        }
    }

    users_collection.update_one(filter, update=updated_user_data)

    return JSONResponse(status_code=200, content={"received": True})

@router.post("/calendly/authorize")
async def create_calendly_oauth_tokens(request: Request):
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

    calendly_token = calendly_tokens.find_one(filter=filter)
    if calendly_token == None:
        token_data = {
            "user_id": user_id,
            "owner": res["owner"],
            "refresh_token": res["refresh_token"],
            "created_at": timestamp,
            "updated_at": timestamp
        }

        calendly_tokens.insert_one(token_data)
    else:
        updated_token_data = {
            "$set": {
                "refresh_token": res["refresh_token"],
                "updated_at": timestamp
            }
        }

        calendly_tokens.update_one(filter, updated_token_data)

    return JSONResponse(status_code=200, content={"message": "Calendly account authorized"})

@router.get("/users/{user_id}/calendly/schedules")
async def get_calendly_schedules(user_id: str):
    filter = {
        "user_id": user_id 
    }

    token = calendly_tokens.find_one(filter)
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

        calendly_tokens.update_one(filter, updated_refresh_token_data)

    if not schedule:
        raise HTTPException(status_code=500, detail="Unable to fetch calendly schedules")
    
    return JSONResponse(status_code=200, content={"schedule": convert_schedule_to_string(schedule)})

@router.post("/users/{user_id}/campaigns")
async def create_user_campaign(user_id: str, data: CreateCampaignRequest):
    create_retell_agent_data = {
        "agent_name": data.agent_name,
        "voice_id": data.voice_id,
        "response_engine": {
            "type": "custom-llm",
            "llm_websocket_url": f"{WEBSOCKET_BASE_URL}/llm/pending"
        }
    }
    retell_agent_object = create_agent(create_retell_agent_data)
    if retell_agent_object == None:
        print("unable to create retell agent", flush=True)
        raise HTTPException(status_code=500, detail="Unable to create campaign agent")
    
    retell_agent_id = retell_agent_object.agent_id

    update_retell_agent_data = {
        "response_engine": {
            "type": "custom-llm",
            "llm_websocket_url": f"{WEBSOCKET_BASE_URL}/llm/{retell_agent_id}"
        }
    }
    
    update_retell_agent_object = update_agent(retell_agent_id, update_retell_agent_data)
    if update_retell_agent_object == None:
        print("unable to update retell agent", flush=True)
        raise HTTPException(status_code=500, detail="Unable to create campaign agent")

    phone_number_object = twilio_client.create_phone_number(retell_agent_id)
    if phone_number_object == None:
        print("unable to create twilio phone number", flush=True)
        raise HTTPException(status_code=500, detail="Unable to create campaign agent")

    timestamp = current_time_in_unix_timestamp()
    type = "outbound-zapier" if len(data.leads) == 0 else "outbound-csv"

    agent_data = {
        "user_id": user_id,
        "name": data.agent_name,
        "agent_id": retell_agent_id,
        "type": type,
        "active": True,
        "phone_number": phone_number_object.phone_number,
        "prompt": data.prompt,
        "begin_message": data.begin_message_template,
        "availability_schedule": data.availability_schedule or "",
        "non_transfer_timeline": data.non_transfer_timeline or "",
        "transfer_events": data.transfer_events or [],
        "voicemail_message": data.voicemail_message or "",
        "timezone": data.timezone or "",
        "voice_id": data.voice_id or "",
        "created_at": timestamp,
        "updated_at": timestamp
    }

    phone_agents_collection.insert_one(agent_data)

    campaign_id = str(uuid.uuid4())
    start_time = data.start_time

    for lead in data.leads:
        if "phone_number" not in lead:
            continue

        unique_worker_id = campaign_id + ":" + lead["phone_number"]
        worker_data = {
            "worker_id": unique_worker_id,
            "agent_id": retell_agent_id,
            "begin_message_template": data.begin_message_template,
            "prompt": data.prompt,
            "call_time": start_time,
            "days": data.days,
            "lead": lead,
            "timezone": data.timezone
        }

        timezone = pytz.timezone(data.timezone)

        queue.enqueue_at(
            datetime=datetime.datetime.fromtimestamp(float(start_time), tz=timezone),
            f='src.worker.exec_campaign.process_campaign',
            args=(worker_data,),
            job_id=unique_worker_id
        )

        lead["status"] = "scheduled"
        lead["scheduled_at"] = start_time * 1000
        lead["called_at"] = -1

        start_time += (data.duration * 60)

    new_campaign_data = data.model_dump()
    del new_campaign_data["agent_name"]
    if "voicemail_message" in new_campaign_data:
        del new_campaign_data["voicemail_message"]
    new_campaign_data["agent_id"] = retell_agent_id
    new_campaign_data["campaign_id"] = campaign_id
    new_campaign_data["user_id"] = user_id
    new_campaign_data["created_at"] = timestamp
    new_campaign_data["phone_number"] = phone_number_object.phone_number
    campaign_collection.insert_one(new_campaign_data)
    del new_campaign_data["_id"]
    agent_data["_id"] = str(agent_data["_id"])
    res_data = new_campaign_data | agent_data
    return JSONResponse(status_code=201, content=res_data)

@router.get("/users/{user_id}/campaigns")
async def get_user_campaigns(user_id: str):
    filter = {
        "user_id": user_id
    }

    res_data = []

    for campaign in campaign_collection.find(filter, projection={'_id': False}):
        res_data.append(campaign)
    
    return JSONResponse(status_code=200, content=res_data)

# TODO - `agent_id` should be query_parameter
@router.get("/users/{user_id}/campaigns/{agent_id}")
async def get_user_campaigns_by_agent_id(user_id: str, agent_id: str ):
    filter = {
        "user_id": user_id,
        "agent_id": agent_id
    }

    res_data = []

    phone_agent_data = phone_agents_collection.find_one(filter)
    if phone_agent_data == None or "active" not in phone_agent_data or not phone_agent_data["active"]:
        return JSONResponse(status_code=200, content=res_data)


    for campaign in campaign_collection.find(filter, projection={'_id': False}):
        res_data.append(campaign)
    
    return JSONResponse(status_code=200, content=res_data)

@router.delete("/users/{user_id}/campaigns/{campaign_id}")
async def delete_user_campaign(user_id: str, campaign_id: str):

    filter = {
        "campaign_id": campaign_id,
        "user_id": user_id
    }

    result = campaign_collection.find_one(filter)
    if result == None:
        return JSONResponse(status_code=404, content={"message": "campaign not found"})

    for job_id in queue.job_ids:
        if job_id.find(campaign_id):
            queue.remove(job_id)

    campaign_collection.delete_one(filter)

    return JSONResponse(status_code=200, content={"message": "campaign deleted successfully"})

@router.post("/make-phone-call")
async def make_phone_call(request: Request):
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

    agent_data = phone_agents_collection.find_one(filter)
    if agent_data == None or "phone_number" not in agent_data:
        return JSONResponse(status_code=404, content={"message": "Agent not found"})

    from_number = agent_data["phone_number"]
    twilio_client.create_phone_call(from_number, to_number, agent_id, campaign_id, template_data=post_body)

    return JSONResponse(status_code=200, content={"message": "Phone call made successfully"})

@router.post("/paddle-webhook")
async def paddle_webhook(request: Request):
    paddle_signature = request.headers.get("paddle-signature")
    if paddle_signature is None:
        return JSONResponse(status_code=400, content={"message": "Invalid request"})
        
    tokens = paddle_signature.split(";")
    ts = tokens[0]
    h1 = tokens[1]

    timestamp = ts.split("=")[1]
    signature = h1.split("=")[1]
    
    current_time_in_seconds = current_time_in_unix_timestamp() / 1000

    if int(timestamp) > current_time_in_seconds + 5:
        return JSONResponse(status_code=400, content={"message": "Invalid request"})
    
    bytes_body = await request.body()

    payload = timestamp + ":" + bytes_body.decode()

    computed_signature = hmac.new(
        key=PADDLE_WEBHOOK_SECRET_KEY.encode(),
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
        existing_subscription = subscription_collection.find_one({"user_id": user_id})
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
        users_collection.update_one({"user_id": user_id}, updated_user_data)
        if existing_subscription:
            subscription_collection.update_one({"user_id": user_id}, {"$set": subscription_doc})
            message = "Subscription updated for user {}".format(user_id)
        else:
            # If no subscription exists, insert the new subscription document
            result = subscription_collection.insert_one(subscription_doc)
            message = "Subscription created for user {}".format(user_id)
       
        return JSONResponse(status_code=200, content={"subscription":subscription_doc,'message':message})
    return JSONResponse(status_code=200, content={"message": "webhook listened to event"})

@router.post("/clerk-webhook")
async def clerk_webhook(request: Request):
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

@router.post("/users/{user_id}/api-key")
async def generate_api_key(user_id: str):
    secret = random.randbytes(20).hex()
    seed = random.randbytes(20).hex()
    api_key= await generateApiKey(secret, seed)

    api_key_data = {
        "$set": {
            "user_id": user_id,
            "api_key": api_key
        }
    }

    api_keys_collection.find_one_and_update(filter={"user_id": user_id}, update=api_key_data, upsert=True)

    return JSONResponse(status_code=201, content={"api_key": api_key})

@router.get("/users/{user_id}/api-key")
async def get_api_key(user_id: str):
    filter = {
        "user_id": user_id
    }

    api_key_data = api_keys_collection.find_one(filter, projection={"_id": False, "user_id": False})
    if api_key_data == None:
        return JSONResponse(status_code=404, content={"message": "Api Key not found"})
    
    return JSONResponse(status_code=200, content=api_key_data)

@router.get("/zapier-integration")
async def zapier_integration(x_api_key: Annotated[str | None, Header()] = None):
    filter = {
        "api_key": x_api_key
    }

    api_key_data = api_keys_collection.find_one(filter)
    if api_key_data == None:
        return JSONResponse(status_code=401, content={"message": "Unauthorized"})

    return JSONResponse(status_code=200, content={"id": str(uuid.uuid4()), "message": "Integration successful"})

@router.get("/zapier-dynamic-fields/{agent_id}")
async def zapier_dynamic_fields(agent_id: str):
    filter = {
        "agent_id": agent_id
    }

    agent_data = phone_agents_collection.find_one(filter)
    if not agent_data:
        return JSONResponse(status_code=404, content={"message": "Agent not found"})

    agent_data = dict(agent_data)
    begin_message_template = agent_data["begin_message"]
    prompt = agent_data["prompt"]

    combined_str = f"{begin_message_template} {prompt}"
    unique_fields = { i for i in Template(combined_str).get_identifiers()}

    res = []
    for item in unique_fields:
        val = {
            'key': item,
            'label': item
        }

        res.append(val)
    
    return JSONResponse(status_code=200, content=res)

@router.get("/users/{user_id}/subscription")
async def get_subscription_by_user_id(user_id: str):
    subscription = subscription_collection.find_one({"user_id": user_id})

    if subscription:
        # If a subscription is found, return it
        subscription["_id"] = str(subscription["_id"])
        return JSONResponse(status_code = 200, content = {"subscription":subscription})
    
    return JSONResponse(status_code=404, content={"message":"subscription not found"})

@router.get("/users/{user_id}/user")
async def get_user_by_user_id(user_id: str):
    user = users_collection.find_one({"user_id": user_id})
    if user:
        user["_id"] = str(user["_id"])
        return JSONResponse(status_code = 200, content = {"user":user})
    return JSONResponse(status_code=404, content={"message":"user not found"})

@router.get("/users/{user_id}/conversations")
async def get_user_conversations(user_id: str):
    agents = phone_agents_collection.find({"user_id": user_id}, projection={"_id": False, "user_id": False})
    agent_ids = [agent["agent_id"] for agent in agents]

    if not agent_ids:
        raise HTTPException(status_code=404, detail="No agents found for this user")

    call_logs = phone_call_logs_collection.find({"agent_id": {"$in": agent_ids}}, projection={"_id": False, "user_id": False})
    return JSONResponse(status_code=200, content=list(call_logs))
