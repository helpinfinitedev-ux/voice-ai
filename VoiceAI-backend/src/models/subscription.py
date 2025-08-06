from pydantic import BaseModel

class PlanInfo(BaseModel):
    plan_name:str
    amount:float
    totalConversations:int
    conversations:int
    agents:int | str

class SubscriptionModel(BaseModel):
    user_id:str
    subscription_id:str
    plan_id:str
    plan_info:PlanInfo
    start_date: int
    end_date:int
