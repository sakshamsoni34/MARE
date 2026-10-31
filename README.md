# MARE Platform (Multi-Agent Research & Execution)

MARE is an enterprise-grade full-stack multi-agent operating platform featuring autonomous AI agent collaboration, visual DAG workflow orchestration, sandboxed Python execution, persistent multi-tenant workspace state, interactive terminal CLI, and deep observability.

---

## Key Features

- **Multi-Agent Orchestration Hub**: Real-time collaborative agent reasoning with streaming responses (Mistral AI / Google Gemini / Local fallback).
- **Persistent Relational Data Layer**: High-concurrency SQLite with Write-Ahead Logging (`WAL`), multi-tenant data isolation, and instant hydration of workspace projects, file trees, conversations, and workflows.
- **Sandboxed Python Code Execution**: Ephemeral directory isolation, AST static inspection, stripped secrets, and resource quotas (>100KB guard, 15s timeout limit).
- **Interactive CLI Terminal**: Full terminal console supporting commands: `python <code>`, `ls`, `cat <file>`, `workflow run`, `run <agent>`, `status`, `audit`, `help`, `clear`.
- **Visual DAG Workflow Engine**: Node-based flow builder powered by `@xyflow/react` with topological execution telemetry and animated step-by-step state indicators.
- **Enterprise Multi-Tenant Auth & RBAC**: PBKDF2-HMAC-SHA256 cryptographic password hashing, HS256 JWT tokens, NextAuth bridge, role-based access control, Google OAuth, and 1-click Demo Developer access.
- **Resilience & Observability**: React 19 `ErrorBoundary` wrappers for crash prevention, structured HTTP request logging with request IDs, `/healthz` liveness, and `/readyz` deep schema readiness probes.
- **Production Containerization**: Multi-stage Alpine/Debian Dockerfiles, `docker-compose.yml`, non-root execution, and GitHub Actions CI/CD.

---

## Architecture Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4, Zustand v5 |
| **Editors & Flows** | Monaco Editor, XYFlow (`@xyflow/react`), Three.js WebGL |
| **Backend** | FastAPI (Python 3.12 / 3.13), Uvicorn, SQLite WAL (or PostgreSQL) |
| **Authentication** | NextAuth.js, PBKDF2-HMAC-SHA256, HS256 JWT Bearer Auth |
| **Security & Sandbox** | Ephemeral Subprocess Isolation (`-I`), AST Guard, Secret Scrubber |
| **DevOps & Testing** | Docker, Docker Compose, GitHub Actions, Node `--test`, Pytest suite |

---

## Quick Start (Local Development)

### Prerequisites
- **Node.js** v20+ (v24 recommended)
- **Python** 3.12+ (virtualenv already provided at `mare/backend/venv`)

### 1. Start the Backend API
```bash
cd mare/backend
# Activate virtual environment
.\venv\Scripts\activate   # Windows
# source venv/bin/activate # Linux / macOS

# Start FastAPI server
python main.py
```
> The backend runs on `http://localhost:8555` and automatically initializes the database schema.

### 2. Start the Frontend
```bash
cd mare
npm run dev
```
> Open [http://localhost:3000](http://localhost:3000) (or `http://localhost:3001` if port 3000 is occupied).

### 3. Log In
Click **Sign In** and use:
- **1-Click Demo**: Click **"Demo Developer Login"** for instant full-access access with no setup required.
- **Email / Password**: Register a new account or log in directly.
- **Google OAuth**: (Optional) Configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`.

---

## Automated Verification & Testing

Both frontend and backend include comprehensive automated test suites:

```bash
# Run Frontend Unit Tests (8 test suites)
cd mare
npm test

# Run Backend Integration & Security Tests (4 test suites)
.\mare\backend\venv\Scripts\python.exe mare/backend/test_full_suite.py

# Run Production Build Check
cd mare
npm run build
```

---

## Running with Docker Compose

Deploy the entire production stack in containerized isolation:

```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8555`
- Health probe: `http://localhost:8555/healthz`
- Readiness probe: `http://localhost:8555/readyz`

---

## Environment Variables Configuration

See [`mare/.env.production.example`](file:///c:/Users/saksh/Desktop/PROJECT/mare/.env.production.example) for all available options:

| Variable | Description | Default |
|---|---|---|
| `NEXTAUTH_SECRET` | Secret key for JWT signing & session hashing | Embedded production secret |
| `NEXT_PUBLIC_API_URL` | Base URL for backend API | `http://localhost:8555` |
| `FRONTEND_URL` | Allowed CORS frontend origin | `http://localhost:3000` |
| `MISTRAL_API_KEY` | (Optional) Mistral AI API key for streaming agent responses | None (Local fallback active) |
| `GEMINI_API_KEY` | (Optional) Google Gemini API key for advanced reasoning | None |
| `GOOGLE_CLIENT_ID` | (Optional) Google OAuth 2.0 client ID | None |
| `GOOGLE_CLIENT_SECRET` | (Optional) Google OAuth 2.0 client secret | None |
