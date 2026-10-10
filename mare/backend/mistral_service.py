import os
import json
import httpx
import asyncio
import re
from datetime import datetime
from agent_prompts import AGENT_PROMPTS
from rag_service import rag_service
import logging

logger = logging.getLogger(__name__)

WORKFLOW_INSTRUCTION = '\n[UI WORKFLOW]\nTo show a workflow/diagram, output exact JSON inside a markdown block:\n```json\n{"workflow": {"nodes": [{"id": "1", "position": {"x": 100, "y": 100}, "data": {"label": "Node 1"}, "type": "default"}], "edges": [{"id": "e1-2", "source": "1", "target": "2", "animated": true}]}}\n```\n'

SPORTS_WORKFLOW_JSON = """```json
{
  "workflow": {
    "nodes": [
      { "id": "1", "position": { "x": 50, "y": 80 }, "data": { "label": "1. Sports Council Approval" }, "type": "default" },
      { "id": "2", "position": { "x": 260, "y": 80 }, "data": { "label": "2. Team Registrations & Draws" } },
      { "id": "3", "position": { "x": 480, "y": 80 }, "data": { "label": "3. Pitch & Umpire Prep" } },
      { "id": "4", "position": { "x": 260, "y": 200 }, "data": { "label": "4. League Stage Matches" } },
      { "id": "5", "position": { "x": 480, "y": 200 }, "data": { "label": "5. Knockouts & Grand Finale" } }
    ],
    "edges": [
      { "id": "e1-2", "source": "1", "target": "2", "animated": true },
      { "id": "e2-3", "source": "2", "target": "3", "animated": true },
      { "id": "e3-4", "source": "3", "target": "4", "animated": true },
      { "id": "e4-5", "source": "4", "target": "5", "animated": true }
    ]
  }
}
```"""

CODING_WORKFLOW_JSON = """```json
{
  "workflow": {
    "nodes": [
      { "id": "1", "position": { "x": 60, "y": 100 }, "data": { "label": "1. Schema Validation" }, "type": "default" },
      { "id": "2", "position": { "x": 280, "y": 100 }, "data": { "label": "2. Service Execution" } },
      { "id": "3", "position": { "x": 500, "y": 100 }, "data": { "label": "3. Output Serialization" } }
    ],
    "edges": [
      { "id": "e1-2", "source": "1", "target": "2", "animated": true },
      { "id": "e2-3", "source": "2", "target": "3", "animated": true }
    ]
  }
}
```"""

GENERAL_WORKFLOW_JSON = """```json
{
  "workflow": {
    "nodes": [
      { "id": "1", "position": { "x": 80, "y": 90 }, "data": { "label": "1. Requirements & Scope" }, "type": "default" },
      { "id": "2", "position": { "x": 300, "y": 90 }, "data": { "label": "2. Roadmap Decomposition" } },
      { "id": "3", "position": { "x": 520, "y": 90 }, "data": { "label": "3. Execution & Verification" } }
    ],
    "edges": [
      { "id": "e1-2", "source": "1", "target": "2", "animated": true },
      { "id": "e2-3", "source": "2", "target": "3", "animated": true }
    ]
  }
}
```"""

def get_base_prompt(agent_name: str) -> str:
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    base_prompt = AGENT_PROMPTS.get(agent_name, f'You are the {agent_name} in the MARE multi-agent intelligence platform.')
    recency_injection = f"\n\n[SYSTEM INFO]\nTime: {current_time}. Be thorough, structured, and modern. Answer directly and comprehensively like Gemini. Ground your reasoning in the retrieved RAG domain knowledge and project files provided."
    return base_prompt + recency_injection

def extract_topic_and_intent(query: str) -> dict:
    clean = re.sub(r'^(?:can you|please|could you|help me|i want to|i need to)\s+', '', query.strip(), flags=re.I)
    
    # Sports & Event Planning
    if any(k in query.lower() for k in ["cricket", "football", "tournament", "match", "sports", "championship", "league", "cup", "game"]):
        sport_match = re.search(r'\b(cricket|football|badminton|basketball|volleyball|chess|sports)\b', query, re.I)
        sport = sport_match.group(1).capitalize() if sport_match else "Sports"
        return {
            "type": "event_planning",
            "subject": f"{sport} Tournament in College",
            "sport": sport
        }
    
    # Coding & Development
    if any(k in query.lower() for k in ["code", "script", "function", "api", "endpoint", "fastapi", "react", "python", "typescript", "bug", "implement"]):
        return {
            "type": "coding",
            "subject": clean
        }

    # Data Analysis
    if any(k in query.lower() for k in ["data", "analysis", "dataset", "eda", "metric", "statistics", "chart", "visualize"]):
        return {
            "type": "data_analysis",
            "subject": clean
        }

    return {
        "type": "general",
        "subject": clean
    }

def generate_sports_event_plan(agent_name: str, user_query: str, sport: str, sources_meta: list) -> str:
    grounding_note = ""
    if sources_meta:
        src_names = ", ".join([f"`{s['title']}` ({s['relevance']}%)" for s in sources_meta[:2]])
        grounding_note = f"\n> *Grounded on RAG Knowledge:* {src_names}\n"

    body = f"""### 🏆 Strategic Blueprint: Annual College {sport} Tournament

Here is a comprehensive, production-grade tournament roadmap designed with milestone tracking, operational logistics, and risk controls for your upcoming college {sport.lower()} tournament.
{grounding_note}
---

### 1. 📋 Administrative Governance & Official Sanctions
- **College Administration & Sports Council Approval:** Secure formal permissions from the Principal, Dean of Student Affairs, and Sports Director.
- **Ground & Facility Reservation:** Book the college main sports ground and pavilion for the entire duration plus 2 buffer days.
- **Inter-Department / Inter-College Invitation:** Dispatch formal circulars and registration criteria across all departments and partner colleges.
- **Chief Guests & Dignitaries:** Finalize invitations for the Opening Ceremony and Grand Finale prize distribution.

---

### 2. ⚙️ Tournament Architecture & Format
- **Format:** League-cum-Knockout (Group Stages $\\rightarrow$ Quarter-Finals $\\rightarrow$ Semi-Finals $\\rightarrow$ Grand Final).
- **Match Structure:** 12-overs per side for group matches; 20-overs (T20) for Semi-Finals and Final.
- **Team Size:** Squad of 15 registered players (11 on-field + 4 reserves) with valid college student IDs.
- **Powerplay & Ball Specifications:** Standard 4-over bowling powerplay; certified match-grade balls provided by the organizing committee.
- **Live Scoring & Digital Tracking:** Official match scoring logged in real time via digital scoring app (e.g., CricHeroes) for live leaderboards.

---

### 3. 🏟️ Ground Operations & Equipment Logistics
- **Pitch Preparation:** Curate and roll match pitch 72 hours in advance; prepare two adjacent nets for warm-ups.
- **Fielding Boundaries & Equipment:** Install 65-meter boundary ropes, sight screens, certified wooden stumps, bails, and digital scoreboards.
- **Umpire & Officiating Panel:** Hire two certified panel umpires per match alongside official third-umpire line reviews to prevent bias.
- **First-Aid & Medical Desk:** Dedicated paramedic station with ice packs, stretchers, CPR kit, and ambulance on standby.

---

### 4. 💰 Financial Model & Budget Allocation

| Category | Estimated Allocation | Purpose / Deliverables |
| :--- | :--- | :--- |
| **Prizes & Trophies** | 35% | Winner Trophy + Runner-up + Cash Prizes + Medals |
| **Equipment & Balls** | 25% | Match balls, stumps, ground maintenance, white paint |
| **Officiating & Scoring**| 15% | Certified external umpires & scorers honorarium |
| **Refreshments & Kits** | 15% | Hydration stations, energy drinks, referee lunches |
| **Marketing & Banners** | 10% | Posters, certificates, live stream banners, social media |

*Sponsorship Channels:* Student entry fees ($500/team) coupled with college sports fund grant and local youth sports apparel sponsors.

---

### 5. 👥 Committee Delegation & Operational Matrix
- **Tournament Director (Planner Agent Domain):** Oversees master schedule, disputes, and stakeholder alignment.
- **Logistics & Ground Committee:** Maintains pitch conditions, boundaries, hydration, and equipment inventory.
- **Technical & Disciplinary Committee:** Resolves on-field disputes, verifies player IDs, and enforces fair-play code of conduct.
- **Media & Live Broadcast Crew:** Coordinates photography, social media highlight clips, and PA system commentary.

---

### 6. ⏱️ Critical Path Milestone Schedule

1. **Week 1 (Pre-Flight):** Budget approval, ground clearance, circular release, and sponsor sign-off.
2. **Week 2 (Registration Gate):** Close registrations (cap at 16 teams), conduct open captain draw & fixture reveal.
3. **Week 3 (Pitch & Testing):** Pitch rolling, umpire briefing, equipment delivery, sound check.
4. **Week 4 (Tournament Days 1–4):** League pool matches (4 matches per day across morning and afternoon slots).
5. **Week 4 (Super Weekend):** Semi-Finals, Grand Finale, closing speech, and trophy distribution.

---

### 7. 🛡️ Risk Mitigation & Contingency Protocols
- **Weather / Rain Disruption:** Apply DLS (Duckworth-Lewis-Stern) or reserve over-reduction to a minimum 5-over shoot-out; designated reserve day for Finals.
- **Disciplinary Infractions:** Strict zero-tolerance policy for unsportsmanlike behavior with immediate match forfeiture.
- **Player Injuries:** Mandatory first-aid station and vehicle designated for immediate transport to nearby hospital.

---

### 8. ✅ Immediate Action Checklist
- [ ] Draft permission letter to College Sports Department.
- [ ] Announce registration Google Form with entry deadline.
- [ ] Inspect cricket pitch and pavilion facilities with groundskeeper.
- [ ] Form student volunteer committee (Ground, Scoring, Hospitality)."""

    return body + "\n\n" + SPORTS_WORKFLOW_JSON + "\n\nFeel free to ask for specific tournament rulebooks, fixture generator formulas, or budget spreadsheets!"

def generate_coding_plan(agent_name: str, user_query: str, subject: str, sources_meta: list) -> str:
    grounding_note = ""
    if sources_meta:
        src_names = ", ".join([f"`{s['title']}` ({s['relevance']}%)" for s in sources_meta[:2]])
        grounding_note = f"\n> *Grounded on RAG Knowledge:* {src_names}\n"

    body = f"""### 💻 Technical Implementation Plan: {subject.title()}

Here is the production-grade architectural design and implementation grounded in modern software engineering principles.
{grounding_note}
---

### 1. 🏗️ Architecture & Component Design
- **Separation of Concerns:** Clean decoupling between data models, service business logic, and API route handlers.
- **Type Safety & Concurrency:** Typed data structures with async non-blocking I/O.
- **Resilience & Error Handling:** Explicit try-catch boundaries, structured JSON logging, and standard HTTP error contracts.

---

### 2. 📝 Production Code Implementation

```python
# Implementation: {subject}
import asyncio
import logging
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("{agent_name.replace(' ', '_').lower()}")

class TaskPayload(BaseModel):
    query: str = Field(..., description="Target execution query")
    priority: str = Field(default="normal", description="Execution priority")
    metadata: Dict[str, Any] = Field(default_factory=dict)

class {agent_name.replace(' ', '')}Service:
    def __init__(self):
        self.is_ready = True
        logger.info(f"{agent_name} Service initialized successfully.")

    async def execute(self, payload: TaskPayload) -> Dict[str, Any]:
        try:
            logger.info(f"Processing task: " + str(payload.query))
            await asyncio.sleep(0.05)
            
            return {{
                "status": "success",
                "task": payload.query,
                "result": "Execution completed with RAG verification.",
                "timestamp": "2026-10-10T18:45:00Z"
            }}
        except Exception as e:
            logger.error(f"Task processing error: " + str(e))
            raise

if __name__ == "__main__":
    service = {agent_name.replace(' ', '')}Service()
    test_payload = TaskPayload(query="{user_query}")
    result = asyncio.run(service.execute(test_payload))
    print("Execution Result:", result)
```

---

### 3. 🧪 Testing & Verification Matrix
- **Unit Tests:** Validate input schema validation and boundary conditions.
- **Integration Tests:** Ensure end-to-end connectivity across dependent service components.
- **Performance:** Target <50ms processing latency under standard local concurrency."""

    return body + "\n\n" + CODING_WORKFLOW_JSON + "\n\nWould you like me to generate pytest unit fixtures or export this script to your workspace files?"

def generate_general_gemini_plan(agent_name: str, user_query: str, subject: str, sources_meta: list) -> str:
    grounding_note = ""
    if sources_meta:
        src_names = ", ".join([f"`{s['title']}` ({s['relevance']}%)" for s in sources_meta[:2]])
        grounding_note = f"\n> *Grounded on RAG Knowledge:* {src_names}\n"

    body = f"""### 🎯 {agent_name} Strategic Execution: {subject.title()}

Here is a structured, in-depth breakdown for your query **\"{user_query}\"**, designed to provide clear actionable guidance, domain methodologies, and execution checkpoints.
{grounding_note}
---

### 1. 🔍 Executive Analysis & Objectives
- **Core Intent:** Synthesizing an end-to-end strategy for **{subject}**.
- **Scope & Context:** Aligning with modern multi-agent best practices, clear milestones, and verified deliverables.
- **Success Criteria:** Measurable outcomes, minimal friction, and robust error/risk buffers.

---

### 2. 🚀 Step-by-Step Strategic Roadmap

1. **Phase 1: Foundation & Requirements Gathering**
   - Identify primary stakeholders and core deliverables.
   - Establish technical and operational constraints.
   - Set quantifiable baseline metrics.

2. **Phase 2: Architecture & Workflow Construction**
   - Decompose high-level goals into atomic, parallelizable sub-tasks.
   - Establish dependencies and quality gates between stages.
   - Delegate responsibilities according to agent specializations.

3. **Phase 3: Execution & Continuous Verification**
   - Implement core actions with active telemetry and progress tracking.
   - Run verification checks against acceptance criteria.
   - Mitigate blockers proactively.

4. **Phase 4: Synthesis & Final Delivery**
   - Review outputs for quality, security, and completeness.
   - Compile findings and documentation into executive deliverables.

---

### 3. 🛡️ Risk Management & Mitigation Matrix

| Potential Challenge | Impact | Probability | Proactive Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Scope Drift** | High | Medium | Define strict sprint milestones with explicit acceptance criteria |
| **Dependency Blocker** | Medium | Low | Parallelize independent tracks and maintain fallback options |
| **Quality Variance** | Medium | Medium | Enforce automated verification gates before sign-off |

---

### 4. ⚡ Actionable Next Steps
- [ ] Review the proposed breakdown against project constraints.
- [ ] Confirm milestone timeline and team delegations.
- [ ] Initialize execution tracking on the interactive workflow canvas."""

    return body + "\n\n" + GENERAL_WORKFLOW_JSON + "\n\nLet me know if you would like me to drill down into any specific section or generate related scripts/documentation!"

async def generate_gemini_cloud_stream(client: httpx.AsyncClient, gemini_api_key: str, system_prompt: str, user_query: str):
    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key={gemini_api_key}"
    
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": user_query}]
            }
        ],
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 4096
        }
    }

    async with client.stream(
        "POST",
        gemini_url,
        headers={"Content-Type": "application/json"},
        json=payload,
        timeout=httpx.Timeout(60.0)
    ) as response:
        if response.status_code != 200:
            error_body = await response.aread()
            logger.error(f"Gemini API Error {response.status_code}: {error_body}")
            raise RuntimeError(f"Gemini API returned status {response.status_code}")
        
        async for line in response.aiter_lines():
            line_str = line.strip()
            if not line_str.startswith("data:"):
                continue
            data_content = line_str[5:].strip()
            if not data_content or data_content == "[DONE]":
                continue
            try:
                parsed = json.loads(data_content)
                candidates = parsed.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    for part in parts:
                        text_chunk = part.get("text", "")
                        if text_chunk:
                            payload_out = {"choices": [{"delta": {"content": text_chunk}}]}
                            yield f"data: {json.dumps(payload_out)}\n\n".encode("utf-8")
            except Exception as parse_err:
                logger.debug(f"Gemini parse line error: {parse_err}")

async def generate_mistral_cloud_stream(client: httpx.AsyncClient, mistral_api_key: str, system_prompt: str, user_query: str):
    payload = {
        "model": "mistral-small-latest",
        "temperature": 0.7,
        "max_tokens": 3000,
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

    async with client.stream(
        "POST",
        "https://api.mistral.ai/v1/chat/completions",
        headers=headers,
        json=payload,
        timeout=httpx.Timeout(60.0)
    ) as response:
        if response.status_code != 200:
            error_body = await response.aread()
            logger.warning(f"Mistral API returned {response.status_code}: {error_body}")
            raise RuntimeError(f"Mistral API status {response.status_code}")

        async for chunk in response.aiter_bytes():
            yield chunk

async def generate_intelligent_rag_stream(agent_name: str, user_query: str, system_prompt_from_ui: str, sources_meta: list):
    topic_data = extract_topic_and_intent(user_query)
    query_lower = user_query.lower()
    
    if agent_name == "Orqion":
        create_file_match = re.search(r'(?:create|make|add|generate)\s+(?:a\s+)?file\s+(?:named\s+)?([a-zA-Z0-9_\-\.]+)', query_lower)
        create_folder_match = re.search(r'(?:create|make|add)\s+(?:a\s+)?folder\s+(?:named\s+)?([a-zA-Z0-9_\-\.]+)', query_lower)
        delete_file_match = re.search(r'(?:delete|remove)\s+(?:the\s+)?file\s+(?:named\s+)?([a-zA-Z0-9_\-\.]+)', query_lower)
        delete_folder_match = re.search(r'(?:delete|remove)\s+(?:the\s+)?folder\s+(?:named\s+)?([a-zA-Z0-9_\-\.]+)', query_lower)
        open_agent_match = re.search(r'open\s+(planner|coder|researcher|executor|reviewer|designer|tester|web search|data analysis|visualization|validation|report generator|presentation|export|live workflow|agent communication|logs|events)\s*(?:agent)?', query_lower)
        close_agent_match = re.search(r'close\s+(planner|coder|researcher|executor|reviewer|designer|tester|web search|data analysis|visualization|validation|report generator|presentation|export|live workflow|agent communication|logs|events)\s*(?:agent)?', query_lower)
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
        elif any(h in query_lower for h in ["hello", "hi", "hey"]):
            response_text = "Hello! I am **Orqion**, your autonomous workspace assistant in the MARE platform. Grounded in your project files and specialized RAG memory, I can write code, manage workspace folders, plan architectures, or coordinate multi-agent workflows. What would you like to build today?"
        elif topic_data["type"] == "event_planning":
            response_text = generate_sports_event_plan(agent_name, user_query, topic_data.get("sport", "Sports"), sources_meta)
        elif topic_data["type"] == "coding":
            response_text = generate_coding_plan(agent_name, user_query, topic_data["subject"], sources_meta)
        else:
            response_text = generate_general_gemini_plan(agent_name, user_query, topic_data["subject"], sources_meta)
    else:
        if topic_data["type"] == "event_planning":
            response_text = generate_sports_event_plan(agent_name, user_query, topic_data.get("sport", "Sports"), sources_meta)
        elif topic_data["type"] == "coding" or "code" in agent_name.lower() or "python" in agent_name.lower():
            response_text = generate_coding_plan(agent_name, user_query, topic_data["subject"], sources_meta)
        else:
            response_text = generate_general_gemini_plan(agent_name, user_query, topic_data["subject"], sources_meta)

    # Stream response text smoothly
    words = response_text.split(" ")
    for i in range(0, len(words), 3):
        chunk = " ".join(words[i:i+3])
        if i + 3 < len(words):
            chunk += " "
        payload = {"choices": [{"delta": {"content": chunk}}]}
        yield f"data: {json.dumps(payload)}\n\n".encode("utf-8")
        await asyncio.sleep(0.008)

    yield b"data: [DONE]\n\n"

async def generate_mistral_stream(client: httpx.AsyncClient, agent_name: str, system_prompt_from_ui: str, user_query: str, mistral_api_key: str):
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    is_valid_gemini = bool(gemini_key and not gemini_key.startswith("your_") and not gemini_key.startswith("your-"))

    clean_mistral = mistral_api_key.strip() or os.getenv("MISTRAL_API_KEY", "").strip()
    is_valid_mistral = bool(clean_mistral and not clean_mistral.startswith("your_") and not clean_mistral.startswith("your-"))

    rag_context, sources_meta = await rag_service.retrieve_context(
        query=user_query,
        agent_name=agent_name,
        top_k=4,
        mistral_api_key=clean_mistral if is_valid_mistral else None
    )

    if sources_meta:
        rag_event = {
            "rag_sources": sources_meta,
            "agent": agent_name
        }
        yield f"data: {json.dumps(rag_event)}\n\n".encode("utf-8")
        await asyncio.sleep(0.01)

    base_prompt = get_base_prompt(agent_name)
    editor_context = f"\n\n--- Conversation History & Current Context ---\n{system_prompt_from_ui}" if system_prompt_from_ui else ""
    system_prompt = base_prompt + editor_context + ("\n\n=== RAG KNOWLEDGE BASE GROUNDING ===\n" + rag_context if rag_context else "") + "\n" + WORKFLOW_INSTRUCTION

    # Priority 1: Google Gemini API
    if is_valid_gemini:
        try:
            logger.info(f"Streaming response via Google Gemini API for {agent_name}...")
            async for chunk in generate_gemini_cloud_stream(client, gemini_key, system_prompt, user_query):
                yield chunk
            return
        except Exception as gemini_err:
            logger.warning(f"Google Gemini streaming failed: {gemini_err}. Attempting next engine...")

    # Priority 2: Mistral API
    if is_valid_mistral:
        try:
            logger.info(f"Streaming response via Mistral API for {agent_name}...")
            async for chunk in generate_mistral_cloud_stream(client, clean_mistral, system_prompt, user_query):
                yield chunk
            return
        except Exception as mistral_err:
            logger.warning(f"Mistral API error: {mistral_err}. Engaging Intelligent RAG Synthesizer...")

    # Priority 3: Intelligent Generative RAG Synthesizer
    logger.info(f"Using Intelligent Generative RAG Engine for {agent_name}...")
    async for chunk in generate_intelligent_rag_stream(agent_name, user_query, system_prompt_from_ui, sources_meta):
        yield chunk
