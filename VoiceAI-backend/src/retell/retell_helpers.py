import os
from retell import Retell
from typing import Dict, Any

RETELL_API_KEY = os.getenv('RETELL_API_KEY')

retell = Retell(
    api_key=str(RETELL_API_KEY)
)

def register_call(data: Dict[str, Any]):
    # retell-sdk v5 uses register_phone_call; filter to supported params
    params = {
        "agent_id": data["agent_id"],
        "direction": data.get("direction", "inbound"),
        "from_number": data.get("from_number", ""),
        "to_number": data.get("to_number", ""),
        "metadata": data.get("metadata"),
    }
    return retell.call.register_phone_call(**{k: v for k, v in params.items() if v is not None})

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


def create_web_call(agent_id: str, metadata: Dict[str, Any] = None):
    """Create a web call and return access_token for frontend."""
    params: Dict[str, Any] = {"agent_id": agent_id}
    if metadata is not None:
        params["metadata"] = metadata
    return retell.call.create_web_call(**params)