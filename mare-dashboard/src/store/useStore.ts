import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Node, Edge } from '@xyflow/react';

export type Agent = 'Researcher Agent' | 'Coder Agent' | 'Planner Agent' | 'Executor Agent' | 'Reviewer Agent' | 'Designer Agent' | 'Tester Agent' | 'Task Decomposer Agent' | 'Goal Manager Agent' | 'Web Search Agent' | 'Academic Research Agent' | 'Browser Agent' | 'News Agent' | 'Code Agent' | 'Python Agent' | 'Automation Agent' | 'Data Analysis Agent' | 'Visualization Agent' | 'Validation Agent' | 'Report Generator Agent' | 'Presentation Agent' | 'Export Agent' | 'Live Workflow Agent' | 'Agent Communication Agent' | 'Logs Agent' | 'Events Agent';

export type FileSystemNode = {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileSystemNode[];
  isOpen?: boolean;
  content?: string;
  agentName?: Agent;
  agentContents?: Record<string, string>;
};

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
  fileSystem: FileSystemNode[];
  selectedFolderId: string | null;
  isSignInModalOpen: boolean;

  // Actions
  setActiveProject: (project: string) => void;
  setSignInModalOpen: (isOpen: boolean) => void;
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
  setWorkflowOpen: (isOpen: boolean) => void;
  setUserQuery: (query: string) => void;
  createNewProject: (name: string, description?: string, goal?: string, source?: string, priority?: string) => void;
  deleteProject: (name: string) => void;
  createFile: (parentId: string | null, name: string) => void;
  createFolder: (parentId: string | null, name: string) => void;
  renameNode: (id: string, newName: string) => void;
  deleteNode: (id: string) => void;
  toggleFolder: (id: string) => void;
  expandFolder: (id: string) => void;
  collapseAllFolders: () => void;
  setFileSystem: (nodes: FileSystemNode[]) => void;
  setSelectedFolderId: (id: string | null) => void;
  updateNodeContent: (id: string, content: string, agentName?: Agent) => void;
}

const initialCode = ``;

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];
const initialFileSystem: FileSystemNode[] = [];

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      projects: [],
      activeProject: '',
      activeAgent: null,
      openAgents: [],
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
      fileSystem: initialFileSystem,
      selectedFolderId: null,
      isSignInModalOpen: false,

      setActiveProject: (project) => set({ activeProject: project }),
      setSignInModalOpen: (isOpen) => set({ isSignInModalOpen: isOpen }),
      setActiveAgent: (agent) => set((state) => {
        if (state.activeAgent === agent) return state;

        // Save current editor code to the previous agent's script
        const currentAgent = state.activeAgent || 'Researcher Agent';
        const newScripts = { ...state.agentScripts, [currentAgent]: state.editorCode };

        // Load the new agent's script, or default
        const newCode = newScripts[agent] || '';

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
        if (currentScript === undefined) {
          newState.agentScripts = { ...state.agentScripts, [agent]: '' };
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
      setWorkflowOpen: (isOpen) => set({ isWorkflowOpen: isOpen }),
      setUserQuery: (query) => set({ userQuery: query }),
      createNewProject: (name, description, goal, source, priority) => set((state) => {
        if (state.projects.includes(name)) return state;

        let metaText = ``;
        if (description) metaText += `\n# Details: ${description}`;
        if (goal) metaText += `\n# Goal: ${goal}`;
        if (source) metaText += `\n# Data Source: ${source}`;
        if (priority) metaText += `\n# Priority: ${priority}`;

        const newInitialCode = ``;

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
      createFile: (parentId, name) => set((state) => {
        const newNode: FileSystemNode = { id: Date.now().toString(), name, type: 'file' };

        if (!parentId) {
          return { fileSystem: [...state.fileSystem, newNode] };
        }

        const addNodeToParent = (nodes: FileSystemNode[]): FileSystemNode[] => {
          return nodes.map(node => {
            if (node.id === parentId && node.type === 'folder') {
              return { ...node, children: [...(node.children || []), newNode], isOpen: true };
            }
            if (node.children) {
              return { ...node, children: addNodeToParent(node.children) };
            }
            return node;
          });
        };

        return { fileSystem: addNodeToParent(state.fileSystem) };
      }),
      createFolder: (parentId, name) => set((state) => {
        const newNode: FileSystemNode = { id: Date.now().toString(), name, type: 'folder', isOpen: false, children: [] };

        if (!parentId) {
          return { fileSystem: [...state.fileSystem, newNode] };
        }

        const addNodeToParent = (nodes: FileSystemNode[]): FileSystemNode[] => {
          return nodes.map(node => {
            if (node.id === parentId && node.type === 'folder') {
              return { ...node, children: [...(node.children || []), newNode], isOpen: true };
            }
            if (node.children) {
              return { ...node, children: addNodeToParent(node.children) };
            }
            return node;
          });
        };

        return { fileSystem: addNodeToParent(state.fileSystem) };
      }),
      renameNode: (id, newName) => set((state) => {
        const renameInNodes = (nodes: FileSystemNode[]): FileSystemNode[] => {
          return nodes.map(node => {
            if (node.id === id) {
              return { ...node, name: newName };
            }
            if (node.children) {
              return { ...node, children: renameInNodes(node.children) };
            }
            return node;
          });
        };
        return { fileSystem: renameInNodes(state.fileSystem) };
      }),
      deleteNode: (id) => set((state) => {
        const deletedAgents = new Set<string>();

        const findAgentsInNode = (node: FileSystemNode) => {
          if (node.type === 'file') {
            if (node.agentName) deletedAgents.add(node.agentName);
            if (node.agentContents) {
              Object.keys(node.agentContents).forEach(agent => deletedAgents.add(agent));
            }
          }
          if (node.children) {
            node.children.forEach(findAgentsInNode);
          }
        };

        const deleteFromNodes = (nodes: FileSystemNode[]): FileSystemNode[] => {
          return nodes.filter(node => {
            if (node.id === id) {
              findAgentsInNode(node);
              return false;
            }
            return true;
          }).map(node => {
            if (node.children) {
              return { ...node, children: deleteFromNodes(node.children) };
            }
            return node;
          });
        };

        const newFileSystem = deleteFromNodes(state.fileSystem);

        let newAgentScripts = { ...state.agentScripts };
        deletedAgents.forEach(agent => {
          newAgentScripts[agent] = '';
        });

        let newEditorCode = state.editorCode;
        if (state.activeAgent && deletedAgents.has(state.activeAgent)) {
          newEditorCode = '';
        }

        return {
          fileSystem: newFileSystem,
          agentScripts: newAgentScripts,
          editorCode: newEditorCode
        };
      }),
      toggleFolder: (id) => set((state) => {
        const toggleNode = (nodes: FileSystemNode[]): FileSystemNode[] => {
          return nodes.map(node => {
            if (node.id === id) {
              return { ...node, isOpen: !node.isOpen };
            }
            if (node.children) {
              return { ...node, children: toggleNode(node.children) };
            }
            return node;
          });
        };
        return { fileSystem: toggleNode(state.fileSystem) };
      }),
      expandFolder: (id) => set((state) => {
        const expandNode = (nodes: FileSystemNode[]): FileSystemNode[] => {
          return nodes.map(node => {
            if (node.id === id && node.type === 'folder') {
              return { ...node, isOpen: true };
            }
            if (node.children) {
              return { ...node, children: expandNode(node.children) };
            }
            return node;
          });
        };
        return { fileSystem: expandNode(state.fileSystem) };
      }),
      collapseAllFolders: () => set((state) => {
        const collapseNodes = (nodes: FileSystemNode[]): FileSystemNode[] => {
          return nodes.map(node => {
            if (node.type === 'folder') {
              return { ...node, isOpen: false, children: node.children ? collapseNodes(node.children) : [] };
            }
            return node;
          });
        };
        return { fileSystem: collapseNodes(state.fileSystem) };
      }),
      setFileSystem: (nodes) => set({ fileSystem: nodes }),
      setSelectedFolderId: (id) => set({ selectedFolderId: id }),
      updateNodeContent: (id, content, agentName) => set((state) => {
        const updateInNodes = (nodes: FileSystemNode[]): FileSystemNode[] => {
          return nodes.map(node => {
            if (node.id === id) {
              const currentAgentContents = node.agentContents || {};
              // Migrate legacy content if needed
              if (node.content && node.agentName && Object.keys(currentAgentContents).length === 0) {
                currentAgentContents[node.agentName] = node.content;
              }
              const targetAgent = agentName || node.agentName || 'Researcher Agent';

              return {
                ...node,
                content, // keep legacy field just in case
                agentName: targetAgent,
                agentContents: {
                  ...currentAgentContents,
                  [targetAgent]: content
                }
              };
            }
            if (node.children) {
              return { ...node, children: updateInNodes(node.children) };
            }
            return node;
          });
        };
        return { fileSystem: updateInNodes(state.fileSystem) };
      }),
    }),
    {
      name: 'mare-store',
      partialize: (state) => ({
        openAgents: state.openAgents,
        activeProject: state.activeProject,
        projects: state.projects
      })
    }
  )
);
