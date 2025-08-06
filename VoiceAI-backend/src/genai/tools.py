from pydantic import BaseModel, Field

class EndCall(BaseModel):
    end_call: bool = Field(..., description="Given the conversation transcript, determine if the user wants to end the call.")
    
tools = [
    {
        "type": "function",
        "function":{
            "name": "end_or_transfer_call",
            "description": "Determine if the user wants to end or transfer the call",
            "parameters": EndCall.model_json_schema()
        }
    }
]