from pydantic import BaseModel

class UpdateAgentRequest(BaseModel):
    name: str
    prompt: str
    begin_message: str
    transfer_to: str | None = ""
    availability_schedule: str | None = ""
    non_transfer_timeline: str | None = ""
    timezone: str | None = ""
    active:bool
    voice_id:str

class ArchiveAgentPayload(BaseModel):
    active: bool