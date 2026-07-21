import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Node, Edge } from '@xyflow/react';

export type Agent = 'Researcher Agent' | 'Coder Agent' | 'Planner Agent' | 'Executor Agent' | 'Reviewer Agent' | 'Designer Agent' | 'Tester Agent';

interface StoreState {
  // State
  projects: string[];
  activeProject: string;
  activeAgent: Agent | null;
  openAgents: Agent[];
  terminalLogs: string[];
  editorCode: string;
  agentScripts: Record<string, string>;
  workflowNodes: Node[];
  workflowEdges: Edge[];
  runningAgents: Record<string, boolean>;
  isTerminalOpen: boolean;
  isWorkflowOpen: boolean;
  userQuery: string;

  // Actions
  setActiveProject: (project: string) => void;
  setActiveAgent: (agent: Agent) => void;
  addOpenAgent: (agent: Agent) => void;
  removeOpenAgent: (agent: Agent) => void;
  addTerminalLog: (log: string) => void;
  updateLastTerminalLog: (log: string) => void;
  clearTerminalLogs: () => void;
  setEditorCode: (code: string) => void;
  updateAgentScript: (agent: string, code: string) => void;
  setWorkflowNodes: (nodes: Node[]) => void;
  setWorkflowEdges: (edges: Edge[]) => void;
  setAgentRunning: (agent: string, isRunning: boolean) => void;
  toggleTerminal: () => void;
  toggleWorkflow: () => void;
  setUserQuery: (query: string) => void;
  createNewProject: (name: string, description?: string, goal?: string, source?: string, priority?: string) => void;
  deleteProject: (name: string) => void;
}

const initialCode = `# No active project selected.\\n# Create a new research project to begin.\\n`;

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      projects: [],
      activeProject: '',
      activeAgent: 'Researcher Agent',
      openAgents: ['Researcher Agent'],
      terminalLogs: [
        '> Status: IDLE...',
        '> System ready. Create a new research project to deploy agents.'
      ],
      editorCode: initialCode,
      agentScripts: { 'Researcher Agent': initialCode },
      workflowNodes: initialNodes,
      workflowEdges: initialEdges,
      runningAgents: {},
      isTerminalOpen: false,
      isWorkflowOpen: false,
      userQuery: '',

      setActiveProject: (project) => set({ activeProject: project }),
      setActiveAgent: (agent) => set((state) => {
        if (state.activeAgent === agent) return state;
        
        // Save current editor code to the previous agent's script
        const currentAgent = state.activeAgent || 'Researcher Agent';
        const newScripts = { ...state.agentScripts, [currentAgent]: state.editorCode };
        
        // Load the new agent's script, or default
        const newCode = newScripts[agent] || `# ${agent} Script\n\n# Write your ${agent.toLowerCase()} prompt here...\n`;
        
        return { 
          activeAgent: agent, 
          agentScripts: newScripts,
          editorCode: newCode
        };
      }),
      addOpenAgent: (agent) => set((state) => {
        if (state.openAgents.includes(agent)) return { activeAgent: agent };
        const currentScript = state.agentScripts[agent];
        const newState: Partial<StoreState> = { 
          openAgents: [...state.openAgents, agent],
          activeAgent: agent
        };
        if (!currentScript) {
          newState.agentScripts = { ...state.agentScripts, [agent]: `# ${agent} Script\n\n# Write your ${agent.toLowerCase()} prompt here...\n` };
        }
        return newState;
      }),
      removeOpenAgent: (agent) => set((state) => {
        const newOpenAgents = state.openAgents.filter(a => a !== agent);
        const newState: Partial<StoreState> = { openAgents: newOpenAgents };
        if (state.activeAgent === agent && newOpenAgents.length > 0) {
          newState.activeAgent = newOpenAgents[newOpenAgents.length - 1];
        }
        return newState;
      }),
      addTerminalLog: (log) => set((state) => ({ terminalLogs: [...state.terminalLogs, log] })),
      updateLastTerminalLog: (log) => set((state) => {
        if (state.terminalLogs.length === 0) return { terminalLogs: [log] };
        const newLogs = [...state.terminalLogs];
        newLogs[newLogs.length - 1] = log;
        return { terminalLogs: newLogs };
      }),
      clearTerminalLogs: () => set({ terminalLogs: [] }),
      setEditorCode: (code) => set((state) => ({ 
        editorCode: code,
        agentScripts: { ...state.agentScripts, [state.activeAgent || 'Researcher Agent']: code }
      })),
      updateAgentScript: (agent, code) => set((state) => {
        const newScripts = { ...state.agentScripts, [agent]: code };
        if (state.activeAgent === agent) {
          return { agentScripts: newScripts, editorCode: code };
        }
        return { agentScripts: newScripts };
      }),
      setWorkflowNodes: (nodes) => set({ workflowNodes: nodes }),
      setWorkflowEdges: (edges) => set({ workflowEdges: edges }),
      setAgentRunning: (agent, isRunning) => set((state) => ({ 
        runningAgents: { ...state.runningAgents, [agent]: isRunning } 
      })),
      toggleTerminal: () => set((state) => ({ isTerminalOpen: !state.isTerminalOpen })),
      toggleWorkflow: () => set((state) => ({ isWorkflowOpen: !state.isWorkflowOpen })),
      setUserQuery: (query) => set({ userQuery: query }),
      createNewProject: (name, description, goal, source, priority) => set((state) => {
        if (state.projects.includes(name)) return state;
        
        let metaText = ``;
        if (description) metaText += `\n# Details: ${description}`;
        if (goal) metaText += `\n# Goal: ${goal}`;
        if (source) metaText += `\n# Data Source: ${source}`;
        if (priority) metaText += `\n# Priority: ${priority}`;

        const newInitialCode = `# Research Project: ${name}${metaText}\n\n# Write your research code here...\n`;
        
        return {
          projects: [...state.projects, name],
          activeProject: name,
          editorCode: newInitialCode,
          agentScripts: { 'Researcher Agent': newInitialCode },
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
    }),
    {
      name: 'mare-store',
      partialize: (state) => ({
        projects: state.projects,
        activeProject: state.activeProject,
        agentScripts: state.agentScripts,
        editorCode: state.editorCode,
        openAgents: state.openAgents
      })
    }
  )
);
