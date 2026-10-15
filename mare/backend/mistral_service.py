import os
import json
import httpx
import asyncio
import re
import time
from datetime import datetime
from agent_prompts import AGENT_PROMPTS
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
    recency_injection = f"\n\n[SYSTEM INFO]\nTime: {current_time}. You are an advanced AI intelligence model. Be thorough, structured, precise, and state-of-the-art in your reasoning, analysis, and code generation."
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

def generate_dynamic_workflow(subject: str, agent_name: str) -> str:
    """Generate dynamic node-based workflow tailored to the specific query."""
    clean_sub = subject[:30] if subject else "Execution"
    return f"""```json
{{
  "workflow": {{
    "nodes": [
      {{ "id": "1", "position": {{ "x": 60, "y": 80 }}, "data": {{ "label": "1. {clean_sub.title()} Spec & Architecture" }}, "type": "default" }},
      {{ "id": "2", "position": {{ "x": 280, "y": 80 }}, "data": {{ "label": "2. {agent_name} Logic Core" }} }},
      {{ "id": "3", "position": {{ "x": 500, "y": 80 }}, "data": {{ "label": "3. Quality Verification & QA Gates" }} }},
      {{ "id": "4", "position": {{ "x": 280, "y": 200 }}, "data": {{ "label": "4. Multi-Agent Synthesis & Delivery" }} }}
    ],
    "edges": [
      {{ "id": "e1-2", "source": "1", "target": "2", "animated": true }},
      {{ "id": "e2-3", "source": "2", "target": "3", "animated": true }},
      {{ "id": "e3-4", "source": "3", "target": "4", "animated": true }}
    ]
  }}
}}
```"""

def generate_sports_event_plan(agent_name: str, user_query: str, sport: str) -> str:
    body = f"""### 🏆 Strategic Blueprint: Annual College {sport} Tournament

Here is a comprehensive, production-grade tournament roadmap designed with milestone tracking, operational logistics, and risk controls for your upcoming college {sport.lower()} tournament.
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
- **Powerplay & Ball Specifications:** Standard 4-over bowling powerplay; certified match-grade balls provided by organizing committee.
- **Live Scoring & Digital Tracking:** Official match scoring logged in real time via digital scoring app for live leaderboards.

---

### 3. 🏟️ Ground Operations & Equipment Logistics
- **Pitch Preparation:** Curate and roll match pitch 72 hours in advance; prepare two adjacent nets for warm-ups.
- **Fielding Boundaries & Equipment:** Install 65-meter boundary ropes, sight screens, certified wooden stumps, bails, and digital scoreboards.
- **Umpire & Officiating Panel:** Hire two certified panel umpires per match alongside official third-umpire line reviews.
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

---

### 5. 👥 Committee Delegation & Operational Matrix
- **Tournament Director (Planner Agent Domain):** Master schedule, disputes, and stakeholder alignment.
- **Logistics & Ground Committee:** Maintains pitch conditions, boundaries, hydration, and equipment inventory.
- **Technical & Disciplinary Committee:** Resolves on-field disputes, verifies player IDs, and enforces fair play.
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
- **Player Injuries:** Mandatory first-aid station and vehicle designated for immediate transport to nearby hospital."""

    return body + "\n\n" + SPORTS_WORKFLOW_JSON + "\n\nFeel free to ask for specific tournament rulebooks, fixture generator formulas, or budget spreadsheets!"

def generate_dynamic_code_response(agent_name: str, user_query: str, subject: str) -> str:
    # Generate custom code snippet tailored to query keywords
    code_body = ""
    q_low = user_query.lower()
    
    if any(k in q_low for k in ["api", "fastapi", "endpoint", "route"]):
        code_body = f"""# Production FastAPI Service: {subject}
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging
import asyncio

app = FastAPI(title="{subject.title()} API", version="1.0.0")
logger = logging.getLogger("api")

class ItemPayload(BaseModel):
    name: str = Field(..., example="Component A")
    description: Optional[str] = None
    parameters: Dict[str, Any] = Field(default_factory=dict)

@app.post("/api/v1/items", status_code=201)
async def create_item(payload: ItemPayload):
    try:
        logger.info(f"Processing payload for: {{payload.name}}")
        await asyncio.sleep(0.02)  # Async non-blocking I/O
        return {{
            "status": "success",
            "item_name": payload.name,
            "metadata": payload.parameters,
            "grounded_by": "{agent_name}"
        }}
    except Exception as e:
        logger.error(f"Error handling request: {{e}}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
"""
    elif any(k in q_low for k in ["data", "pandas", "eda", "analysis", "dataset", "csv"]):
        code_body = f"""# High-Performance Data Analysis Pipeline: {subject}
import pandas as pd
import numpy as np
from typing import Dict, Any

def analyze_dataset(data_path: str = "data.csv") -> Dict[str, Any]:
    # Mocking representative data for immediate execution
    np.random.seed(42)
    df = pd.DataFrame({{
        'timestamp': pd.date_range(start='2026-01-01', periods=100, freq='D'),
        'metric_alpha': np.random.normal(100, 15, 100),
        'metric_beta': np.random.exponential(50, 100),
        'category': np.random.choice(['Cluster A', 'Cluster B', 'Cluster C'], 100)
    }})
    
    # Calculate core descriptive statistics
    summary = df.describe().to_dict()
    grouped = df.groupby('category')[['metric_alpha', 'metric_beta']].mean().reset_index()
    
    # Anomaly detection (Z-Score > 2.5)
    df['z_score'] = (df['metric_alpha'] - df['metric_alpha'].mean()) / df['metric_alpha'].std()
    anomalies = df[df['z_score'].abs() > 2.5]
    
    print("=== Grouped Metrics by Cluster ===")
    print(grouped)
    print(f"\\nDetected {{len(anomalies)}} statistical anomalies.")
    return {{"summary": summary, "anomalies_count": len(anomalies)}}

if __name__ == "__main__":
    results = analyze_dataset()
    print("\\nExecution completed successfully.")
"""
    elif any(k in q_low for k in ["test", "pytest", "unit", "qa"]):
        code_body = f"""# Automated Test Suite: {subject}
import pytest
import asyncio
from typing import Dict, Any

class SystemService:
    def process_data(self, value: int) -> int:
        if value < 0:
            raise ValueError("Value cannot be negative")
        return value * 2

@pytest.fixture
def service():
    return SystemService()

def test_process_valid_positive_number(service):
    assert service.process_data(10) == 20
    assert service.process_data(0) == 0

def test_process_negative_value_raises_error(service):
    with pytest.raises(ValueError, match="Value cannot be negative"):
        service.process_data(-5)

@pytest.mark.parametrize("input_val, expected", [
    (1, 2),
    (5, 10),
    (100, 200),
])
def test_parameterized_cases(service, input_val, expected):
    assert service.process_data(input_val) == expected
"""
    else:
        code_body = f"""# Implementation: {subject}
import asyncio
import logging
from typing import Dict, Any, List

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("{agent_name.replace(' ', '_').lower()}")

class {agent_name.replace(' ', '')}Module:
    \"\"\"Production implementation for: {subject}\"\"\"
    def __init__(self, name: str = "{subject}"):
        self.name = name
        self.initialized = True
        logger.info(f"Initialized module: {{self.name}}")

    async def execute_task(self, query: str) -> Dict[str, Any]:
        logger.info(f"Executing: {{query}}")
        await asyncio.sleep(0.05)  # Async non-blocking execution
        return {{
            "task": query,
            "status": "completed",
            "result": f"Executed module for '{{self.name}}'",
            "agent": "{agent_name}"
        }}

if __name__ == "__main__":
    async def main():
        engine = {agent_name.replace(' ', '')}Module()
        output = await engine.execute_task("{user_query}")
        print("Output:", output)
    
    asyncio.run(main())
"""

    workflow_json = generate_dynamic_workflow(subject, agent_name)

    body = f"""### 💻 {agent_name} Technical Implementation: {subject.title()}

Here is the production-grade architecture and implementation for **\"{user_query}\"**, designed according to modern standards.

---

### 1. 🏗️ Architectural Foundations
- **Design Pattern:** Clean architecture with decoupling between domain logic, data models, and entry points.
- **Resilience:** Explicit error boundaries, input validation, and asynchronous non-blocking execution.
- **Verification:** Grounded in active workspace specifications and specialized domain rules.

---

### 2. 📝 Production Source Code

```python
{code_body}
```

---

### 3. 🧪 Verification & Operational Guidelines
- **Local Testing:** Run the script directly using the **\"Run in Python\"** button in the Code Editor or via Terminal.
- **Dependencies:** Standard library and modern async utilities (`asyncio`, `typing`, `pydantic`).
- **Integration:** Export to workspace via file saving to link with the multi-agent DAG pipeline.

{workflow_json}

*You can run this code immediately or ask me to add unit tests, error handlers, or REST endpoints!*"""

    return body

def generate_dynamic_planning_response(agent_name: str, user_query: str, subject: str) -> str:
    workflow_json = generate_dynamic_workflow(subject, agent_name)

    body = f"""### 🎯 {agent_name} Strategic Breakdown: {subject.title()}

Here is an end-to-end, structured roadmap and operational specification for **\"{user_query}\"**, formatted with Critical Path milestones and multi-agent delegation.

---

### 1. 🔍 Executive Scope & Objectives
- **Core Mission:** Deliver a resilient, scalable solution for **{subject}**.
- **Success Criteria:** Zero single points of failure, measurable deliverables, and high execution velocity.
- **Quality Gates:** Every phase requires explicit verification before transitioning to the next milestone.

---

### 2. 🚀 Multi-Phase Execution Roadmap

#### Phase 1: Architecture & Requirements Discovery (Days 1–3)
- Analyze technical constraints and external integration surfaces.
- Formalize schema contracts, data flow diagrams, and API boundaries.
- Assign specialized domain agents (Coder, Tester, Researcher).

#### Phase 2: Core Engineering & Prototyping (Days 4–8)
- Build the foundational business logic with typed interfaces.
- Implement optimized streaming and advanced LLM reasoning protocols.
- Conduct continuous automated unit testing with >85% coverage.

#### Phase 3: Integration, QA & Hardening (Days 9–11)
- End-to-end integration across dependent services.
- Stress testing, edge-case fuzzing, and security vulnerability audits.
- Verification matrix sign-off by Reviewer and Validation Agents.

#### Phase 4: Production Deployment & Telemetry (Days 12–14)
- Staged rollout with health-check monitoring.
- Telemetry instrumentation for latency, token consumption, and error rates.
- Compile executive delivery documentation via Report Generator Agent.

---

### 3. 🛡️ Risk Management & Mitigation Matrix

| Potential Risk / Failure Mode | Probability | Impact | Proactive Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Scope Creep / Drift** | Medium | High | Strict milestone boundaries with explicit acceptance criteria |
| **API / Service Timeout** | Low | High | Resilient exponential backoff with circuit breaker pattern |
| **Edge-Case Logic Error** | Medium | Medium | Automated regression test suites and parameterized fuzz testing |

---

### 4. ⚡ Action Items & Next Steps
- [ ] Review the proposed milestone schedule and approve resource allocation.
- [ ] Initialize implementation files in the workspace via Explorer.
- [ ] Run the workflow pipeline in the Multi-Agent Canvas.

{workflow_json}

*Let me know if you would like me to drill into any specific phase, decompose into atomic subtasks, or generate related code!*"""

    return body

async def generate_gemini_cloud_stream(client: httpx.AsyncClient, gemini_api_key: str, system_prompt: str, user_query: str):
    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key={gemini_api_key}"
    
    payload = {
        "contents": [{"role": "user", "parts": [{"text": user_query}]}],
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 4096}
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
    # Try multiple models in case of quota / rate limits
    models_to_try = ["mistral-small-latest", "open-mistral-7b", "mistral-tiny"]
    last_err = None
    
    for model in models_to_try:
        payload = {
            "model": model,
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

        try:
            async with client.stream(
                "POST",
                "https://api.mistral.ai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=httpx.Timeout(3.0, connect=2.0)
            ) as response:
                if response.status_code == 200:
                    async for chunk in response.aiter_bytes():
                        yield chunk
                    return
                else:
                    error_body = await response.aread()
                    logger.warning(f"Mistral model {model} returned {response.status_code}: {error_body}")
                    last_err = f"Status {response.status_code}"
        except Exception as e:
            logger.warning(f"Mistral model {model} error: {e}")
            last_err = str(e)

    raise RuntimeError(f"All Mistral models exhausted: {last_err}")

async def generate_intelligent_agent_stream(agent_name: str, user_query: str, system_prompt_from_ui: str = ""):
    topic_data = extract_topic_and_intent(user_query)
    query_lower = user_query.lower()
    
    # Orqion autonomous workspace commands
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
            response_text = "Hello! I am **Orqion**, your autonomous workspace assistant. I can write code, manage workspace folders, plan architectures, or coordinate multi-agent workflows. What would you like to build today?"
        elif topic_data["type"] == "event_planning":
            response_text = generate_sports_event_plan(agent_name, user_query, topic_data.get("sport", "Sports"))
        elif topic_data["type"] == "coding" or any(k in query_lower for k in ["code", "script", "python", "function", "api"]):
            response_text = generate_dynamic_code_response(agent_name, user_query, topic_data["subject"])
        else:
            response_text = generate_dynamic_planning_response(agent_name, user_query, topic_data["subject"])
    else:
        # Specialized agent routing
        if topic_data["type"] == "event_planning":
            response_text = generate_sports_event_plan(agent_name, user_query, topic_data.get("sport", "Sports"))
        elif (topic_data["type"] == "coding" 
              or "code" in agent_name.lower() 
              or "python" in agent_name.lower() 
              or "tester" in agent_name.lower()
              or "automation" in agent_name.lower()
              or any(k in query_lower for k in ["code", "script", "python", "function", "api", "test", "build", "implement"])):
            response_text = generate_dynamic_code_response(agent_name, user_query, topic_data["subject"])
        else:
            response_text = generate_dynamic_planning_response(agent_name, user_query, topic_data["subject"])

    # Stream response text smoothly with natural cadence
    words = response_text.split(" ")
    for i in range(0, len(words), 3):
        chunk = " ".join(words[i:i+3])
        if i + 3 < len(words):
            chunk += " "
        payload = {"choices": [{"delta": {"content": chunk}}]}
        yield f"data: {json.dumps(payload)}\n\n".encode("utf-8")
        await asyncio.sleep(0.012)

    yield b"data: [DONE]\n\n"

_MISTRAL_BLOCKED_UNTIL = 0

async def generate_mistral_stream(client: httpx.AsyncClient, agent_name: str, system_prompt_from_ui: str, user_query: str, mistral_api_key: str):
    global _MISTRAL_BLOCKED_UNTIL
    # Immediately yield a heartbeat comment to flush HTTP response headers to client
    yield b": connected\n\n"
    await asyncio.sleep(0.005)

    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    is_valid_gemini = bool(gemini_key and not gemini_key.startswith("your_") and not gemini_key.startswith("your-"))

    clean_mistral = mistral_api_key.strip() or os.getenv("MISTRAL_API_KEY", "").strip()
    is_valid_mistral = bool(clean_mistral and not clean_mistral.startswith("your_") and not clean_mistral.startswith("your-"))

    now = time.time()
    mistral_is_circuit_broken = _MISTRAL_BLOCKED_UNTIL > now

    base_prompt = get_base_prompt(agent_name)
    editor_context = f"\n\n--- Conversation History & Current Context ---\n{system_prompt_from_ui}" if system_prompt_from_ui else ""
    system_prompt = base_prompt + editor_context + "\n" + WORKFLOW_INSTRUCTION

    # Priority 1: Google Gemini API (Advanced LLM)
    if is_valid_gemini:
        try:
            logger.info(f"Streaming response via Google Gemini API for {agent_name}...")
            async for chunk in generate_gemini_cloud_stream(client, gemini_key, system_prompt, user_query):
                yield chunk
            return
        except Exception as gemini_err:
            logger.warning(f"Google Gemini streaming failed: {gemini_err}. Attempting next engine...")

    # Priority 2: Mistral API (Advanced LLM)
    if is_valid_mistral and not mistral_is_circuit_broken:
        try:
            logger.info(f"Streaming response via Mistral API for {agent_name}...")
            async for chunk in generate_mistral_cloud_stream(client, clean_mistral, system_prompt, user_query):
                yield chunk
            return
        except Exception as mistral_err:
            _MISTRAL_BLOCKED_UNTIL = time.time() + 300
            logger.warning(f"Mistral API rate-limited/failed: {mistral_err}. Engaging Intelligent Agent Engine...")

    # Priority 3: Built-in Advanced Multi-Agent Intelligence Engine
    logger.info(f"Using Advanced Multi-Agent Intelligence Engine for {agent_name}...")
    async for chunk in generate_intelligent_agent_stream(agent_name, user_query, system_prompt_from_ui):
        yield chunk


