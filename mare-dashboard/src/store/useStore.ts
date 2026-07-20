import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';

export type Agent = 'Orchestrator (Manager)' | 'Researcher' | 'Software Engineer' | 'Execution Sandbox' | 'Data Analyst' | 'Critic / QA' | 'Synthesizer' | 'Human Proxy';

interface StoreState {
  // State
  projects: string[];
  activeProject: string;
  activeAgent: Agent | null;
  terminalLogs: string[];
  editorCode: string;
  workflowNodes: Node[];
  workflowEdges: Edge[];
  isRunning: boolean;
  isTerminalOpen: boolean;

  // Actions
  setActiveProject: (project: string) => void;
  setActiveAgent: (agent: Agent) => void;
  addTerminalLog: (log: string) => void;
  clearTerminalLogs: () => void;
  setEditorCode: (code: string) => void;
  setWorkflowNodes: (nodes: Node[]) => void;
  setWorkflowEdges: (edges: Edge[]) => void;
  setIsRunning: (isRunning: boolean) => void;
  toggleTerminal: () => void;
  createNewProject: (name: string, description?: string, goal?: string, source?: string, priority?: string) => void;
  deleteProject: (name: string) => void;
}

const initialCode = `# No active project selected.\\n# Create a new research project to begin.\\n`;

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export const useStore = create<StoreState>((set) => ({
  projects: [],
  activeProject: '',
  activeAgent: 'Orchestrator (Manager)',
  terminalLogs: [
    '> Status: IDLE...',
    '> System ready. Create a new research project to deploy agents.'
  ],
  editorCode: initialCode,
  workflowNodes: initialNodes,
  workflowEdges: initialEdges,
  isRunning: false,
  isTerminalOpen: false,

  setActiveProject: (project) => set({ activeProject: project }),
  setActiveAgent: (agent) => set({ activeAgent: agent }),
  addTerminalLog: (log) => set((state) => ({ terminalLogs: [...state.terminalLogs, log] })),
  clearTerminalLogs: () => set({ terminalLogs: [] }),
  setEditorCode: (code) => set({ editorCode: code }),
  setWorkflowNodes: (nodes) => set({ workflowNodes: nodes }),
  setWorkflowEdges: (edges) => set({ workflowEdges: edges }),
  setIsRunning: (isRunning) => set({ isRunning }),
  toggleTerminal: () => set((state) => ({ isTerminalOpen: !state.isTerminalOpen })),
  createNewProject: (name, description, goal, source, priority) => set((state) => {
    if (state.projects.includes(name)) return state;
    
    let metaText = ``;
    if (description) metaText += `\\n# Details: ${description}`;
    if (goal) metaText += `\\n# Goal: ${goal}`;
    if (source) metaText += `\\n# Data Source: ${source}`;
    if (priority) metaText += `\\n# Priority: ${priority}`;

    const initialCode = `# Research Project: ${name}${metaText}\\n\\n# Write your research code here...\\n`;
    
    return {
      projects: [...state.projects, name],
      activeProject: name,
      editorCode: initialCode,
      terminalLogs: [
        '> Status: IDLE...', 
        `> New research project "${name}" initialized.`,
        ...(description ? [`> Context: ${description}`] : []),
        ...(goal ? [`> Goal: ${goal}`] : []),
        ...(priority ? [`> Priority: ${priority}`] : [])
      ],
      workflowNodes: [],
      workflowEdges: []
    };
  }),
  deleteProject: (name) => set((state) => {
    const newProjects = state.projects.filter(p => p !== name);
    const newActiveProject = state.activeProject === name 
      ? (newProjects.length > 0 ? newProjects[0] : '') 
      : state.activeProject;
    return {
      projects: newProjects,
      activeProject: newActiveProject,
      terminalLogs: [...state.terminalLogs, `> Project "${name}" deleted.`]
    };
  }),
}));
