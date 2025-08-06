from pydantic import BaseModel
from typing import List, Dict, Any

class CreateAgentRequest(BaseModel):
    name: str
    prompt: str
    begin_message: str
    transfer_to: str | None = ""
    availability_schedule: str | None = ""
    non_transfer_timeline: str | None = ""
    timezone: str | None = ""
    active:bool
    voice_id:str
    transfer_events: List[Dict[str, Any]] | None = []
