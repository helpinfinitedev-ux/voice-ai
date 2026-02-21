bjfrom typing import Dict
from src.db.mongodb import get_database
from src.util.utils import current_time_in_unix_timestamp, num_of_milliseconds_in_days

db = get_database()
user_collection = db["users"]

def new_user_plan() -> Dict:
    current_timestamp = current_time_in_unix_timestamp()
    return {
        "conversations": 50,
        'totalConversations':50,
        'agents':1,
        "start_date": current_timestamp,
        "end_date": current_timestamp + num_of_milliseconds_in_days(7),
        "plan_name": "trial",
        "amount": 0
    }

def delete_user_data(data: Dict):
    user_id = data["id"]
    
    filter = {
        "user_id": user_id
    }

    user_collection.delete_one(filter)

def save_new_user_data(data: Dict):
    new_user_data = {
        "user_id": data["id"],
        "first_name": data["first_name"] or "",
        "last_name": data["last_name"] or "",
        "email": data["email_addresses"][0]["email_address"] ,
        "image_url": data["image_url"],
        "created_at": data["created_at"],
        "updated_at": data["updated_at"],
        "plan": new_user_plan(),
        "calendly_integration": False
    }

    user_collection.insert_one(new_user_data)