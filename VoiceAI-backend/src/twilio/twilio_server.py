import os
import json
import random
import urllib.parse
from retell import Retell
from twilio.rest import Client

BASE_URL = os.environ['BASE_URL']

class TwilioClient:
    def __init__(self):
        self.client = Client(os.environ['TWILIO_ACCOUNT_ID'], os.environ['TWILIO_AUTH_TOKEN'])
        self.retell = Retell(
            api_key=os.environ['RETELL_API_KEY'],
        )
        self.area_codes = ['213', '313'] # Los Angeles, CA; Detroit, MI;

    def create_phone_number(self, agent_id):
        try:
            local_number = self.client.available_phone_numbers('US').local.list(area_code=random.choice(self.area_codes),
                limit=1)
            if (local_number is None or local_number[0] == None):
                raise Exception("No phone numbers of this area code.")
            phone_number_object = self.client.incoming_phone_numbers.create(
                phone_number=local_number[0].phone_number, 
                voice_url=f"{BASE_URL}/twilio-voice-webhook/{agent_id}")
            return phone_number_object
        except Exception as err:
            print(err)
            
    def register_phone_agent(self, phone_number, agent_id):
        try:
            phone_number_objects = self.client.incoming_phone_numbers.list(limit=200)
            number_sid = ''
            for phone_number_object in phone_number_objects:
                if phone_number_object.phone_number == phone_number:
                    number_sid = phone_number_object.sid
            if number_sid is None:
                print("Unable to locate this number in your Twilio account, is the number you used in BCP 47 format?")
                return
            phone_number_object = self.client.incoming_phone_numbers(number_sid).update(
                voice_url=f"{BASE_URL}/twilio-voice-webhook/{agent_id}")
            return phone_number_object
        except Exception as err:
            print(err)
    
    def delete_phone_number(self, phone_number):
        try:
            phone_number_objects = self.client.incoming_phone_numbers.list(limit=200)
            number_sid = ''
            for phone_number_object in phone_number_objects:
                if phone_number_object.phone_number == phone_number:
                    number_sid = phone_number_object.sid
            if number_sid is None:
                print("Unable to locate this number in your Twilio account, is the number you used in BCP 47 format?")
                return
            phone_number_object = self.client.incoming_phone_numbers(number_sid).delete()
            return phone_number_object
        except Exception as err:
            print(err)
    
    def end_call(self, sid):
        try:
            call = self.client.calls(sid).update(
                twiml="<Response><Hangup></Hangup></Response>",
            )
        except Exception as err:
            print(err)
    
    def transfer_call(self, sid, to_number):
        try:
            call = self.client.calls(sid).update(
                twiml=f"<Response><Dial>{to_number}</Dial></Response>",
            )
        except Exception as err:
            print(err)
    
    def create_phone_call(self, from_number, to_number, agent_id, campaign_id=None, template_data=None):
        url = f"{BASE_URL}/twilio-voice-webhook/{agent_id}"
        status_url = f"{BASE_URL}/twilio-status-webhook?agent_id={agent_id}"
        amd_url = f"{BASE_URL}/twilio-amd-webhook?agent_id={agent_id}"
        if campaign_id != None:
            url += f"?campaign_id={urllib.parse.quote(campaign_id)}"
            status_url += f"&campaign_id={urllib.parse.quote(campaign_id)}"
            amd_url += f"&campaign_id={urllib.parse.quote(campaign_id)}"
        if template_data != None:
            url += f"&template_data={urllib.parse.quote(json.dumps(template_data))}"
            
        try:
            self.client.calls.create(
                machine_detection='DetectMessageEnd',
                machine_detection_timeout=30,
                async_amd='false',
                async_amd_status_callback=amd_url,
                async_amd_status_callback_method='POST',
                status_callback=status_url,
                status_callback_method='POST',
                url=url, 
                to=to_number, 
                from_=from_number
            )
        except Exception as err:
            print(err)
