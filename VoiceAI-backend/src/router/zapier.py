import uuid
from string import Template
from typing import Annotated
from src.router.base import Base
from fastapi.responses import JSONResponse
from fastapi import APIRouter, Header

class Zapier(Base):
    async def integrate(self, x_api_key: Annotated[str | None, Header()] = None):
        filter = {
            "api_key": x_api_key
        }

        api_key_data = self.api_keys_collection.find_one(filter)
        if api_key_data == None:
            return JSONResponse(status_code=401, content={"message": "Unauthorized"})

        return JSONResponse(status_code=200, content={"id": str(uuid.uuid4()), "message": "Integration successful"})

    async def dynamic_fields(self, agent_id: str):
        filter = {
            "agent_id": agent_id
        }

        agent_data = self.phone_agents_collection.find_one(filter)
        if not agent_data:
            return JSONResponse(status_code=404, content={"message": "Agent not found"})

        agent_data = dict(agent_data)
        begin_message_template = agent_data["begin_message"]
        prompt = agent_data["prompt"]

        combined_str = f"{begin_message_template} {prompt}"
        unique_fields = { i for i in Template(combined_str).get_identifiers()}

        res = []
        for item in unique_fields:
            val = {
                'key': item,
                'label': item
            }

            res.append(val)
        
        return JSONResponse(status_code=200, content=res)

router = APIRouter()
zapier = Zapier()

@router.get("/zapier-integration")
async def zapier_integration(x_api_key: Annotated[str | None, Header()] = None):
    return await zapier.integrate(x_api_key)
