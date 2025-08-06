import os
import json
from openai import OpenAI

end_call_function = {
    "type": "function",
    "function": {
        "name": "end_call",
        "description": "This function is ONLY called when the user explictly requests to end the call.",
        "parameters": {
            "type": "object",
            "properties": {
                "message": {
                    "type": "string",
                    "description": "The message you will say before ending the call with the user.",
                },
            },
            "required": ["message"],
        },
    },
}

# functions= [
#     {
#         "type": "function",
#         "function": {
#             "name": "end_call",
#             "description": "This function is ONLY called when the user explictly requests to end the call.",
#             "parameters": {
#                 "type": "object",
#                 "properties": {
#                     "message": {
#                         "type": "string",
#                         "description": "The message you will say before ending the call with the user.",
#                     },
#                 },
#                 "required": ["message"],
#             },
#         },
#     },
    # {
    #     "type": "function",
    #     "function": {
    #         "name": "transfer_call",
    #         "description": "Transfer the call only when user explicitly requests it.",
    #         "parameters": {
    #             "type": "object",
    #             "properties": {
    #                 "message": {
    #                     "type": "string",
    #                     "description": "The message you will say to the customer before transferring the call.",
    #                 },
    #             },
    #             "required": ["message"],
    #         },
    #     },
    # }
# ]

class LlmClient:
    def __init__(self):
        self.client = OpenAI(
            organization=os.environ['OPENAI_ORGANIZATION_ID'],
            api_key=os.environ['OPENAI_API_KEY'],
        )

    def draft_begin_messsage(self, begin_message):
        return {
            "response_id": 0,
            "content": begin_message,
            "content_complete": True,
            "end_call": False,
        }
    
    def draft_machine_detection_message(self, message):
        return {
            "response_id": 0,
            "content": message,
            "content_complete": True,
            "end_call": True,
        }
    
    def get_user_query(self, transcript):
        user_query = ""
        for utterance in transcript:
            if utterance["role"] == "user":
                user_query = utterance['content']
                
        return user_query
    
    def prepare_prompts(self, request, prompt, conversational_memory):
        user_query = self.get_user_query(request['transcript'])
        messages = []
        messages.append({"role": "system", "content": prompt})
        messages.extend(conversational_memory[-20:])
        messages.append({"role": "user", "content": user_query})
        conversational_memory.append({"role": "user", "content": user_query})

        return messages
    
    def generate_function_data(self, events):
        functions = []
        functions.append(end_call_function)
        if events is not None:
            for event in events:
                prototype = {
                    "type": "function",
                    "function": {
                        "name": event["name"],
                        "description": event["description"],
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "message": {
                                    "type": "string",
                                    "description": "The message you will say",
                                },
                            },
                            "required": ["message"],
                        },
                    },
                }

                functions.append(prototype)

        return functions

    async def draft_response(self, request, prompt, conversational_memory, events):
        functions = self.generate_function_data(events)
        func_call = {}
        func_arguments = ""

        messages = self.prepare_prompts(request, prompt, conversational_memory)
        
        response_text = ""
        stream = self.client.chat.completions.create(
            model="gpt-3.5-turbo-0125",
            messages=messages,
            stream=True,
            tools=functions
        )
        
        for chunk in stream:
            if len(chunk.choices) == 0:
                continue
            if chunk.choices[0].delta.tool_calls:
                tool_calls = chunk.choices[0].delta.tool_calls[0]
                if tool_calls.id:
                    if func_call:
                        # Another function received, old function complete, can break here.
                        break
                    func_call = {
                        "id": tool_calls.id,
                        "func_name": tool_calls.function.name or "",
                        "arguments": {},
                    }
                else:
                    # append argument
                    func_arguments += tool_calls.function.arguments or ""
            if chunk.choices[0].delta.content is not None:
                text = chunk.choices[0].delta.content
                yield {
                    "response_id": request['response_id'],
                    "content": text,
                    "content_complete": False,
                    "end_call": False,
                }
                response_text += text

        if func_call:
            func_name = func_call['func_name']
            func_call['arguments'] = json.loads(func_arguments)
            if  func_name == "end_call":
                yield {
                    "response_id": request['response_id'],
                    "content": func_call['arguments']['message'],
                    "content_complete": True,
                    "end_call": True,
                }
            elif 'transfer' in func_name:
                yield {
                    "action": func_name,
                    "response_id": request['response_id'],
                    "content": func_call['arguments']['message'],
                    "content_complete": True,
                    "end_call": False,
                }
        else:
            yield {
                "response_id": request['response_id'],
                "content": "",
                "content_complete": True,
                "end_call": False,
            }
            
            conversational_memory.append({"role": "assistant", "content": response_text})

    def no_transfer_response(self, response_id: int): # Add the start and end time and calculate when to advise the caller to call back
        text = "Sorry! I cannot transfer the call at the moment. Is there anything else I can help you with?"
        
        return {
            "response_id": response_id,
            "content": text,
            "content_complete": True,
            "end_call": False,
        }
