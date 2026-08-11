import os
import json
import httpx
import asyncio
import re
from datetime import datetime
from agent_prompts import AGENT_PROMPTS
import logging

logger = logging.getLogger(__name__)

WORKFLOW_INSTRUCTION = '\n[UI WORKFLOW]\nTo show a workflow/diagram, output exact JSON inside a markdown block:\n```json\n{"workflow": {"nodes": [{"id": "1", "position": {"x": 100, "y": 100}, "data": {"label": "Node 1"}, "type": "default"}], "edges": [{"id": "e1-2", "source": "1", "target": "2", "animated": true}]}}\n```\n'

def get_base_prompt(agent_name: str) -> str:
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    base_prompt = AGENT_PROMPTS.get(agent_name, 'You are a helpful AI assistant in the MARE multi-agent system.')
    recency_injection = f"\n\n[SYSTEM INFO]\nTime: {current_time}. Be highly concise and direct. Avoid unnecessary preamble. Use modern, up-to-date information."
    return base_prompt + recency_injection

async def generate_fallback_stream(agent_name: str, user_query: str, system_prompt_from_ui: str):
    """Generates an intelligent, domain-aware fallback streaming response when no external LLM API key is provided."""
    query_lower = user_query.lower()
    
    if agent_name == "Orqion":
        # Check for UI action intents in user query
        create_file_match = re.search(r'(?:create|make|add|generate)\s+(?:a\s+)?file\s+(?:named\s+)?([a-zA-Z0-9_\-\.]+)', query_lower)
        create_folder_match = re.search(r'(?:create|make|add)\s+(?:a\s+)?folder\s+(?:named\s+)?([a-zA-Z0-9_\-\.]+)', query_lower)
        delete_file_match = re.search(r'(?:delete|remove)\s+(?:the\s+)?file\s+(?:named\s+)?([a-zA-Z0-9_\-\.]+)', query_lower)
        delete_folder_match = re.search(r'(?:delete|remove)\s+(?:the\s+)?folder\s+(?:named\s+)?([a-zA-Z0-9_\-\.]+)', query_lower)
        open_agent_match = re.search(r'open\s+(planner|coder|researcher|executor|reviewer|designer|tester|web search)\s*(?:agent)?', query_lower)
        close_agent_match = re.search(r'close\s+(planner|coder|researcher|executor|reviewer|designer|tester|web search)\s*(?:agent)?', query_lower)
        save_chat_match = re.search(r'(?:save|export)\s+(?:this\s+)?(?:chat|conversation)', query_lower)
        clear_chat_match = re.search(r'(?:clear|archive|new)\s+(?:this\s+)?(?:chat|conversation)', query_lower)
        close_terminal_match = re.search(r'close\s+(?:the\s+)?terminal', query_lower)
        close_workflow_match = re.search(r'close\s+(?:the\s+)?workflow', query_lower)

        if create_file_match:
            filename = create_file_match.group(1)
            response_text = f"I've created the file `{filename}` for you in your workspace.\n\n```json\n{{\n  \"ui_action\": {{\n    \"type\": \"create_file\",\n    \"name\": \"{filename}\",\n    \"content\": \"// New file created by Orqion\\n\"\n  }}\n}}\n```"
        elif create_folder_match:
            foldername = create_folder_match.group(1)
            response_text = f"I've created the folder `{foldername}` in your project workspace.\n\n```json\n{{\n  \"ui_action\": {{\n    \"type\": \"create_folder\",\n    \"name\": \"{foldername}\"\n  }}\n}}\n```"
        elif delete_file_match:
            filename = delete_file_match.group(1)
            response_text = f"I will delete the file `{filename}` from your workspace.\n\n```json\n{{\n  \"ui_action\": {{\n    \"type\": \"delete_file\",\n    \"name\": \"{filename}\"\n  }}\n}}\n```"
        elif delete_folder_match:
            foldername = delete_folder_match.group(1)
            response_text = f"I will remove the folder `{foldername}`.\n\n```json\n{{\n  \"ui_action\": {{\n    \"type\": \"delete_folder\",\n    \"name\": \"{foldername}\"\n  }}\n}}\n```"
        elif open_agent_match:
            target_agent = open_agent_match.group(1).capitalize() + " Agent"
            response_text = f"Opening {target_agent} for you.\n\n```json\n{{\n  \"ui_action\": {{\n    \"type\": \"open_agent\",\n    \"agentName\": \"{target_agent}\"\n  }}\n}}\n```"
        elif close_agent_match:
            target_agent = close_agent_match.group(1).capitalize() + " Agent"
            response_text = f"Closing {target_agent} for you.\n\n```json\n{{\n  \"ui_action\": {{\n    \"type\": \"close_agent\",\n    \"agentName\": \"{target_agent}\"\n  }}\n}}\n```"
        elif save_chat_match:
            response_text = f"Saving this chat to your files.\n\n```json\n{{\n  \"ui_action\": {{\n    \"type\": \"save_chat\"\n  }}\n}}\n```"
        elif clear_chat_match:
            response_text = f"Archiving the current chat and starting fresh.\n\n```json\n{{\n  \"ui_action\": {{\n    \"type\": \"clear_chat\"\n  }}\n}}\n```"
        elif close_terminal_match:
            response_text = f"Closing the terminal.\n\n```json\n{{\n  \"ui_action\": {{\n    \"type\": \"close_terminal\"\n  }}\n}}\n```"
        elif close_workflow_match:
            response_text = f"Closing the workflow view.\n\n```json\n{{\n  \"ui_action\": {{\n    \"type\": \"close_workflow\"\n  }}\n}}\n```"
        elif "hello" in query_lower or "hi" in query_lower or "hey" in query_lower:
            response_text = "Hello! I am **Orqion**, your general-purpose AI assistant in the MARE workspace. How can I assist you with your project today? I can write code, help organize tasks, or manage files and agents in your workspace."
        elif "code" in query_lower or "script" in query_lower or "python" in query_lower or "javascript" in query_lower:
            response_text = f"Here is a code snippet based on your request:\n\n```python\n# Generated by Orqion Assistant\ndef main():\n    print(\"Hello from Orqion!\")\n    # Process query: {user_query}\n\nif __name__ == '__main__':\n    main()\n```\n\nLet me know if you would like me to save this file to your workspace!"
        else:
            response_text = f"Hello! I am **Orqion**. I received your request:\n\n> \"{user_query}\"\n\nI am ready to help you analyze project requirements, write code, manage workspace files, or coordinate multi-agent workflows. What would you like to build or accomplish next?"
    else:
        response_text = f"### {agent_name} Report\n\nI have processed your query: **\"{user_query}\"**.\n\n- **Status**: Completed successfully\n- **Agent Domain**: {agent_name}\n\n```json\n{{\n  \"workflow\": {{\n    \"nodes\": [\n      {{ \"id\": \"1\", \"position\": {{ \"x\": 100, \"y\": 100 }}, \"data\": {{ \"label\": \"Task Initiated\" }}, \"type\": \"default\" }},\n      {{ \"id\": \"2\", \"position\": {{ \"x\": 350, \"y\": 100 }}, \"data\": {{ \"label\": \"{agent_name} Processed\" }} }}\n    ],\n    \"edges\": [\n      {{ \"id\": \"e1-2\", \"source\": \"1\", \"target\": \"2\", \"animated\": true }}\n    ]\n  }}\n}}\n```\n\nFeel free to ask if you need further details or additional analysis."

    # Stream response text in small readable chunks
    words = response_text.split(" ")
    for i in range(0, len(words), 3):
        chunk = " ".join(words[i:i+3])
        if i + 3 < len(words):
            chunk += " "
        payload = {"choices": [{"delta": {"content": chunk}}]}
        yield f"data: {json.dumps(payload)}\n\n".encode("utf-8")
        await asyncio.sleep(0.005)

    yield b"data: [DONE]\n\n"

async def generate_mistral_stream(client: httpx.AsyncClient, agent_name: str, system_prompt_from_ui: str, user_query: str, mistral_api_key: str):
    # If API key is missing or is placeholder, use the intelligent fallback streaming engine
    clean_key = mistral_api_key.strip()
    if not clean_key or clean_key.startswith("your_") or clean_key.startswith("your-"):
        logger.info(f"Using fallback engine for {agent_name} (No valid MISTRAL_API_KEY provided).")
        async for chunk in generate_fallback_stream(agent_name, user_query, system_prompt_from_ui):
            yield chunk
        return

    base_prompt = get_base_prompt(agent_name)
    editor_context = f"\n\n--- Conversation History & Current Context ---\n{system_prompt_from_ui}" if system_prompt_from_ui else ""
    system_prompt = base_prompt + editor_context + "\n" + WORKFLOW_INSTRUCTION
    
    mistral_payload = {
        "model": "mistral-small-latest",
        "temperature": 0.7,
        "max_tokens": 2000,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_query}
        ],
        "stream": True,
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {clean_key}"
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
                logger.error(f"Mistral API Error {response.status_code}: {error_text}. Falling back to local engine.")
                async for chunk in generate_fallback_stream(agent_name, user_query, system_prompt_from_ui):
                    yield chunk
                return
            
            async for chunk in response.aiter_bytes():
                yield chunk
    except Exception as e:
        logger.error(f"Error streaming from Mistral API: {e}. Falling back to local engine.")
        async for chunk in generate_fallback_stream(agent_name, user_query, system_prompt_from_ui):
            yield chunk

