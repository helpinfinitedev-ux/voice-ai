from src.db.mongodb import get_database

db = get_database()
phone_agents_collection = db["phone-agents"]
phone_call_logs_collection = db["phone-call-logs"]
calendly_tokens = db["calendly-auth-tokens"]
campaign_collection = db["campaigns"]
subscription_collection = db['subscriptions']
api_keys_collection = db["api-keys"]
users_collection = db["users"]

projection = {
    '_id': False
}

def get_phone_agent(agent_id):
    filter = {
        "agent_id": agent_id
    }
    return phone_agents_collection.find_one(filter, projection=projection)

def get_campaign_data(campaign_id: str):
    filter = {
        "campaign_id": campaign_id
    }
    return campaign_collection.find_one(filter, projection=projection)

def get_begin_message_and_prompt(agent_id: str, campaign_id: str | None = None):
    if campaign_id is None:
        agent_data = get_phone_agent(agent_id)
        if agent_data is None or ("begin_message" not in agent_data or "prompt" not in agent_data):
            return None, None
        else:
            agent_data = dict(agent_data)
            return agent_data["begin_message"] or "", agent_data["prompt"] or "" 
    else:
        campaign_data = get_campaign_data(campaign_id)
        if campaign_data is None or ("begin_message_template" not in campaign_data or "prompt" not in campaign_data):
            return None, None
        else:
            campaign_data = dict(campaign_data)
            return campaign_data.get("begin_message_template"), campaign_data.get("prompt")
