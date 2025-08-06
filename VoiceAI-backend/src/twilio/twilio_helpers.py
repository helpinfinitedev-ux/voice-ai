import os
from fastapi import Request
from twilio.request_validator import RequestValidator

validator = RequestValidator(os.environ['TWILIO_AUTH_TOKEN'])

async def validate_twilio_webhook(request: Request):
    # body = await request.form()
    body = await request.body()
    signature = request.headers.get("x-twilio-signature")
    if not signature:
        return False
    print("raw_url: ", str(request.url), flush=True)
    print("body: ", body.decode(), flush=True)
    return validator.validate(uri=str(request.url), params=body.decode(), signature=signature)