import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';
import {
  createProjectApi,
  deleteProjectApi,
  syncFileApi,
  deleteFileApi,
  syncConversationApi,
  deleteConversationApi,
  syncWorkflowApi,
  syncAgentStateApi,
} from '@/lib/api';

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
  (set, get) => ({
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

    setActiveProject: (project) => set((state) => ({
      activeProject: project,
      projects: project && !state.projects.includes(project) ? [...state.projects, project] : state.projects
    })),
    setSignInModalOpen: (isOpen) => set({ isSignInModalOpen: isOpen }),
    setActiveAgent: (agent) => set((state) => {
      if (state.activeAgent === agent) return state;
      const newOpenAgents = state.openAgents.includes(agent) 
        ? state.openAgents 
        : [...state.openAgents, agent];
      
      const currentScript = state.agentScripts[agent] || '';
      return {
        activeAgent: agent,
        openAgents: newOpenAgents,
        editorCode: currentScript
      };
    }),
    addOpenAgent: (agent) => set((state) => {
      if (!state.openAgents.includes(agent)) {
        return {
          openAgents: [...state.openAgents, agent],
          activeAgent: agent,
          editorCode: state.agentScripts[agent] || ''
        };
      }
      return { activeAgent: agent, editorCode: state.agentScripts[agent] || '' };
    }),
    removeOpenAgent: (agent) => set((state) => {
      const newOpen = state.openAgents.filter(a => a !== agent);
      let newActive = state.activeAgent;
      if (state.activeAgent === agent) {
        newActive = newOpen.length > 0 ? newOpen[newOpen.length - 1] : null;
      }
      return {
        openAgents: newOpen,
        activeAgent: newActive,
        editorCode: newActive ? (state.agentScripts[newActive] || '') : ''
      };
    }),
    addTerminalLog: (log) => set((state) => ({
      terminalLogs: [...state.terminalLogs, log]
    })),
    updateLastTerminalLog: (log) => set((state) => {
      const newLogs = [...state.terminalLogs];
      if (newLogs.length > 0) {
        newLogs[newLogs.length - 1] = log;
      } else {
        newLogs.push(log);
      }
      return { terminalLogs: newLogs };
    }),
    clearTerminalLogs: () => set({ terminalLogs: [] }),
    setEditorCode: (code) => set((state) => {
      if (state.activeAgent) {
        return {
          editorCode: code,
          agentScripts: {
            ...state.agentScripts,
            [state.activeAgent]: code
          }
        };
      }
      return { editorCode: code };
    }),
    updateAgentScript: (agent, code) => {
      set((state) => ({
        agentScripts: {
          ...state.agentScripts,
          [agent]: code
        },
        editorCode: state.activeAgent === agent ? code : state.editorCode
      }));
      const activeProj = get().activeProject || 'default';
      syncAgentStateApi({ agent_name: agent, project_name: activeProj, script_code: code }).catch(() => {});
    },
    setWorkflowNodes: (nodes) => {
      set({ workflowNodes: nodes });
      const state = get();
      syncWorkflowApi({
        project_name: state.activeProject || 'default',
        nodes,
        edges: state.workflowEdges,
      }).catch(() => {});
    },
    setWorkflowEdges: (edges) => {
      set({ workflowEdges: edges });
      const state = get();
      syncWorkflowApi({
        project_name: state.activeProject || 'default',
        nodes: state.workflowNodes,
        edges,
      }).catch(() => {});
    },
    setAgentRunning: (agent, isRunning) => set((state) => ({
      runningAgents: {
        ...state.runningAgents,
        [agent]: isRunning
      }
    })),
    toggleTerminal: () => set((state) => ({ isTerminalOpen: !state.isTerminalOpen })),
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    toggleRightSidebar: () => set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),
    toggleWorkflow: () => set((state) => ({ isWorkflowOpen: !state.isWorkflowOpen })),
    setWorkflowOpen: (isOpen) => set({ isWorkflowOpen: isOpen }),
    setUserQuery: (query) => set({ userQuery: query }),
    
    createNewProject: (name, description, goal, source, priority) => {
      set((state) => {
        if (state.projects.includes(name)) return state;
        return {
          projects: [name, ...state.projects],
          activeProject: name,
          editorCode: '',
          agentScripts: { 'Researcher Agent': '' },
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
      });
      createProjectApi({ name, description, goal, source, priority }).catch(console.error);
    },
    
    deleteProject: (name) => {
      set((state) => {
        const newProjects = state.projects.filter(p => p !== name);
        const newActiveProject = state.activeProject === name
          ? (newProjects.length > 0 ? newProjects[0] : '')
          : state.activeProject;
        return {
          projects: newProjects,
          activeProject: newActiveProject,
          terminalLogs: [...state.terminalLogs, `> Project "${name}" deleted.`]
        };
      });
      deleteProjectApi(name).catch(console.error);
    },
    
    createFile: (parentId, name, content, agentName) => {
      const newNode: FileSystemNode = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        name,
        type: 'file',
        content,
        agentName
      };

      set((state) => {
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
      });

      const activeProj = get().activeProject || 'default';
      syncFileApi({
        node_id: newNode.id,
        parent_id: parentId,
        project_name: activeProj,
        name,
        type: 'file',
        content,
        agent_name: agentName,
      }).catch(console.error);
    },
    
    createFolder: (parentId, name) => {
      const newNode: FileSystemNode = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        name,
        type: 'folder',
        isOpen: false,
        children: []
      };

      set((state) => {
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
      });

      const activeProj = get().activeProject || 'default';
      syncFileApi({
        node_id: newNode.id,
        parent_id: parentId,
        project_name: activeProj,
        name,
        type: 'folder',
      }).catch(console.error);
    },

    renameNode: (id, newName) => {
      let targetNode: FileSystemNode | undefined;
      set((state) => {
        const renameInNodes = (nodes: FileSystemNode[]): FileSystemNode[] => {
          return nodes.map(node => {
            if (node.id === id) {
              targetNode = { ...node, name: newName };
              return targetNode;
            }
            if (node.children) {
              return { ...node, children: renameInNodes(node.children) };
            }
            return node;
          });
        };
        return { fileSystem: renameInNodes(state.fileSystem) };
      });

      if (targetNode) {
        const activeProj = get().activeProject || 'default';
        syncFileApi({
          node_id: targetNode.id,
          name: targetNode.name,
          type: targetNode.type,
          project_name: activeProj,
          content: targetNode.content,
        }).catch(console.error);
      }
    },

    deleteNode: (id) => {
      set((state) => {
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
      });
      deleteFileApi(id).catch(console.error);
    },

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

    updateNodeContent: (id, content, agentName) => {
      let targetNode: FileSystemNode | undefined;
      set((state) => {
        const updateInNodes = (nodes: FileSystemNode[]): FileSystemNode[] => {
          return nodes.map(node => {
            if (node.id === id) {
              const currentAgentContents = node.agentContents || {};
              if (node.content && node.agentName && Object.keys(currentAgentContents).length === 0) {
                currentAgentContents[node.agentName] = node.content;
              }
              const targetAgent = agentName || node.agentName || 'Researcher Agent';
              targetNode = {
                ...node,
                content,
                agentName: targetAgent,
                agentContents: {
                  ...currentAgentContents,
                  [targetAgent]: content
                }
              };
              return targetNode;
            }
            if (node.children) {
              return { ...node, children: updateInNodes(node.children) };
            }
            return node;
          });
        };
        return { fileSystem: updateInNodes(state.fileSystem) };
      });

      if (targetNode) {
        const activeProj = get().activeProject || 'default';
        syncFileApi({
          node_id: targetNode.id,
          name: targetNode.name,
          type: targetNode.type,
          project_name: activeProj,
          content: targetNode.content,
          agent_name: targetNode.agentName,
          agent_contents: targetNode.agentContents,
        }).catch(console.error);
      }
    },

    savePastConversation: (agent, content) => {
      const initialText = `# ${agent} Script\n\n# Write your ${agent.toLowerCase()} prompt here...\n`;
      let displayCode = content;
      if (content.trim().startsWith('#') && !content.includes('**You:**') && !content.includes(`**${agent}:**`)) {
        displayCode = '';
      } else if (content.startsWith(initialText)) {
        displayCode = content.substring(initialText.length).trimStart();
      }
      if (!displayCode.trim()) return;

      const titleMatch = content.match(/\*\*You:\*\*\s*([^\n]+)/);
      const title = titleMatch ? (titleMatch[1].length > 40 ? titleMatch[1].substring(0, 40) + '...' : titleMatch[1]) : `${agent} Chat`;
      
      const newConvo: PastConversation = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        agent,
        title,
        content,
        timestamp: new Date().toISOString()
      };

      set((state) => ({ pastConversations: [...state.pastConversations, newConvo] }));

      const activeProj = get().activeProject || 'default';
      syncConversationApi({
        convo_id: newConvo.id,
        project_name: activeProj,
        agent: newConvo.agent,
        title: newConvo.title,
        content: newConvo.content,
        timestamp: newConvo.timestamp,
      }).catch(console.error);
    },

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

    deletePastConversation: (id) => {
      set((state) => ({
        pastConversations: state.pastConversations.filter(c => c.id !== id)
      }));
      deleteConversationApi(id).catch(console.error);
    },

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
      terminalLogs: [...state.terminalLogs, '> <span class="text-accent-green">Workspace hydrated from database successfully.</span>']
    })),
  })
);
