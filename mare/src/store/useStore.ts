import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';

export type Agent = 
  | 'Multi-Agent Hub' 
  | 'Researcher Agent' 
  | 'Coder Agent' 
  | 'Planner Agent' 
  | 'Executor Agent' 
  | 'Reviewer Agent' 
  | 'Designer Agent' 
  | 'Tester Agent' 
  | 'Task Decomposer Agent' 
  | 'Goal Manager Agent' 
  | 'Web Search Agent' 
  | 'Academic Research Agent' 
  | 'Browser Agent' 
  | 'News Agent' 
  | 'Code Agent' 
  | 'Python Agent' 
  | 'Automation Agent' 
  | 'Data Analysis Agent' 
  | 'Visualization Agent' 
  | 'Validation Agent' 
  | 'Report Generator Agent' 
  | 'Presentation Agent' 
  | 'Export Agent' 
  | 'Live Workflow Agent' 
  | 'Agent Communication Agent' 
  | 'Logs Agent' 
  | 'Events Agent' 
  | 'Orqion';

export interface PastConversation {
  id: string;
  agent: Agent;
  title: string;
  content: string;
  timestamp: string;
}

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
  isSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  userQuery: string;
  fileSystem: FileSystemNode[];
  selectedFolderId: string | null;
  isSignInModalOpen: boolean;
  pastConversations: PastConversation[];
  hubSelectedAgents: Agent[];

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
  toggleSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleWorkflow: () => void;
  setWorkflowOpen: (isOpen: boolean) => void;
  setUserQuery: (query: string) => void;
  createNewProject: (name: string, description?: string, goal?: string, source?: string, priority?: string) => void;
  deleteProject: (name: string) => void;
  createFile: (parentId: string | null, name: string, content?: string, agentName?: Agent) => void;
  createFolder: (parentId: string | null, name: string) => void;
  renameNode: (id: string, newName: string) => void;
  deleteNode: (id: string) => void;
  toggleFolder: (id: string) => void;
  expandFolder: (id: string) => void;
  collapseAllFolders: () => void;
  setFileSystem: (nodes: FileSystemNode[]) => void;
  setSelectedFolderId: (id: string | null) => void;
  updateNodeContent: (id: string, content: string, agentName?: Agent) => void;
  savePastConversation: (agent: Agent, content: string) => void;
  loadPastConversation: (agent: Agent, id: string) => void;
  deletePastConversation: (id: string) => void;
  toggleHubSelectedAgent: (agent: Agent) => void;
  hydrateState: (payload: Partial<StoreState>) => void;
}

const initialCode = ``;

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];
const initialFileSystem: FileSystemNode[] = [];

export const useStore = create<StoreState>()(
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
      isSidebarOpen: true,
      isRightSidebarOpen: false,
      userQuery: '',
      fileSystem: initialFileSystem,
      selectedFolderId: null,
      isSignInModalOpen: false,
      pastConversations: [],
      hubSelectedAgents: ['Planner Agent', 'Reviewer Agent'],

      setActiveProject: (project) => set({ activeProject: project }),
      setSignInModalOpen: (isOpen) => set({ isSignInModalOpen: isOpen }),
      setActiveAgent: (agent) => set((state) => {
        if (state.activeAgent === agent) return state;
        const currentAgent = state.activeAgent || 'Researcher Agent';
        const newScripts = { ...state.agentScripts, [currentAgent]: state.editorCode };
        const newCode = newScripts[agent] || '';
        return { activeAgent: agent, agentScripts: newScripts, editorCode: newCode };
      }),
      addOpenAgent: (agent) => set((state) => {
        if (state.openAgents.includes(agent)) {
          if (state.activeAgent === agent) return state;
          const currentAgent = state.activeAgent || 'Researcher Agent';
          const newScripts = { ...state.agentScripts, [currentAgent]: state.editorCode };
          return { activeAgent: agent, agentScripts: newScripts, editorCode: newScripts[agent] || '' };
        }
        
        const currentAgent = state.activeAgent || 'Researcher Agent';
        const newScripts = { ...state.agentScripts, [currentAgent]: state.editorCode };
        if (newScripts[agent] === undefined) {
          newScripts[agent] = '';
        }
        
        return {
          openAgents: [...state.openAgents, agent],
          activeAgent: agent,
          agentScripts: newScripts,
          editorCode: newScripts[agent] || ''
        };
      }),
      removeOpenAgent: (agent) => set((state) => {
        const newOpenAgents = state.openAgents.filter(a => a !== agent);
        if (state.activeAgent === agent) {
          const currentAgent = state.activeAgent || 'Researcher Agent';
          const newScripts = { ...state.agentScripts, [currentAgent]: state.editorCode };
          const nextAgent = newOpenAgents.length > 0 ? newOpenAgents[newOpenAgents.length - 1] : null;
          return {
            openAgents: newOpenAgents,
            activeAgent: nextAgent,
            agentScripts: newScripts,
            editorCode: nextAgent ? (newScripts[nextAgent] || '') : ''
          };
        }
        return { openAgents: newOpenAgents };
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
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      toggleRightSidebar: () => set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),
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
      createFile: (parentId, name, content, agentName) => set((state) => {
        const newNode: FileSystemNode = { id: Date.now().toString() + Math.random().toString(36).substring(2, 9), name, type: 'file', content, agentName };

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
        const newNode: FileSystemNode = { id: Date.now().toString() + Math.random().toString(36).substring(2, 9), name, type: 'folder', isOpen: false, children: [] };

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

        const newAgentScripts = { ...state.agentScripts };
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
              if (node.content && node.agentName && Object.keys(currentAgentContents).length === 0) {
                currentAgentContents[node.agentName] = node.content;
              }
              const targetAgent = agentName || node.agentName || 'Researcher Agent';

              return {
                ...node,
                content,
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
      savePastConversation: (agent, content) => set((state) => {
        const initialText = `# ${agent} Script\n\n# Write your ${agent.toLowerCase()} prompt here...\n`;
        let displayCode = content;
        if (content.trim().startsWith('#') && !content.includes('**You:**') && !content.includes(`**${agent}:**`)) {
          displayCode = '';
        } else if (content.startsWith(initialText)) {
          displayCode = content.substring(initialText.length).trimStart();
        }
        if (!displayCode.trim()) return state;

        const titleMatch = content.match(/\*\*You:\*\*\s*([^\n]+)/);
        const title = titleMatch ? (titleMatch[1].length > 40 ? titleMatch[1].substring(0, 40) + '...' : titleMatch[1]) : `${agent} Chat`;
        
        const newConvo: PastConversation = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          agent,
          title,
          content,
          timestamp: new Date().toISOString()
        };
        return { pastConversations: [...state.pastConversations, newConvo] };
      }),
      loadPastConversation: (agent, id) => set((state) => {
        const convo = state.pastConversations.find(c => c.id === id);
        if (!convo) return state;
        
        const currentCode = state.agentScripts[agent] || '';
        const initialText = `# ${agent} Script\n\n# Write your ${agent.toLowerCase()} prompt here...\n`;
        let displayCode = currentCode;
        if (currentCode.trim().startsWith('#') && !currentCode.includes('**You:**') && !currentCode.includes(`**${agent}:**`)) {
          displayCode = '';
        } else if (currentCode.startsWith(initialText)) {
          displayCode = currentCode.substring(initialText.length).trimStart();
        }
        
        let newPastConvos = state.pastConversations.filter(c => c.id !== id);
        
        if (displayCode.trim()) {
          const titleMatch = currentCode.match(/\*\*You:\*\*\s*([^\n]+)/);
          const title = titleMatch ? (titleMatch[1].length > 40 ? titleMatch[1].substring(0, 40) + '...' : titleMatch[1]) : `${agent} Chat`;
          const currentConvo: PastConversation = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
            agent,
            title,
            content: currentCode,
            timestamp: new Date().toISOString()
          };
          newPastConvos = [...newPastConvos, currentConvo];
        }

        const newScripts = { ...state.agentScripts, [agent]: convo.content };
        return {
          pastConversations: newPastConvos,
          agentScripts: newScripts,
          editorCode: state.activeAgent === agent ? convo.content : state.editorCode
        };
      }),
      deletePastConversation: (id) => set((state) => ({
        pastConversations: state.pastConversations.filter(c => c.id !== id)
      })),
      toggleHubSelectedAgent: (agent) => set((state) => {
        if (state.hubSelectedAgents.includes(agent)) {
          return { hubSelectedAgents: state.hubSelectedAgents.filter(a => a !== agent) };
        } else {
          return { hubSelectedAgents: [...state.hubSelectedAgents, agent] };
        }
      }),
      hydrateState: (payload) => set((state) => ({
        ...state,
        ...payload,
        terminalLogs: [...state.terminalLogs, '> <span class="text-accent-green">System state hydrated from database successfully.</span>']
      })),
    })
);
