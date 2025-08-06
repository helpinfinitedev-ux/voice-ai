import os
from retell import Retell
from typing import Dict, Any

RETELL_API_KEY = os.getenv('RETELL_API_KEY')

retell = Retell(
    api_key=str(RETELL_API_KEY)
)

def register_call(data: Dict[str, Any]):
    return retell.call.register(
        **data
    )

def create_agent(data: Dict[str, Any]):
    return retell.agent.create(
        **data
    )

def update_agent(agent_id: str, data: Dict[str, Any]):
    return retell.agent.update(
        agent_id=agent_id,
        **data,
    )

def delete_agent(agent_id: str):
    return retell.agent.delete(
        agent_id=agent_id
    )

def get_call(call_id):
    return retell.call.retrieve(
        call_id=call_id
    )