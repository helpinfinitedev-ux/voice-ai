import os
import json
import pytz
import base64
import requests
import datetime

AUTH_BASE_URL = 'https://auth.calendly.com'
API_BASE_URL = 'https://api.calendly.com'
CLIENT_ID = os.getenv('CALENDLY_CLIENT_ID')
CLIENT_SECRET = os.getenv('CALENDLY_CLIENT_SECRET')
WEBHOOK_SIGINING_KEY = os.getenv('CALENDLY_WEBHOOK_SIGINING_KEY')

def get_basic_auth_b64():
    basic_auth = str(CLIENT_ID) + ':' + str(CLIENT_SECRET)
    return str(base64.b64encode(basic_auth.encode("utf-8")), "utf-8")

def authorize_account(data):
    res = requests.post(
        url=AUTH_BASE_URL + "/oauth/token",
        data=data,
        headers={
            "Authorization": "Basic " + get_basic_auth_b64()
        }
    )

    if res.status_code != 200:
        return None
    
    return json.loads(res.text)

def get_refresh_token(data):
    res = requests.post(
        url=AUTH_BASE_URL + "/oauth/token",
        data=data,
        headers={
            "Authorization": "Basic " + get_basic_auth_b64()
        }
    )

    if res.status_code != 200:
        print("refresh token text: ", res.text, flush=True)
        return None
    
    return json.loads(res.text)

def get_user_availability_schedules(data, owner):
    token_data = get_refresh_token(data)

    if token_data == None:
        return None, None
    
    access_token = token_data["access_token"]
    refresh_token = token_data["refresh_token"]

    res = requests.get(
        url=API_BASE_URL + "/user_availability_schedules?user=" + owner,
        headers={
            "Authorization": "Bearer " + access_token
        }
    )

    if res.status_code != 200:
        print("availability access text: ", res.text, flush=True)
        return None, refresh_token
    
    return json.loads(res.text), refresh_token

def parse_scheduled_events(current_timezone, scheduled_events):
    if "collection" not in scheduled_events or len(scheduled_events["collection"]) <= 0:
        return None
    
    formatted_scheduled_events = []
    scheduled_event_time_format = '%Y-%m-%dT%H:%M:%S.%fZ'
    
    agent_timezone = pytz.timezone(current_timezone)

    current_time = datetime.datetime.now(tz=agent_timezone)

    collection = scheduled_events["collection"]
    for item in collection:
        if "start_time" not in item or "end_time" not in item:
            continue

        start_time = item["start_time"]
        end_time = item["end_time"]

        start_time = datetime.datetime.strptime(start_time, scheduled_event_time_format).astimezone(agent_timezone)
        end_time = datetime.datetime.strptime(end_time, scheduled_event_time_format).astimezone(agent_timezone)

        if start_time >= current_time:
            formatted_scheduled_events.append(start_time.strftime("%A, %B %-d %Y %I:%M %p") + " - " + end_time.strftime("%I:%M %p"))
    
    return "\n".join(x for x in formatted_scheduled_events)

def get_user_scheduled_events(data, owner, current_timezone):
    token_data = get_refresh_token(data)

    if token_data == None:
        return None, None
    
    access_token = token_data["access_token"]
    refresh_token = token_data["refresh_token"]

    res = requests.get(
        url=API_BASE_URL + "/scheduled_events?user=" + owner,
        headers={
            "Authorization": "Bearer " + access_token
        }
    )

    if res.status_code != 200:
        print("user scheduled events: ", res.text, flush=True)
        return None, None

    scheduled_events = json.loads(res.text)
    return parse_scheduled_events(current_timezone, scheduled_events), refresh_token