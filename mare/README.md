# MARE Dashboard

MARE is a full-stack dashboard application featuring an AI-powered chat agent (using Mistral API), a node-based workflow editor, an integrated code editor, and 3D data visualization capabilities.

## Features

- **AI Chat Agent**: Engage in conversations with an AI agent powered by the Mistral API.
- **Workflow Editor**: Create and manage node-based workflows using a visual interface.
- **Code Editor**: Write and edit code directly within the dashboard.
- **3D Visualization**: Visualize data with interactive 3D components.

## Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (React 19)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Libraries**:
  - `@xyflow/react` for node-based interactive workflows
  - `@monaco-editor/react` for the embedded code editor
  - `three` for 3D visualization and rendering
  - `lucide-react` for iconography
  - `next-auth` for authentication

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **AI Integration**: Mistral API (Streaming responses)
- **Features**: API endpoints for agent conversation, workflow saving, and UI event logging.

## Getting Started

### Prerequisites
- Node.js (v20+)
- Python 3.9+
- A Mistral API key

### 1. Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install the required Python dependencies:
   ```bash
   pip install fastapi uvicorn httpx python-dotenv
   ```
   *(Note: Ensure all dependencies imported in `main.py` and models are installed).*
3. Create a `.env` file in the `backend` directory and add your Mistral API key:
   ```env
   MISTRAL_API_KEY=your_mistral_api_key_here
   ```
4. Start the FastAPI server:
   ```bash
   python main.py
   ```
   The backend will be available at `http://localhost:8555`.

### 2. Frontend Setup

1. Open a new terminal and navigate to the project root directory.
2. Install the npm dependencies:
   ```bash
   npm install
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Project Structure

- `src/` - Contains the Next.js frontend code (Components, Pages, Hooks, and Store).
- `backend/` - Contains the FastAPI backend application for AI integration and data endpoints.
- `public/` - Static assets for the frontend.
