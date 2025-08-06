import time
from src.db.mongodb import get_database
from src.calendly.apis import get_user_availability_schedules

db = get_database()
phone_agents_collection = db["phone-agents"]
calendly_tokens = db["calendly-auth-tokens"]

def convert_schedule_to_string(schedule):
    schedule_string = ""

    if "collection" not in schedule or len(schedule["collection"]) <= 0:
        return schedule_string
    
    col = schedule["collection"][0]
    if "rules" not in col or len(col["rules"]) <= 0:
        return schedule_string
    
    for rule in col["rules"]:
        if "intervals" not in rule or len(rule["intervals"]) <= 0:
            continue

        day = rule["wday"]
        interval = rule["intervals"][0]
        time = interval["from"] + " - " + interval["to"]

        schedule_string += ("\n" + day + ": " + time)

    return schedule_string

def fetch_and_update_availability_schedule():
    while True:
        phone_agents = phone_agents_collection.find()
        for phone_agent in phone_agents:
            if "availability_schedule" not in phone_agent or phone_agent["availability_schedule"] == "":
                continue

            if "active" not in phone_agent or not phone_agent["active"]:
                continue

            filter = {
                "user_id": phone_agent["user_id"]
            }

            token_data = calendly_tokens.find_one(filter)
            if token_data == None or "refresh_token" not in token_data or \
                not token_data["refresh_token"] or "owner" not in token_data or not token_data["owner"]:
                continue
            
            data = {
                "grant_type": "refresh_token",
                "refresh_token": token_data["refresh_token"]
            }

            owner = token_data["owner"]

            schedule, updated_refresh_token = get_user_availability_schedules(data, owner)

            if not updated_refresh_token or not schedule:
                continue

            updated_refresh_token_data = {
                "$set": {
                    "refresh_token": updated_refresh_token
                }
            }

            calendly_tokens.update_one(filter, updated_refresh_token_data)

            updated_phone_agent_data = {
                "$set": {
                    "availability_schedule": convert_schedule_to_string(schedule)
                }
            }

            filter["agent_id"] = phone_agent["agent_id"]

            phone_agents_collection.update_one(filter, updated_phone_agent_data)

            time.sleep(1.0)

        time.sleep(300.0)