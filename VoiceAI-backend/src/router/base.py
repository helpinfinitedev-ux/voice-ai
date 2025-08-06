import os
from rq import Queue
from retell import Retell
from src.db.redis import get_redis
from src.db.mongodb import get_database
from src.retell.custom_llm import LlmClient
from src.twilio.twilio_server import TwilioClient

class Base:
    AGENT_ID_TO_CAMPAIGN_ID = 'agent_id_to_campaign_id'
    CAMPAIGN_ID_TO_PROMPT = 'campaign_id_to_prompt'
    CAMPAIGN_ID_TO_BEGIN_MESSAGE = 'campaign_id_to_begin_message'
    AGENT_ID_TO_TEMPLATE_DATA = 'agent_id_to_template_data'
    RETELL_CALL_ID_TO_TWILIO_CALL_SID = 'retell_call_id_to_twilio_call_sid'

    PADDLE_WEBHOOK_SECRET_KEY = os.environ['PADDLE_WEBHOOK_SECRET_KEY']

    def __init__(self):
        self.redis = get_redis()
        self.db = get_database()
        self.queue = Queue(connection=self.redis)
        self.phone_agents_collection = self.db["phone-agents"]
        self.users_collection = self.db["users"]
        self.campaign_collection = self.db["campaigns"]
        self.calendly_tokens = self.db["calendly-auth-tokens"]
        self.phone_call_logs_collection = self.db["phone-call-logs"]
        self.subscription_collection = self.db["subscriptions"]
        self.api_keys_collection = self.db["api-keys"]
        self.custom_llm_client = LlmClient()
        self.twilio = TwilioClient()
        self.retell = Retell(
            api_key=os.environ['RETELL_API_KEY'],
        )
