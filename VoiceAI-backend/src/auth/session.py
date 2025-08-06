import datetime
from typing import Dict
from fastapi import Request
from src.db.mongodb import get_database

db = get_database()
session_collection = db["sessions"]
api_keys_collection = db["api-keys"]

def remove_user_session(data: Dict):
    if "user_id" not in data or "id" not in data:
        return
    
    filter = {
        "session_id": data["id"],
        "user_id": data["user_id"]
    }

    session_collection.delete_one(filter)

def save_user_session(data: Dict):
    session_id = data["id"]
    user_id = data["user_id"]
    expire_at = data["expire_at"]

    filter = {
        "user_id": user_id
    }

    session_data = {
        "$set": {
            "session_id": session_id,
            "expire_at": expire_at
        }
    }

    session_collection.find_one_and_update(filter=filter, update=session_data, upsert=True)

def is_session_valid(session_id: str, user_id: str):
    filter = {
        "session_id": session_id,
        "user_id": user_id
    }

    session = session_collection.find_one(filter)
    if session == None:
        return False
    
    session_expiry_timestamp = session["expire_at"]
    current_timestamp = int(datetime.datetime.now().timestamp() * 1000)

    return session_expiry_timestamp > current_timestamp

def is_api_key_valid(x_api_key: str):
    filter = {
        "api_key": x_api_key
    }

    api_key_data = api_keys_collection.find_one(filter)
    return api_key_data != None

def authenticate_request(request: Request):
    session_id = request.headers.get("session-id")
    user_id = request.headers.get("user-id")
    x_api_key = request.headers.get("x-api-key")
    if session_id != None and user_id != None:
        return is_session_valid(session_id, user_id)
    elif x_api_key != None:
        return is_api_key_valid(x_api_key)
    else:
        print("No auth data provided", flush=True)
        return False