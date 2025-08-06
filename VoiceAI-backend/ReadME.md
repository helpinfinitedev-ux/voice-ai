# Endpoints
- [POST] `/:user_id/agents`
    ```
    Request data
    {
        "name": <string>,
        "prompt": <string>,
        "begin_message": <string>,
        "transfer_to": <string> {optional}
    }

    Response data (status code: 201)
    {
        "name": <string>,
        "agent_id": <string>,
        "phone_number": <string>,
        "prompt": <string>,
        "begin_message": <string>,
        "transfer_to": <string> {optional}
    }
    ```

- [GET] `/:user_id/agents/`
    ```
    Response data (status code: 200)
    [
        {
            "name": <string>,
            "agent_id": <string>,
            "phone_number": <string>,
            "prompt": <string>,
            "begin_message": <string>,
            "transfer_to": <string> {optional}
        }
    ]
    ```

- [GET] `/:user_id/agents/:id`
    ```
    Response data (status code: 200)
    {
        "name": <string>,
        "phone_number": <string>,
        "prompt": <string>,
        "begin_message": <string>,
        "transfer_to": <string> {optional}
    }
    ```

- [PATCH] `/:user_id/agents/:id`
    ```
    Request data
    {
        "name": <string>,
        "prompt": <string>,
        "begin_message": <string>,
        "transfer_to": <string> {optional}
    }

    Response data (status code: 200)
    {
        "name": <string>,
        "prompt": <string>,
        "begin_message": <string>,
        "transfer_to": <string> {optional}
    }
    ```

- [DELETE] `/:user_id/agents/:agent_id`
    ```
    No Response data (status code: 200)
    ```

- [GET] `/agents/{id}/calls`
    ```
    Response data (status code: 200)
    [
        {
            "call_id": <string>,
            "start_timestamp": <int>,
            "end_timestamp": <int>,
            "from_number": <string>
        }
    ]
    ```

- [GET] `/calls/{id}`
    ```
    Response data (status code - 200)
    {
        "call_id": "c59ebc825180054d6139a6aa2ce7deed",
        "agent_id": "804414d6de95f97d0f1075f54fa2a7bc",
        "audio_websocket_protocol": "twilio",
        "audio_encoding": "mulaw",
        "sample_rate": 8000,
        "call_status": "ended",
        "start_timestamp": 1709740665525,
        "end_timestamp": 1709740684490,
        "transcript": "Agent: Hey there! I see that you're interested in the property at 123 Main Street. I'd be happy to provide more information about it. What specifically would you \nUser: Yeah.\nAgent: like to know? \nUser: Can you hear me?\nUser: what?\nAgent: Sorry, I didn't catch that. Can you hear me okay? If you're having trouble with the \n",
        "recording_url": "https://dxc03zgurdly9.cloudfront.net/c59ebc825180054d6139a6aa2ce7deed/recording.wav",
        "e2e_latency": {
            "p50": 1008,
            "p90": 1008,
            "p95": 1008,
            "max": 1008,
            "min": 1008,
            "num": 1
        },
        "end_call_after_silence_ms": 600000
    }
    ```