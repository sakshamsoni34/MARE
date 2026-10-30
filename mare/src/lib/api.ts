export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8555';

let activeAuthToken = '';

export function setApiAuthToken(token: string) {
  activeAuthToken = token;
}

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (activeAuthToken) {
    headers['Authorization'] = `Bearer ${activeAuthToken}`;
  }
  return headers;
}

export interface HydratedState {
  projects: string[];
  activeProject: string;
  fileSystem: any[];
  pastConversations: any[];
  workflowNodes: any[];
  workflowEdges: any[];
  agentScripts: Record<string, string>;
}

export async function fetchState(projectName?: string): Promise<HydratedState | null> {
  try {
    const url = projectName 
      ? `${API_BASE_URL}/api/state?project=${encodeURIComponent(projectName)}`
      : `${API_BASE_URL}/api/state`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    return data.state || null;
  } catch (err) {
    console.error('Failed to fetch state from backend:', err);
    return null;
  }
}

export async function createProjectApi(data: {
  name: string;
  description?: string;
  goal?: string;
  source?: string;
  priority?: string;
}) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to create project:', err);
    return { status: 'error', message: String(err) };
  }
}

export async function deleteProjectApi(name: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/projects/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to delete project:', err);
    return { status: 'error', message: String(err) };
  }
}

export async function syncFileApi(data: {
  node_id: string;
  parent_id?: string | null;
  project_name?: string;
  name: string;
  type: string;
  content?: string;
  agent_name?: string;
  agent_contents?: Record<string, string>;
}) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/sync/file`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to sync file:', err);
    return { status: 'error', message: String(err) };
  }
}

export async function deleteFileApi(nodeId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/sync/file/${encodeURIComponent(nodeId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to delete file node:', err);
    return { status: 'error', message: String(err) };
  }
}

export async function syncConversationApi(data: {
  convo_id: string;
  project_name?: string;
  agent: string;
  title: string;
  content: string;
  timestamp: string;
}) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/sync/conversation`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to sync conversation:', err);
    return { status: 'error', message: String(err) };
  }
}

export async function deleteConversationApi(convoId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/sync/conversation/${encodeURIComponent(convoId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to delete conversation:', err);
    return { status: 'error', message: String(err) };
  }
}

export async function syncWorkflowApi(data: {
  project_name: string;
  nodes: any[];
  edges: any[];
}) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/sync/workflow`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to sync workflow:', err);
    return { status: 'error', message: String(err) };
  }
}

export async function syncAgentStateApi(data: {
  agent_name: string;
  project_name: string;
  script_code: string;
}) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/sync/agent-state`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to sync agent state:', err);
    return { status: 'error', message: String(err) };
  }
}

export async function sendEventApi(action: string, folderName?: string, details?: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/event`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action, folderName: folderName || 'unknown', details: details || '' }),
    });
    return await res.json();
  } catch {
    return null;
  }
}

export async function sendOquironApi(body: Record<string, any>) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/oquiron`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch {
    return null;
  }
}

export interface CodeExecutionResponse {
  status: 'success' | 'error';
  stdout: string;
  stderr: string;
  returncode: number;
  duration_ms: number;
  threat_blocked?: boolean;
}

export async function executeCodeApi(
  code: string,
  language: string = 'python',
  timeout: number = 10
): Promise<CodeExecutionResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/execute/code`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ code, language, timeout }),
    });
    return await res.json();
  } catch (err) {
    return {
      status: 'error',
      stdout: '',
      stderr: `Network/API Error: ${String(err)}`,
      returncode: -1,
      duration_ms: 0,
    };
  }
}

export interface WorkflowStepResult {
  node_id: string;
  label: string;
  status: 'completed' | 'failed' | 'running';
  duration_ms: number;
  output: string;
}

export interface WorkflowExecutionResponse {
  status: 'success' | 'error';
  project: string;
  executed_nodes_count: number;
  steps: WorkflowStepResult[];
  total_duration_ms: number;
  timestamp: string;
}

export async function executeWorkflowApi(data: {
  project_name: string;
  nodes: any[];
  edges: any[];
}): Promise<WorkflowExecutionResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/workflow/execute`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch {
    return {
      status: 'error',
      project: data.project_name,
      executed_nodes_count: 0,
      steps: [],
      total_duration_ms: 0,
      timestamp: new Date().toISOString(),
    };
  }
}
