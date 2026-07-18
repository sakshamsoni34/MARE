import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';

export type Agent = 'Scraper' | 'Cleanser' | 'Research Agent' | 'Lead Developer' | 'Code Agent' | 'Reviewer';

interface StoreState {
  // State
  activeProject: string;
  activeAgent: Agent | null;
  terminalLogs: string[];
  editorCode: string;
  workflowNodes: Node[];
  workflowEdges: Edge[];
  isRunning: boolean;

  // Actions
  setActiveProject: (project: string) => void;
  setActiveAgent: (agent: Agent) => void;
  addTerminalLog: (log: string) => void;
  clearTerminalLogs: () => void;
  setEditorCode: (code: string) => void;
  setWorkflowNodes: (nodes: Node[]) => void;
  setWorkflowEdges: (edges: Edge[]) => void;
  setIsRunning: (isRunning: boolean) => void;
}

const initialCode = `import pandas as pd
from sklearn.ensemble import RandomForestClassifier

# Initialize fraud detection model
rf_model = RandomForestClassifier()

rf_model.fit(X_train, y_train)`;

const initialNodes: Node[] = [
  { id: '1', position: { x: 0, y: 100 }, data: { label: 'Scraper' }, type: 'default' },
  { id: '2', position: { x: 250, y: 100 }, data: { label: 'Cleanser' }, type: 'default' },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
];

export const useStore = create<StoreState>((set) => ({
  activeProject: 'Market Analysis',
  activeAgent: 'Code Agent',
  terminalLogs: [
    '> Status: IDLE...',
    '> Multi-Agent system ready for deployment.'
  ],
  editorCode: initialCode,
  workflowNodes: initialNodes,
  workflowEdges: initialEdges,
  isRunning: false,

  setActiveProject: (project) => set({ activeProject: project }),
  setActiveAgent: (agent) => set({ activeAgent: agent }),
  addTerminalLog: (log) => set((state) => ({ terminalLogs: [...state.terminalLogs, log] })),
  clearTerminalLogs: () => set({ terminalLogs: [] }),
  setEditorCode: (code) => set({ editorCode: code }),
  setWorkflowNodes: (nodes) => set({ workflowNodes: nodes }),
  setWorkflowEdges: (edges) => set({ workflowEdges: edges }),
  setIsRunning: (isRunning) => set({ isRunning }),
}));
