import os
import json
import httpx
from datetime import datetime
from agent_prompts import AGENT_PROMPTS
import logging

logger = logging.getLogger(__name__)

WORKFLOW_INSTRUCTION = '''
If the user asks for a workflow or diagram, you must provide it using a JSON block formatted exactly like this:
```json
{
  "workflow": {
    "nodes": [
      { "id": "1", "position": { "x": 100, "y": 100 }, "data": { "label": "Node 1" }, "type": "default" }
    ],
    "edges": [
      { "id": "e1-2", "source": "1", "target": "2", "animated": true }
    ]
  }
}
```
'''

def get_base_prompt(agent_name: str) -> str:
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    base_prompt = AGENT_PROMPTS.get(agent_name, 'You are a helpful AI assistant in the MARE multi-agent system.')
    recency_injection = f"\n\n[SYSTEM INFO]\nThe current date and time is {current_time}. You must provide the most modern, up-to-date information available. Avoid outdated practices or old news."
    return base_prompt + recency_injection

async def generate_mistral_stream(client: httpx.AsyncClient, agent_name: str, system_prompt_from_ui: str, user_query: str, mistral_api_key: str):
    base_prompt = get_base_prompt(agent_name)
    editor_context = f"\n\n--- Conversation History & Current Context ---\n{system_prompt_from_ui}" if system_prompt_from_ui else ""
    system_prompt = base_prompt + editor_context + "\n" + WORKFLOW_INSTRUCTION
    
    mistral_payload = {
        "model": "mistral-large-latest",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_query}
        ],
        "stream": True,
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {mistral_api_key}"
    }

    try:
        async with client.stream(
            "POST",
            "https://api.mistral.ai/v1/chat/completions",
            headers=headers,
            json=mistral_payload,
            timeout=httpx.Timeout(60.0)
        ) as response:
            if response.status_code != 200:
                error_text = await response.aread()
                logger.error(f"Mistral API Error {response.status_code}: {error_text}")
                yield f"data: {json.dumps({'error': f'Mistral API Error: {response.status_code}', 'details': error_text.decode('utf-8', errors='ignore')})}\n\n".encode('utf-8')
                return
            
            async for chunk in response.aiter_bytes():
                yield chunk
    except Exception as e:
        logger.error(f"Error streaming from Mistral API: {e}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n".encode('utf-8')
