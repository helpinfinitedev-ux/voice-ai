import os
import anthropic
import json

from httpx import request

end_call_function =  {
                    "name": "end_call",
                    "description": "This function is ONLY called when the user explictly requests to end the call",
                    "input_schema": {  # Corrected to ensure it's a dictionary
                        "type":"object",
                        "parameters": [{
                            "type": "object",
                            "properties": {
                                "message": {
                                    "type": "string",
                                    "description": "The message you will say",
                                },
                            },
                            "required": ["message"],
                        }],
                    },
                }

class LlmClient:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))

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
        #messages.append({"role": "user", "content": "hi"})
        #messages.append({"role": "assistant", "content": prompt})
        messages.extend(conversational_memory[-20:])
        if len(messages) > 0 and messages[-1]["role"] == "user":
            messages[-1]["content"] += " " + user_query
        else:
            messages.append({"role": "user", "content": user_query})

        if len(conversational_memory) > 0  and conversational_memory[-1]["role"] == "user":
            conversational_memory[-1]["content"] += " " + user_query
        else:
            conversational_memory.append({"role": "user", "content": user_query})
        return messages

    # '{
    # "model": "claude-3-opus-20240229",
    # "max_tokens": 1024,
    # "tools": [{
    #     "name": "get_weather",
    #     "description": "Get the current weather in a given location",
    #     "input_schema": {
    #         "type": "object",
    #         "properties": {
    #             "location": {
    #                 "type": "string",
    #                 "description": "The city and state, e.g. San Francisco, CA"
    #             },
    #             "unit": {
    #                 "type": "string",
    #                 "enum": ["celsius", "fahrenheit"],
    #                 "description": "The unit of temperature, either \"celsius\" or \"fahrenheit\""
    #             }
    #         },
    #         "required": ["location"]
    #     }
    # }],
    
    def generate_function_data(self, events):
        functions = []
        # Append the predefined end_call_function
        functions.append(end_call_function)

        if events is not None:
            for event in events:
                prototype = {
                    "name": event["name"],
                    "description": event["description"],
                    "input_schema": {  # Corrected to ensure it's a dictionary
                        "type":"object",
                        "parameters": [{
                            "type": "object",
                            "properties": {
                                "message": {
                                    "type": "string",
                                    "description": "The message you will say",
                                },
                            },
                            "required": ["message"],
                        }],
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
        try:
            # if the events is empty, then stream the response
            if not events:
                stream = self.client.messages.create(
                    max_tokens=1024,
                    messages=messages,
                    system=prompt,
                    model="claude-3-haiku-20240307",
                    stream=True,
                )
                for chunk in stream:
                    if not chunk:
                        return  # If there's no response, exit the function

                    # Assuming the response is a JSON string, let's process it
                    chunk_dict = chunk.to_dict()
                    chunk = chunk_dict.get("delta", [])
                    if chunk:
                        tool_calls = chunk_dict.get("id")
                        if tool_calls:

                            if func_call:
                                # Another function received, old function complete, can break here.
                                return
                            func_call = {
                                "id": tool_calls,
                                "func_name": chunk_dict.get('name', ""),
                                "arguments": {},
                            }
                        else:
                            # Append argument if there's any
                            func_arguments += chunk_dict.get('arguments', "")

                        if chunk:
                            print(chunk, "------------------------------------------")
                            text = chunk.get('text', "")
                            yield {
                                "response_id": request['response_id'],
                                "content": text,
                                "content_complete": False,
                                "end_call": False,
                            }
                            response_text += text
            else:
                # Simulate an API call that returns a response immediately (synchronously)
                chunk = self.client.beta.tools.messages.create(
                    max_tokens=1024,
                    messages=messages,
                    system=prompt,
                    model="claude-3-haiku-20240307",
                    tools=functions,
                    stream=False,
                )

                if not chunk:
                    return  # If there's no response, exit the function

                # Assuming the response is a JSON string, let's process it
                chunk_dict = chunk.to_dict()
                chunk = chunk_dict.get("content", [])
                if chunk:
                    tool_calls = chunk_dict.get("id")
                    func_name = chunk_dict.get("name")
                    if chunk:
                        #print(chunk, "------------------------------------------")
                        text = ""
                        for answer in chunk:
                            if answer.get('type') == 'tool_use':
                                text = answer.get('input', {}).get("message", "")
                                func_name = answer.get("name")
                                func_call = {
                                    "id": tool_calls,
                                    "func_name": func_name,
                                    "arguments": {'message': text},
                                }
                                yield {
                                    "response_id": request['response_id'],
                                    "content": text,
                                    "content_complete": False,
                                    "end_call": False,
                                }
                        if not text:
                            text = chunk[0].get('text', "")
                            yield {
                                "response_id": request['response_id'],
                                "content": text,
                                "content_complete": False,
                                "end_call": False,
                            }
                        response_text += text

        except json.JSONDecodeError as e:
            print("JSON decoding failed:", e)
            chunk = ""

        if func_call:
            func_name = func_call['func_name']
            #func_call['arguments'] = json.loads(func_arguments)
            if func_name == "end_call":
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

        # Add final response to conversational memory if needed
        conversational_memory.append({"role": "assistant", "content": response_text})

    """
    # Async reposponse not supporter in the current version of the API
    async def draft_response(self, request, prompt, conversational_memory, events):
        functions = self.generate_function_data(events)
        func_call = {}
        func_arguments = ""

        messages = self.prepare_prompts(request, prompt, conversational_memory)

        response_text = ""
        try:
            # Simulate an API call that returns a response immediately (synchronously)
            async with self.client.beta.tools.messages.create(
                max_tokens=1024,
                messages=messages,
                model="claude-3-haiku-20240307",
                tools=functions,
                stream=True,
            ) as stream:
                async for chunk in stream.text_stream:
                    if not chunk:
                        return

                    if not chunk:
                        return  # If there's no response, exit the function

                    # Assuming the response is a JSON string, let's process it

                    chunk = chunk.dict().get("content", [])
                    if chunk:
                        tool_calls = chunk[0]
                        if tool_calls:
                            if tool_calls.get('id'):
                                if func_call:
                                    # Another function received, old function complete, can break here.
                                    return
                                func_call = {
                                    "id": tool_calls['id'],
                                    "func_name": tool_calls.get('name', ""),
                                    "arguments": {},
                                }
                            else:
                                # Append argument if there's any
                                func_arguments += tool_calls.get('arguments', "")

        except json.JSONDecodeError as e:
            print("JSON decoding failed:", e)
            chunk = ""

        if chunk:
            print(chunk, "------------------------------------------")
            text = chunk[0].get('text', "")
            yield {
                "response_id": request['response_id'],
                "content": text,
                "content_complete": False,
                "end_call": False,
            }
            response_text += text

        # Add final response to conversational memory if needed
        conversational_memory.append({"role": "assistant", "content": response_text})

        if func_call:
            func_name = func_call['func_name']
            func_call['arguments'] = json.loads(func_arguments)
            if func_name == "end_call":
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

    """

    def no_transfer_response(self, response_id: int): # Add the start and end time and calculate when to advise the caller to call back
        text = "Sorry! I cannot transfer the call at the moment. Is there anything else I can help you with?"

        return {
            "response_id": response_id,
            "content": text,
            "content_complete": True,
            "end_call": False,
        }



