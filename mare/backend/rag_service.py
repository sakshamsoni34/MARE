import os
import re
import json
import math
import uuid
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
import httpx
import aiosqlite

logger = logging.getLogger(__name__)

# Pre-packaged rich domain knowledge bases tailored for all specialized agents in MARE
DEFAULT_DOMAIN_KNOWLEDGE: List[Dict[str, Any]] = [
    {
        "title": "MARE Multi-Agent System Architecture & Orchestration",
        "category": "system",
        "agent_target": "all",
        "content": """MARE (Multi-Agent Research & Execution) is an advanced autonomous collaborative workspace.
Core Architecture & Agents:
- Planner Agent: High-level strategic roadmap decomposition, critical path analysis, risk management.
- Task Decomposer Agent: Atomic sub-task extraction, dependency DAGs, parallel work scheduling.
- Goal Manager Agent: OKR tracking, progress monitoring, drift detection, blocker mitigation.
- Web Search & Academic Research Agents: Real-time information discovery, scholarly paper analysis, APA/IEEE citations.
- Browser & News Agents: Dynamic DOM extraction, structured web scraping, real-time news synthesis and timeline verification.
- Code & Python Agents: Production-grade software architecture, PEP 8 compliance, typed async concurrency, API development.
- Executor & Automation Agents: Real-time script execution, API orchestration, CI/CD pipelines, webhook handlers.
- Data Analysis & Visualization Agents: EDA pipelines, statistical hypothesis testing, interactive charts, and dashboard layouts.
- Validation, Reviewer & Tester Agents: Quality assurance, unit testing, schema compliance, regression matrices, logic verification.
- Report Generator, Presentation & Export Agents: Executive summaries (Minto Pyramid), slide deck outlines, multi-format exports (PDF, Markdown, JSON, CSV).
- Live Workflow, Agent Communication, Logs & Events Agents: Dynamic workflow execution, shared blackboard state, telemetry auditing, and event bus pub/sub.
- Multi-Agent Hub: Cross-agent pipeline coordination and context chaining.
- Orqion: General-purpose orchestrator capable of executing workspace actions and direct user queries.
Every agent is integrated with this RAG (Retrieval-Augmented Generation) engine to ground all reasoning in project files, documentation, and domain knowledge."""
    },
    {
        "title": "Strategic Planning & Milestone Methodologies",
        "category": "planning",
        "agent_target": "Planner Agent",
        "content": """Strategic Planning Best Practices:
1. Work Breakdown Structure (WBS): Divide complex deliverables into hierarchical, self-contained components with clear scope boundaries.
2. Critical Path Method (CPM): Identify the sequence of dependent tasks that determine minimum project duration.
3. Risk Mitigation Matrix: Classify risks by Probability (1-5) and Impact (1-5); prepare proactive mitigation and contingency paths.
4. Dependency Mapping: Differentiate between Hard Dependencies (technical prerequisites) and Soft Dependencies (logical preferences).
5. Resource & Agent Delegation: Assign tasks according to agent specializations (Code for implementation, Validation for QA, Analysis for data).
6. Adaptive Replanning: Continuously reassess assumptions and re-adjust milestones as deliverables evolve."""
    },
    {
        "title": "Granular Task Decomposition & Dependency DAGs",
        "category": "planning",
        "agent_target": "Task Decomposer Agent",
        "content": """Task Decomposition Principles:
1. MECE Principle (Mutually Exclusive, Collectively Exhaustive): Ensure broken down tasks do not overlap and leave zero functional gaps.
2. Atomic Unit Sizing: Each task should represent a single verifiable outcome with unambiguous acceptance criteria.
3. Parallelization Discovery: Identify tasks that have zero shared state or prerequisites to execute simultaneously across multiple agents.
4. Dependency DAG: Order tasks by topological sort to eliminate cyclic deadlocks and race conditions.
5. Task Metadata: Every task should define Task ID, Description, Dependencies, Complexity (Low/Medium/High), Parallelizable (Yes/No), and Suggested Agent."""
    },
    {
        "title": "Goal Tracking, OKRs & Milestone Verification",
        "category": "management",
        "agent_target": "Goal Manager Agent",
        "content": """Goal Management & Progress Tracking:
1. OKR Framework: Objectives (Qualitative direction) aligned with Key Results (Quantifiable metrics and percentage completion).
2. Scope Drift Detection: Compare current execution status against the original baseline; flag scope creep early.
3. Quality Gates: Enforce verification checks before marking any milestone as complete.
4. Blocker Resolution: Provide immediate actionable recovery steps when an agent encounters execution errors or stalled dependencies.
5. Executive Status Reports: Summarize total progress, completed goals, pending tasks, active blockers, and strategic recommendations."""
    },
    {
        "title": "Web & News Information Retrieval Protocols",
        "category": "research",
        "agent_target": "Web Search Agent",
        "content": """Information Retrieval Protocols:
1. Source Credibility: Prioritize authoritative primary sources (official docs, verified news outlets, peer-reviewed journals).
2. Fact Verification: Corroborate critical claims across at least two independent sources.
3. Recency Filtering: Filter out outdated tutorials or deprecated APIs; prioritize current versions.
4. Output Synthesis: Provide search queries used, key extracted facts, direct links, and confidence scores (1-10)."""
    },
    {
        "title": "Academic Research & Empirical Methodology",
        "category": "research",
        "agent_target": "Academic Research Agent",
        "content": """Academic Research Guidelines:
1. Literature Review: Survey peer-reviewed papers (arXiv, IEEE, ACM, Nature, Science, PubMed).
2. Methodology Evaluation: Critically assess experimental design, sample size, control groups, and statistical significance (p-values, confidence intervals, effect sizes).
3. Citation Standards: Format references cleanly in APA or IEEE style with authors, publication year, title, journal/conference, and DOI/URL.
4. Synthesis: Compare contrasting study conclusions, analyze empirical limitations, and extract theoretical foundations."""
    },
    {
        "title": "Web Scraping, DOM Parsing & Extraction Protocols",
        "category": "research",
        "agent_target": "Browser Agent",
        "content": """Browser & Web Extraction Guidelines:
1. Semantic DOM Traversal: Focus on semantic HTML elements (article, section, main, table, pre, code) and ignore advertising noise and boilerplate.
2. Structured Data Extraction: Transform unstructured web tables, lists, and articles into clean JSON or Markdown.
3. Error Handling & Rate Limiting: Respect robots.txt conventions, handle HTTP 429/503 gracefully, and sanitize scraped content.
4. Metadata Capture: Preserve title, publication date, author, and source URL for full auditability."""
    },
    {
        "title": "Real-Time News Aggregation & Chronological Synthesis",
        "category": "research",
        "agent_target": "News Agent",
        "content": """News Monitoring & Synthesis Protocols:
1. Multi-Source Corroboration: Cross-check breaking news across diverse reputable publishers.
2. Chronological Timelines: Organize events in clear chronological sequence with accurate timestamps.
3. Bias & Hype Elimination: Present facts neutrally, distinguishing between confirmed reports, corporate statements, and speculation.
4. Impact Assessment: Highlight why the news matters, market impact, and key takeaways."""
    },
    {
        "title": "Clean Software Architecture & Code Standards",
        "category": "engineering",
        "agent_target": "Code Agent",
        "content": """Software Engineering Principles:
1. SOLID Principles: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.
2. Clean Architecture: Separation of concerns across Domain, Application, and Infrastructure layers.
3. Secure Coding: Validate inputs, prevent injection attacks, use parameterized queries, sanitize user data, and store secrets in environment variables.
4. Error Handling: Use explicit typed exceptions, structured logging, and graceful fallbacks.
5. Modular Design: Reusable components, loose coupling, and thorough documentation."""
    },
    {
        "title": "Python Async Concurrency & Modern Type System",
        "category": "engineering",
        "agent_target": "Python Agent",
        "content": """Modern Python Best Practices (Python 3.10+):
1. Type Hinting (PEP 484/585): Use typing annotations (Optional, Union, Dict, List, Annotated) and Pydantic models for validation.
2. Asynchronous Programming: Use asyncio, async/await, async context managers, and non-blocking I/O (httpx, aiosqlite, fastapi).
3. PEP 8 Compliance: 4-space indentation, snake_case functions/variables, PascalCase classes, UPPER_CASE constants.
4. Robust Testing: Write pytest unit and integration test fixtures with high coverage.
5. Resource Management: Always use async context managers (`async with`) for database connections and HTTP clients."""
    },
    {
        "title": "API Orchestration, REST/GraphQL Clients & Execution Protocols",
        "category": "engineering",
        "agent_target": "Executor Agent",
        "content": """Execution & API Orchestration Standards:
1. Request Lifecycle: Validate payload schemas before dispatching; set appropriate timeouts and retry exponential backoffs.
2. Idempotency: Use idempotency keys for mutative HTTP requests (POST, PUT, DELETE) to prevent duplicate operations.
3. Response Parsing: Handle JSON, multipart streams, and binary buffers cleanly with comprehensive status code error handling.
4. Audit Trail: Emit execution events and structured logs with request IDs and duration metrics."""
    },
    {
        "title": "CI/CD Automation, DevOps Pipelines & Task Automation",
        "category": "engineering",
        "agent_target": "Automation Agent",
        "content": """Workflow & Task Automation Guidelines:
1. Declarative Pipelines: Structure CI/CD workflows (GitHub Actions, GitLab CI, Docker) with explicit triggers, environment variables, and caching.
2. Idempotent Scripts: Ensure automation scripts can run repeatedly without unintended side effects or corruption.
3. Webhook Integration: Implement HMAC signature verification and payload validation for external webhook events.
4. Error Recovery: Configure automated alerting, fallback handlers, and graceful failure notifications."""
    },
    {
        "title": "Data Science & Statistical Analysis Frameworks",
        "category": "data",
        "agent_target": "Data Analysis Agent",
        "content": """Data Analysis & Statistics:
1. Exploratory Data Analysis (EDA): Summary statistics (mean, median, IQR, std dev, skewness), distribution checks, missing value imputation.
2. Hypothesis Testing: T-tests, Chi-square, ANOVA, Mann-Whitney U tests with effect sizes and p-value validation.
3. Feature Engineering: Normalization, one-hot encoding, correlation matrices, outlier detection (Z-score, Tukey IQR).
4. Business Insights: Translate numerical correlations into actionable strategic recommendations with quantified ROI."""
    },
    {
        "title": "Data Visualization, UI/UX Aesthetics & Chart Selection",
        "category": "visualization",
        "agent_target": "Visualization Agent",
        "content": """Data Visualization Principles:
1. Chart Selection Matrix:
   - Trends over time: Line chart / Area chart.
   - Categorical comparisons: Bar chart / Column chart.
   - Distributions: Histogram / Box plot / Violin plot.
   - Relationships & Correlations: Scatter plot / Bubble chart.
   - Proportions: Donut chart (max 5 slices) or stacked bar.
2. Visual Hierarchy: High contrast, accessible color palettes (WCAG AA compliance), clean grid lines, and legible typography.
3. Interactive Design: Tooltips, zoom/pan controls, drill-down capabilities, and responsive containers."""
    },
    {
        "title": "Quality Assurance, Boundary Testing & Schema Validation",
        "category": "validation",
        "agent_target": "Validation Agent",
        "content": """Validation & QA Protocols:
1. Verification Scope: Test outputs for logical consistency, mathematical correctness, fact accuracy, and schema compliance.
2. Boundary Value Analysis: Test min, max, null, undefined, empty string, and extreme out-of-bounds inputs.
3. Validation Statuses: Output PASS, FAIL, or NEEDS REVISION with specific line-by-line flaw citations and recommended fixes.
4. Confidence Scoring: Assign a confidence score from 1-10 with detailed rationale."""
    },
    {
        "title": "Code Review Best Practices, Static Analysis & Refactoring",
        "category": "engineering",
        "agent_target": "Reviewer Agent",
        "content": """Code & Document Review Standards:
1. Code Quality Metrics: Readability, modularity, DRY (Don't Repeat Yourself), cyclomatic complexity, and testability.
2. Security Auditing: Check for SQL injection, XSS, unvalidated inputs, hardcoded secrets, and unsafe deserialization.
3. Constructive Feedback: Provide clear, polite explanations and provide ready-to-use code refactor snippets.
4. Compliance: Verify adherence to framework conventions (Next.js, FastAPI, TypeScript, PEP 8)."""
    },
    {
        "title": "UI/UX Design Systems, Glassmorphism & Modern Aesthetics",
        "category": "design",
        "agent_target": "Designer Agent",
        "content": """Modern UI/UX Design System Guidelines:
1. Color Palettes: Tailored HSL color scales, dark modes with rich subtle contrasts, neon accent glows (violet, emerald, amber, cyan).
2. Glassmorphism: Frosted backdrops (`backdrop-blur-md`), translucent fills (`bg-white/5` or `bg-black/40`), subtle glowing borders.
3. Typography: Clean sans-serif hierarchy (Inter, Outfit), distinct font weights, proper line heights (`1.5` - `1.7`), and letter spacing.
4. Micro-interactions: Smooth hover transitions, scale effects, active pill indicators, and Framer Motion animations."""
    },
    {
        "title": "Comprehensive Software Testing & Test Matrices",
        "category": "testing",
        "agent_target": "Tester Agent",
        "content": """Software Testing Best Practices:
1. Test Pyramid: Unit tests (fast, isolated), Integration tests (API & DB contracts), and End-to-End tests (user flows).
2. Test Case Structure: Given-When-Then (Arrange-Act-Assert) pattern with descriptive test names.
3. Edge Case Coverage: Network timeouts, concurrent race conditions, invalid JSON schemas, and empty datasets.
4. Mocking & Fixtures: Isolate external dependencies using mocks, stubs, and deterministic test fixtures."""
    },
    {
        "title": "Executive Reporting & Minto Pyramid Synthesis",
        "category": "reporting",
        "agent_target": "Report Generator Agent",
        "content": """Executive Report Structuring:
1. Minto Pyramid Principle: Lead with the primary conclusion/executive summary, followed by supporting arguments and granular data.
2. Standard Structure:
   - Executive Summary (Key findings & decisions required)
   - Background & Objectives
   - Core Analysis & Detailed Findings
   - Strategic Recommendations & Action Plan
   - Appendices, Methodology & References
3. Tone: Crisp, objective, authoritative, and jargon-free."""
    },
    {
        "title": "Slide Deck Design, Pitch Frameworks & Presentation Outlines",
        "category": "presentation",
        "agent_target": "Presentation Agent",
        "content": """Slide Deck & Pitch Structuring:
1. Visual Economy: One core idea per slide; maximum 3-5 concise bullet points.
2. Pitch Deck Narrative: Problem -> Solution -> Market Opportunity -> Product/Demo -> Business Model -> Roadmap -> Team/Call to Action.
3. Slide Component Specifications: Slide Title, Subtitle, Key Message, Visual/Chart Suggestion, and Comprehensive Speaker Notes."""
    },
    {
        "title": "Data Serialization, Schema Export & Multi-Format Standardization",
        "category": "export",
        "agent_target": "Export Agent",
        "content": """Data Export & Serialization Standards:
1. Target Formats: PDF, DOCX, Markdown, HTML, JSON, CSV, PPTX, LaTeX.
2. Schema Integrity: Validate JSON schemas, format CSV headers with escaped delimiters, generate clean semantic Markdown.
3. Metadata Headers: Embed author, generation timestamp, version, and licensing metadata."""
    },
    {
        "title": "Live Workflow Execution, State Machines & Dynamic Graph Concurrency",
        "category": "workflow",
        "agent_target": "Live Workflow Agent",
        "content": """Workflow Orchestration Principles:
1. Graph Execution: Execute directed acyclic graphs (DAGs) with parallel node dispatching and topological dependency resolution.
2. State Management: Track node states (Idle, Running, Succeeded, Failed, Skipped) and emit real-time status updates.
3. Resilient Retries: Implement automated exponential backoff retries with circuit breakers on repeated node failures.
4. Dynamic Flow Adjustment: Branch or pause workflows based on evaluation gates or intermediate agent outputs."""
    },
    {
        "title": "Inter-Agent Communication & Shared Context Blackboard",
        "category": "communication",
        "agent_target": "Agent Communication Agent",
        "content": """Multi-Agent IPC & Context Coordination:
1. Shared Blackboard Pattern: Maintain a global state ledger of verified facts, agent outputs, and intermediate decisions.
2. Message Routing: Route messages with explicit Sender, Recipient, Message Type, and Correlation ID.
3. Conflict Resolution: When two agents reach diverging conclusions, trigger a consensus arbitration or validation review.
4. Duplicate Suppression: Check blackboard for existing results before dispatching duplicate research or analysis tasks."""
    },
    {
        "title": "System Auditing, Structured Telemetry & Log Analysis",
        "category": "monitoring",
        "agent_target": "Logs Agent",
        "content": """System Auditing & Telemetry Best Practices:
1. Structured Logging: Use JSON-formatted logs containing timestamp, log level, agent name, action, trace ID, and duration.
2. Stack Trace Analysis: Parse Python, Node.js, and browser stack traces to pinpoint root cause files, functions, and line numbers.
3. Performance Monitoring: Track token consumption, latency percentiles (p50, p95, p99), and memory footprint.
4. Audit Trail: Keep immutable records of all file modifications and workflow state transitions."""
    },
    {
        "title": "Event-Driven Systems, Pub/Sub Bus & Real-time Reactive Triggers",
        "category": "monitoring",
        "agent_target": "Events Agent",
        "content": """Event Bus Architecture:
1. Event Structure: Event ID, Timestamp, Event Type (e.g., FILE_SAVED, AGENT_STARTED, WORKFLOW_COMPLETED), Severity (INFO, WARN, ERROR), Source, and Payload.
2. Pub/Sub Subscriptions: Allow decoupled agents and UI components to subscribe to specific event topics.
3. Scheduled Triggers: Manage cron schedules, periodic sync intervals, and heartbeat health checks."""
    },
    {
        "title": "Multi-Agent Pipeline Orchestration & Cross-Agent Chaining",
        "category": "orchestration",
        "agent_target": "Multi-Agent Hub",
        "content": """Multi-Agent Collaborative Pipeline:
1. Agent Chaining: Chain specialized agents in sequence or parallel (e.g. Planner -> Web Search -> Code -> Validation -> Report Generator).
2. Context Synthesis: Aggregate and summarize previous agent outputs to pass clean, contextualized memory to downstream agents.
3. Consensus Building: Combine multiple agent perspectives to form balanced, rigorous solutions."""
    },
    {
        "title": "Orqion Autonomous Workspace Assistant & Action Engine",
        "category": "assistant",
        "agent_target": "Orqion",
        "content": """Orqion AI Workspace Engine:
1. General Capabilities: Code authoring, project structuring, file manipulation, workspace control, and multi-agent coordination.
2. UI Action Execution:
   - Create/delete workspace files and folders.
   - Open/close specialized agent panels and terminal views.
   - Generate and render interactive node-based workflows (`@xyflow/react`).
   - Archive and manage past conversations.
3. Grounding: Uses RAG knowledge base and workspace files to provide accurate, project-aware responses."""
    }
]

class LocalVectorizer:
    """Fast, lightweight hybrid vectorizer using subword n-grams and TF-IDF weighting for instant semantic fallback."""
    def __init__(self):
        self._stopwords = {
            'a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'is', 'are', 'was', 'were', 'be', 'been', 'this', 'that', 'these', 'those', 'it', 'its',
            'as', 'from', 'into', 'all', 'any', 'each', 'what', 'which', 'who', 'how', 'when', 'where'
        }

    def tokenize(self, text: str) -> List[str]:
        words = re.findall(r'[a-zA-Z0-9_\-\.]+', text.lower())
        return [w for w in words if w not in self._stopwords and len(w) > 1]

    def compute_dense_vector(self, text: str, dim: int = 128) -> List[float]:
        tokens = self.tokenize(text)
        if not tokens:
            return [0.0] * dim
        vec = [0.0] * dim
        for token in tokens:
            # Word hashing trick
            h = hash(token)
            idx = abs(h) % dim
            weight = 1.0 + math.log(1.0 + len(token))
            vec[idx] += weight
            # Subword n-grams for typo & morphology tolerance
            if len(token) >= 4:
                for i in range(len(token) - 2):
                    sub = token[i:i+3]
                    sub_idx = abs(hash(sub)) % dim
                    vec[sub_idx] += 0.35
        # L2 Normalize
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec

    def cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0
        dot = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        return dot / (norm_a * norm_b)

    def bm25_keyword_score(self, query_tokens: List[str], doc_tokens: List[str]) -> float:
        if not query_tokens or not doc_tokens:
            return 0.0
        doc_set = set(doc_tokens)
        matches = sum(1 for q in query_tokens if q in doc_set)
        return matches / max(1, len(query_tokens))


class RAGService:
    def __init__(self):
        self.vectorizer = LocalVectorizer()
        self.db_path = os.path.join(os.path.dirname(__file__), 'mare.db')
        self._embedding_cache: Dict[str, List[float]] = {}
        self._initialized = False

    async def initialize(self):
        """Ensure RAG tables exist and default domain knowledge is indexed."""
        if self._initialized:
            return
        
        async with aiosqlite.connect(self.db_path) as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS rag_documents (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    doc_id TEXT UNIQUE NOT NULL,
                    title TEXT NOT NULL,
                    source TEXT NOT NULL,
                    category TEXT,
                    agent_target TEXT DEFAULT 'all',
                    content TEXT NOT NULL,
                    metadata TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_rag_docs_doc_id ON rag_documents (doc_id)")
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_rag_docs_target ON rag_documents (agent_target)")

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS rag_chunks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chunk_id TEXT UNIQUE NOT NULL,
                    doc_id TEXT NOT NULL,
                    chunk_index INTEGER NOT NULL,
                    text TEXT NOT NULL,
                    embedding TEXT,
                    source TEXT,
                    title TEXT,
                    agent_target TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_rag_chunks_chunk_id ON rag_chunks (chunk_id)")
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_rag_chunks_doc_id ON rag_chunks (doc_id)")
            await conn.commit()

            # Seed default domain knowledge if table is empty or missing agents
            async with conn.execute("SELECT COUNT(*) FROM rag_documents WHERE source = 'domain_knowledge'") as cursor:
                row = await cursor.fetchone()
                count = row[0] if row else 0
                if count < len(DEFAULT_DOMAIN_KNOWLEDGE):
                    logger.info(f"Seeding/updating {len(DEFAULT_DOMAIN_KNOWLEDGE)} domain knowledge items into RAG store...")
                    for item in DEFAULT_DOMAIN_KNOWLEDGE:
                        doc_id = f"domain_{abs(hash(item['title'])) % 100000000:08x}"
                        await self._ingest_document_internal(
                            conn=conn,
                            doc_id=doc_id,
                            title=item["title"],
                            source="domain_knowledge",
                            category=item["category"],
                            agent_target=item["agent_target"],
                            content=item["content"],
                            metadata={"is_default": True}
                        )
                    await conn.commit()

        self._initialized = True
        logger.info("RAG Service initialized successfully with full agent domain knowledge.")

    def chunk_text(self, text: str, chunk_size: int = 600, overlap: int = 100) -> List[str]:
        """Splits text into contextually coherent chunks based on paragraphs and sentences."""
        clean_text = text.strip()
        if not clean_text:
            return []
        if len(clean_text) <= chunk_size:
            return [clean_text]

        paragraphs = clean_text.split('\n\n')
        chunks: List[str] = []
        current_chunk = ""

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            if len(current_chunk) + len(para) + 2 <= chunk_size:
                current_chunk = f"{current_chunk}\n\n{para}".strip()
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                if len(para) > chunk_size:
                    # Split huge paragraph by sentences
                    sentences = re.split(r'(?<=[.?!])\s+', para)
                    sub_chunk = ""
                    for sent in sentences:
                        if len(sub_chunk) + len(sent) + 1 <= chunk_size:
                            sub_chunk = f"{sub_chunk} {sent}".strip()
                        else:
                            if sub_chunk:
                                chunks.append(sub_chunk)
                            sub_chunk = sent
                    if sub_chunk:
                        current_chunk = sub_chunk
                else:
                    current_chunk = para

        if current_chunk:
            chunks.append(current_chunk)

        return chunks

    async def compute_embedding(self, text: str, mistral_api_key: Optional[str] = None) -> List[float]:
        """Computes embedding via Mistral API (mistral-embed) if key is provided, or uses fast local vectorizer."""
        clean_key = (mistral_api_key or os.getenv("MISTRAL_API_KEY", "")).strip()
        has_valid_key = clean_key and not clean_key.startswith("your_") and not clean_key.startswith("your-")

        cache_key = text[:200]
        if cache_key in self._embedding_cache:
            return self._embedding_cache[cache_key]

        if has_valid_key:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        "https://api.mistral.ai/v1/embeddings",
                        headers={
                            "Authorization": f"Bearer {clean_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": "mistral-embed",
                            "input": [text[:2000]]
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        embedding = data["data"][0]["embedding"]
                        self._embedding_cache[cache_key] = embedding
                        return embedding
            except Exception as e:
                logger.debug(f"Mistral embedding fallback triggered: {e}")

        # High-performance local dense vector
        dense_vec = self.vectorizer.compute_dense_vector(text, dim=128)
        self._embedding_cache[cache_key] = dense_vec
        return dense_vec

    async def _ingest_document_internal(
        self,
        conn: aiosqlite.Connection,
        doc_id: str,
        title: str,
        source: str,
        category: str,
        agent_target: str,
        content: str,
        metadata: Dict[str, Any],
        mistral_api_key: Optional[str] = None
    ):
        """Internal helper to insert a document and generate its chunks/embeddings."""
        meta_json = json.dumps(metadata)
        await conn.execute("""
            INSERT OR REPLACE INTO rag_documents (doc_id, title, source, category, agent_target, content, metadata, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (doc_id, title, source, category, agent_target, content, meta_json, datetime.now(timezone.utc).isoformat()))

        # Remove old chunks for this doc_id
        await conn.execute("DELETE FROM rag_chunks WHERE doc_id = ?", (doc_id,))

        # Chunk content
        chunks = self.chunk_text(content)
        for idx, chunk_text in enumerate(chunks):
            chunk_id = f"{doc_id}_c{idx}"
            embedding = await self.compute_embedding(f"{title}: {chunk_text}", mistral_api_key=mistral_api_key)
            embed_json = json.dumps(embedding)
            await conn.execute("""
                INSERT INTO rag_chunks (chunk_id, doc_id, chunk_index, text, embedding, source, title, agent_target)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (chunk_id, doc_id, idx, chunk_text, embed_json, source, title, agent_target))

    async def ingest_document(
        self,
        title: str,
        content: str,
        source: str = "knowledge_base",
        category: str = "documentation",
        agent_target: str = "all",
        metadata: Optional[Dict[str, Any]] = None,
        doc_id: Optional[str] = None,
        mistral_api_key: Optional[str] = None
    ) -> str:
        """Public method to ingest or update a document in the RAG knowledge store."""
        await self.initialize()
        actual_doc_id = doc_id or f"doc_{uuid.uuid4().hex[:10]}"
        meta = metadata or {}

        async with aiosqlite.connect(self.db_path) as conn:
            await self._ingest_document_internal(
                conn=conn,
                doc_id=actual_doc_id,
                title=title,
                source=source,
                category=category,
                agent_target=agent_target,
                content=content,
                metadata=meta,
                mistral_api_key=mistral_api_key
            )
            await conn.commit()

        logger.info(f"Ingested document into RAG: '{title}' ({actual_doc_id})")
        return actual_doc_id

    async def sync_workspace_files_to_rag(self, mistral_api_key: Optional[str] = None):
        """Indexes all text files from the workspace 'files' table into the RAG database."""
        await self.initialize()
        async with aiosqlite.connect(self.db_path) as conn:
            conn.row_factory = aiosqlite.Row
            async with conn.execute("SELECT node_id, name, content, agent_name FROM files WHERE type = 'file' AND content IS NOT NULL") as cursor:
                files = await cursor.fetchall()
                for file_row in files:
                    node_id = file_row["node_id"]
                    name = file_row["name"]
                    content = file_row["content"] or ""
                    agent_name = file_row["agent_name"] or "all"
                    if content.strip():
                        doc_id = f"file_{node_id}"
                        await self._ingest_document_internal(
                            conn=conn,
                            doc_id=doc_id,
                            title=f"Workspace File: {name}",
                            source="workspace_file",
                            category="code" if name.endswith(('.py', '.js', '.ts', '.tsx', '.json', '.sql', '.html', '.css')) else "document",
                            agent_target=agent_name if agent_name else "all",
                            content=content,
                            metadata={"file_name": name, "node_id": node_id},
                            mistral_api_key=mistral_api_key
                        )
            await conn.commit()
        logger.info("Synced workspace files into RAG.")

    async def retrieve_context(
        self,
        query: str,
        agent_name: str = "all",
        top_k: int = 4,
        category: Optional[str] = None,
        mistral_api_key: Optional[str] = None
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Retrieves the top-k most relevant knowledge chunks for a query and active agent.
        Returns:
            (formatted_prompt_block, list_of_source_metadata)
        """
        await self.initialize()
        if not query or not query.strip():
            return "", []

        query_embedding = await self.compute_embedding(query, mistral_api_key=mistral_api_key)
        query_tokens = self.vectorizer.tokenize(query)

        scored_chunks: List[Dict[str, Any]] = []

        async with aiosqlite.connect(self.db_path) as conn:
            conn.row_factory = aiosqlite.Row
            query_sql = "SELECT * FROM rag_chunks"
            params: List[Any] = []

            async with conn.execute(query_sql, params) as cursor:
                rows = await cursor.fetchall()
                for row in rows:
                    target = row["agent_target"] or "all"
                    # Category filter if provided
                    if category and row["source"] != category:
                        continue

                    chunk_text = row["text"]
                    chunk_embed_raw = row["embedding"]
                    chunk_embed = json.loads(chunk_embed_raw) if chunk_embed_raw else []

                    # 1. Cosine similarity score
                    sim_score = 0.0
                    if chunk_embed and len(chunk_embed) == len(query_embedding):
                        sim_score = self.vectorizer.cosine_similarity(query_embedding, chunk_embed)
                    
                    # 2. BM25 keyword score
                    doc_tokens = self.vectorizer.tokenize(f"{row['title']} {chunk_text}")
                    bm25_score = self.vectorizer.bm25_keyword_score(query_tokens, doc_tokens)

                    # Hybrid Score computation
                    hybrid_score = (0.65 * sim_score) + (0.35 * bm25_score)

                    # Boost for agent specificity
                    is_direct_agent = target.lower() == agent_name.lower() or target.lower() == agent_name.lower().replace(" agent", "")
                    if is_direct_agent:
                        hybrid_score += 0.20
                    elif target == "all" or agent_name == "Orqion" or agent_name == "Multi-Agent Hub":
                        hybrid_score += 0.05

                    if hybrid_score > 0.05:  # threshold
                        scored_chunks.append({
                            "chunk_id": row["chunk_id"],
                            "doc_id": row["doc_id"],
                            "title": row["title"],
                            "source": row["source"],
                            "text": chunk_text,
                            "score": float(hybrid_score),
                            "agent_target": target
                        })

        # Sort by hybrid score descending
        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        top_chunks = scored_chunks[:top_k]

        if not top_chunks:
            return "", []

        # Format context injection block
        context_parts = []
        sources_meta = []

        context_parts.append("\n[RETRIEVED KNOWLEDGE BASE (RAG CONTEXT)]")
        context_parts.append("The following verified domain context was retrieved from your project workspace, indexed knowledge base, and domain memory:\n")

        for idx, chunk in enumerate(top_chunks, 1):
            relevance_pct = min(99.9, max(15.0, round(chunk["score"] * 100, 1)))
            context_parts.append(f"--- [Source {idx}]: {chunk['title']} (Type: {chunk['source']}, Target: {chunk['agent_target']}, Relevance: {relevance_pct}%) ---")
            context_parts.append(chunk["text"].strip())
            context_parts.append("")

            sources_meta.append({
                "title": chunk["title"],
                "source": chunk["source"],
                "agent_target": chunk["agent_target"],
                "relevance": relevance_pct,
                "snippet": (chunk["text"][:180] + "...") if len(chunk["text"]) > 180 else chunk["text"]
            })

        context_parts.append("[INSTRUCTIONS FOR AGENT GROUNDING]")
        context_parts.append(f"- As {agent_name}, actively synthesize and ground your answer using the retrieved knowledge and project files above.")
        context_parts.append("- If the context directly answers the user query, cite or apply it directly.")
        context_parts.append("- Maintain your specialized agent persona and provide clean, actionable output.")
        context_parts.append("")

        formatted_block = "\n".join(context_parts)
        return formatted_block, sources_meta

    async def list_documents(self) -> List[Dict[str, Any]]:
        """List all indexed documents with chunk count."""
        await self.initialize()
        async with aiosqlite.connect(self.db_path) as conn:
            conn.row_factory = aiosqlite.Row
            async with conn.execute("""
                SELECT d.*, COUNT(c.id) as chunk_count 
                FROM rag_documents d 
                LEFT JOIN rag_chunks c ON d.doc_id = c.doc_id 
                GROUP BY d.doc_id 
                ORDER BY d.created_at DESC
            """) as cursor:
                rows = await cursor.fetchall()
                docs = []
                for r in rows:
                    meta = json.loads(r["metadata"]) if r["metadata"] else {}
                    docs.append({
                        "doc_id": r["doc_id"],
                        "title": r["title"],
                        "source": r["source"],
                        "category": r["category"],
                        "agent_target": r["agent_target"],
                        "chunk_count": r["chunk_count"],
                        "content_preview": (r["content"][:240] + "...") if len(r["content"]) > 240 else r["content"],
                        "metadata": meta,
                        "created_at": r["created_at"],
                        "updated_at": r["updated_at"]
                    })
                return docs

    async def delete_document(self, doc_id: str) -> bool:
        """Deletes a document and its associated chunks."""
        await self.initialize()
        async with aiosqlite.connect(self.db_path) as conn:
            await conn.execute("DELETE FROM rag_documents WHERE doc_id = ?", (doc_id,))
            await conn.execute("DELETE FROM rag_chunks WHERE doc_id = ?", (doc_id,))
            await conn.commit()
            return True

    async def get_stats(self) -> Dict[str, Any]:
        """Returns stats on RAG database."""
        await self.initialize()
        async with aiosqlite.connect(self.db_path) as conn:
            async with conn.execute("SELECT COUNT(*) FROM rag_documents") as c1:
                total_docs = (await c1.fetchone())[0]
            async with conn.execute("SELECT COUNT(*) FROM rag_chunks") as c2:
                total_chunks = (await c2.fetchone())[0]
            async with conn.execute("SELECT COUNT(DISTINCT source) FROM rag_documents") as c3:
                sources_count = (await c3.fetchone())[0]
            return {
                "total_documents": total_docs,
                "total_chunks": total_chunks,
                "sources_count": sources_count,
                "embedding_engine": "Mistral Embeddings API + High-Speed Local Normalized N-gram Vectorizer (Hybrid BM25 + Dense)",
                "status": "active"
            }

# Global singleton instance
rag_service = RAGService()
