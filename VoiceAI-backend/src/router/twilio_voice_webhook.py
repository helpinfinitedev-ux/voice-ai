from urllib import parse
from src.router.base import Base
from fastapi import APIRouter, Request
from twilio.twiml.voice_response import VoiceResponse
from retell.resources.call import RegisterCallResponse
from fastapi.responses import JSONResponse, PlainTextResponse

class TwilioVoiceWebhook(Base):
    # def __init__(self):
    #     self.redis_conn = get_redis()
    #     self.db = get_database()
    #     self.phone_agents_collection = self.db["phone-agents"]
    #     self.user

    async def voice(self, request: Request, agent_id: str, campaign_id=None, template_data=None):
        filter = {
            "agent_id": agent_id
        }

        agent_data = self.phone_agents_collection.find_one(filter)
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

        agent_user_data = self.users_collection.find_one(filter)
        if agent_user_data == None:
            return JSONResponse(status_code=400, content={"message": "Unable to verify agent user"})
        
        if "plan" not in agent_user_data or "conversations" not in agent_user_data["plan"]:
            return JSONResponse(status_code=400, content={"message": "Unable to verify agent user plan"})
        
        if agent_user_data["plan"]["conversations"] <= 0:
            return JSONResponse(status_code=403, content={"message": "Insufficient conversations left"})

        if campaign_id is not None:
            self.redis.hset(self.AGENT_ID_TO_CAMPAIGN_ID, agent_id, parse.unquote(campaign_id))
            self.redis.hset(self.CAMPAIGN_ID_TO_PROMPT, campaign_id, agent_data["prompt"])
            self.redis.hset(self.CAMPAIGN_ID_TO_BEGIN_MESSAGE, campaign_id, agent_data["begin_message"])

        if template_data != None:
            self.redis.hset(self.AGENT_ID_TO_TEMPLATE_DATA, agent_id, parse.unquote(template_data))

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

            call_response: RegisterCallResponse = self.retell.call.register(
                agent_id=agent_id, 
                audio_websocket_protocol="twilio", 
                audio_encoding="mulaw", 
                sample_rate=8000,
                from_number=str(post_data.get('From', '')),
                to_number=str(post_data.get('To', '')),
                metadata={"twilio_call_sid": post_data['CallSid'],}
            )
            if call_response:
                response = VoiceResponse()
                start = response.connect()
                start.stream(url=f"wss://api.retellai.com/audio-websocket/{call_response.call_id}")
                
                self.redis.hset(self.RETELL_CALL_ID_TO_TWILIO_CALL_SID, call_response.call_id, str(post_data['CallSid']))
                return PlainTextResponse(str(response), media_type='text/xml')
        except Exception as err:
            print(f"Error in twilio voice webhook: {err}")
            return JSONResponse(status_code=500, content={"message": "Internal Server Error"})
        
router = APIRouter()

@router.post("/twilio-voice-webhook/{agent_id}")
async def handle_twilio_voice_webhook(request: Request, agent_id: str, campaign_id=None, template_data=None):
    return await TwilioVoiceWebhook().voice(request, agent_id, campaign_id, template_data)
        