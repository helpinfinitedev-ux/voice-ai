from pydantic import BaseModel
from typing import List, Dict, Any

class CreateCampaignRequest(BaseModel):
    agent_name: str
    user_id: str
    begin_message_template: str
    prompt: str
    start_time: int = 0
    days: List[int] = []
    duration: int = 0
    leads: List[Dict[str, Any]] = []
    timezone: str = ""
    voice_id: str = ""
    retry_duration: int = 0
    max_retries: int = 0
    non_transfer_timeline: str | None = ""
    transfer_events: List[Dict[str, Any]] | None = []
    voicemail_message: str | None = ""
    availability_schedule: str | None = ""
