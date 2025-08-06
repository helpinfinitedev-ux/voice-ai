from pydantic import BaseModel
from typing import List

class UpdateCampaignRequest(BaseModel):
    begin_message_template:str
    prompt:str
    start_time:str
    days:List[int] 
    duration:int
    leads:List
    timezone:str
    voice_id:str

