import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Play, Save, Plus, Mic, AudioLines, X, Maximize2, FileText, Bot, Trash2, Send, Loader2, History, MoreHorizontal } from 'lucide-react';
import { useStore, Agent, FileSystemNode } from '@/store/useStore';
import { useSession } from 'next-auth/react';

interface ChatInterfaceProps {
  agent: Agent;
}

const AGENT_CONFIGS: Record<string, { description: string, prompts: string[] }> = {
  'Researcher Agent': {
    description: "I gather, analyze, and synthesize information to support your projects.",
    prompts: ["Find latest research on AI", "Summarize this topic", "Find sources for my claim", "Extract key data points"]
  },
  'Planner Agent': {
    description: "I help structure your projects, break down goals, and create actionable roadmaps.",
    prompts: ["Create a project timeline", "Break down this goal", "What are the dependencies?", "Draft a daily plan"]
  },
  'Executor Agent': {
    description: "I take actionable steps and execute tasks according to the plan.",
    prompts: ["Execute the next step", "Run the deployment script", "Process the queue", "Complete pending tasks"]
  },
  'Reviewer Agent': {
    description: "I review outputs, code, or documents for quality, accuracy, and improvements.",
    prompts: ["Review this draft", "Check for errors", "Suggest improvements", "Verify compliance"]
  },
  'Designer Agent': {
    description: "I assist with creative tasks, UI/UX design concepts, and visual structuring.",
    prompts: ["Suggest a color palette", "Design a layout", "Improve this UI", "Create wireframe ideas"]
  },
  'Tester Agent': {
    description: "I generate test cases, run QA checks, and identify potential bugs.",
    prompts: ["Generate unit tests", "Test this endpoint", "Find edge cases", "Run integration tests"]
  },
  'Task Decomposer Agent': {
    description: "I specialize in breaking complex problems into smaller, manageable sub-tasks.",
    prompts: ["Break down this feature", "Create sub-tasks", "Identify milestones", "Simplify this problem"]
  },
  'Goal Manager Agent': {
    description: "I track overall progress and ensure all tasks align with the main objectives.",
    prompts: ["Check project progress", "Are we on track?", "Update the goal status", "Realign priorities"]
  },
  'Web Search Agent': {
    description: "I scour the internet to find relevant articles, data, and answers in real-time.",
    prompts: ["Search for latest news", "Find tutorials on this", "Look up this error", "Find alternatives to X"]
  },
  'Academic Research Agent': {
    description: "I search academic databases, find papers, and help format citations.",
    prompts: ["Find papers on this", "Summarize this abstract", "Format these citations", "Look up author publications"]
  },
  'Browser Agent': {
    description: "I navigate web pages, scrape content, and interact with web interfaces.",
    prompts: ["Scrape this website", "Navigate to this URL", "Extract table data", "Monitor this page"]
  },
  'News Agent': {
    description: "I aggregate and summarize the latest news articles across various domains.",
    prompts: ["Get today's headlines", "Find news on tech", "Summarize this article", "Monitor this topic"]
  },
  'Data Analysis Agent': {
    description: "I clean, process, and analyze datasets to uncover trends and insights.",
    prompts: ["Analyze this dataset", "Find trends in data", "Clean this CSV", "Calculate key metrics"]
  },
  'Visualization Agent': {
    description: "I create charts, graphs, and visual representations of your data.",
    prompts: ["Plot this data", "Create a bar chart", "Visualize the trend", "Generate a dashboard"]
  },
  'Validation Agent': {
    description: "I validate data formats, schemas, and ensure outputs meet requirements.",
    prompts: ["Validate this JSON", "Check schema compliance", "Verify data types", "Test constraints"]
  },
  'Report Generator Agent': {
    description: "I compile data and summaries into well-structured, comprehensive reports.",
    prompts: ["Generate weekly report", "Compile summary", "Export to PDF", "Format findings"]
  },
  'Presentation Agent': {
    description: "I help draft slides, talking points, and presentation structures.",
    prompts: ["Draft a 5-slide deck", "Create speaking notes", "Structure this pitch", "Summarize for execs"]
  },
  'Export Agent': {
    description: "I format and export your project data into various file formats (CSV, PDF, etc).",
    prompts: ["Export as CSV", "Convert to Markdown", "Save as JSON", "Prepare download package"]
  },
  'Live Workflow Agent': {
    description: "I monitor and manage real-time active workflows and orchestrate processes.",
    prompts: ["Show active workflows", "Monitor execution", "Optimize pipeline", "Handle this event"]
  },
  'Agent Communication Agent': {
    description: "I route messages, handle IPC, and coordinate tasks between other agents.",
    prompts: ["Send message to planner", "Broadcast update", "Check agent status", "Resolve conflicts"]
  },
  'Logs Agent': {
    description: "I monitor system logs, analyze errors, and track activity history.",
    prompts: ["Show recent errors", "Filter logs by tag", "Analyze stack trace", "Export today's logs"]
  },
  'Events Agent': {
    description: "I handle system events, triggers, and scheduled tasks in the environment.",
    prompts: ["List active triggers", "Handle this webhook", "Schedule a cron job", "Monitor event stream"]
  },
  'Orqion': {
    description: "I am your general-purpose AI assistant. I can help you with normal daily tasks, writing code, answering questions, and anything else you need.",
    prompts: ["How do I start?", "Write a Python script", "Summarize this page", "Explain this concept"]
  }
};

const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getAgentTheme = (agentName: string) => {
  const themes = [
    { bg: 'bg-blue-500/5', border: 'border-blue-500/20', hoverBorder: 'hover:border-blue-500/50', text: 'text-blue-400', glow: 'from-blue-500/20', iconBg: 'bg-blue-500/10', iconText: 'text-blue-400', hoverBg: 'hover:bg-blue-500/10' },
    { bg: 'bg-purple-500/5', border: 'border-purple-500/20', hoverBorder: 'hover:border-purple-500/50', text: 'text-purple-400', glow: 'from-purple-500/20', iconBg: 'bg-purple-500/10', iconText: 'text-purple-400', hoverBg: 'hover:bg-purple-500/10' },
    { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', hoverBorder: 'hover:border-emerald-500/50', text: 'text-emerald-400', glow: 'from-emerald-500/20', iconBg: 'bg-emerald-500/10', iconText: 'text-emerald-400', hoverBg: 'hover:bg-emerald-500/10' },
    { bg: 'bg-amber-500/5', border: 'border-amber-500/20', hoverBorder: 'hover:border-amber-500/50', text: 'text-amber-400', glow: 'from-amber-500/20', iconBg: 'bg-amber-500/10', iconText: 'text-amber-400', hoverBg: 'hover:bg-amber-500/10' },
    { bg: 'bg-rose-500/5', border: 'border-rose-500/20', hoverBorder: 'hover:border-rose-500/50', text: 'text-rose-400', glow: 'from-rose-500/20', iconBg: 'bg-rose-500/10', iconText: 'text-rose-400', hoverBg: 'hover:bg-rose-500/10' },
    { bg: 'bg-cyan-500/5', border: 'border-cyan-500/20', hoverBorder: 'hover:border-cyan-500/50', text: 'text-cyan-400', glow: 'from-cyan-500/20', iconBg: 'bg-cyan-500/10', iconText: 'text-cyan-400', hoverBg: 'hover:bg-cyan-500/10' },
  ];
  let hash = 0;
  for (let i = 0; i < agentName.length; i++) {
    hash = agentName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return themes[Math.abs(hash) % themes.length];
};

const formatMarkdown = (text: string, agentTheme: any) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.trim() === '---') {
      return <hr key={i} className="my-4 border-white/5" />;
    }

    let formatted = line
      .replace(/\*\*(.*?)\*\*/g, `<strong class="${agentTheme.text} font-semibold tracking-wide">$1</strong>`)
      .replace(/\*(.*?)\*/g, `<em class="italic text-gray-400">$1</em>`)
      .replace(/`(.*?)`/g, `<code class="${agentTheme.bg} ${agentTheme.text} px-1.5 py-0.5 rounded text-[12px] font-mono border ${agentTheme.border} shadow-sm">$1</code>`)
      .replace(/\[(.*?)\]\((.*?)\)/g, `<a href="$2" target="_blank" class="${agentTheme.text} hover:underline underline-offset-2 decoration-${agentTheme.text.split('-')[1]}-500/30">$1</a>`)
      .replace(/^(#{1,6})\s+(.*)$/g, (match, hashes, title) => {
         const size = Math.max(16 - (hashes.length * 1), 13);
         return `<div class="font-semibold text-white mt-4 mb-2 tracking-tight flex items-center gap-2" style="font-size: ${size}px;">
           <div class="w-1.5 h-1.5 rounded-sm ${agentTheme.iconBg}"></div>
           ${title}
         </div>`;
      });

    if (line.trim().startsWith('- ')) {
      return (
        <div key={i} className="flex gap-3 my-1.5 items-start group">
          <div className={`mt-2 shrink-0 w-1.5 h-1.5 rounded-sm rotate-45 transition-transform group-hover:scale-125 ${agentTheme.bg} border ${agentTheme.border}`}></div>
          <span dangerouslySetInnerHTML={{ __html: formatted.substring(2) }} className="text-gray-300" />
        </div>
      );
    }

    const numListMatch = line.match(/^(\d+\.)\s(.*)/);
    if (numListMatch) {
      const remainingFormatted = formatted.replace(/^\d+\.\s/, '');
      return (
        <div key={i} className="flex gap-2.5 my-2 items-start group">
          <span className={`shrink-0 flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold ${agentTheme.bg} ${agentTheme.text} border ${agentTheme.border} shadow-sm transition-all group-hover:shadow-md`}>
            {numListMatch[1].replace('.', '')}
          </span>
          <span dangerouslySetInnerHTML={{ __html: remainingFormatted }} className="text-gray-300 mt-0.5" />
        </div>
      );
    }

    if (line.trim() === '') return <div key={i} className="h-2"></div>;

    if (line.trim().startsWith('>')) {
      return (
        <div key={i} className={`relative overflow-hidden border-l-2 ${agentTheme.border} pl-4 py-2.5 my-3 text-gray-300/90 italic ${agentTheme.bg} rounded-r-lg`}>
          <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl ${agentTheme.glow} to-transparent opacity-30`}></div>
          <span dangerouslySetInnerHTML={{ __html: formatted.replace(/^>\s?/, '') }}></span>
        </div>
      );
    }

    return <div key={i} dangerouslySetInnerHTML={{ __html: formatted }} className="my-1.5" />;
  });
};

export default function ChatInterface({ agent }: ChatInterfaceProps) {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id ? parseInt((session?.user as any)?.id) : undefined;
  const { agentScripts, updateAgentScript, removeOpenAgent, activeAgent, setActiveAgent, runningAgents, setAgentRunning, addTerminalLog, userQuery, selectedFolderId, updateNodeContent, fileSystem, createFile, toggleRightSidebar, pastConversations, savePastConversation, loadPastConversation, deletePastConversation, hubSelectedAgents, toggleHubSelectedAgent } = useStore();
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const code = agentScripts[agent] || '';
  const isRunning = runningAgents[agent];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [localQuery, setLocalQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<{ msgId: string, idx: number } | null>(null);
  const agentTheme = getAgentTheme(agent);

  const initialText = `# ${agent} Script\n\n# Write your ${agent.toLowerCase()} prompt here...\n`;
  const isLegacyInitialState = code.trim().startsWith('#') && !code.includes('**You:**') && !code.includes(`**${agent}:**`);
  const isInitialState = code.trim() === '' || isLegacyInitialState;
  let displayCode = code;
  if (isLegacyInitialState) {
    displayCode = '';
  } else if (code.startsWith(initialText)) {
    displayCode = code.substring(initialText.length).trimStart();
  }
  const hasMessages = !isInitialState && !!displayCode;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [code]);

  const findNode = (nodes: FileSystemNode[], id: string): FileSystemNode | undefined => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const findParentFolder = (nodes: FileSystemNode[], id: string, parentName: string | null = null): string | null => {
    for (const node of nodes) {
      if (node.id === id) return parentName;
      if (node.children) {
        const found = findParentFolder(node.children, id, node.type === 'folder' ? node.name : parentName);
        if (found) return found;
      }
    }
    return null;
  };

  const handleRunAgent = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRunning) return;

    setAgentRunning(agent, true);
    addTerminalLog(`> Status: <span class="text-accent-yellow">INITIALIZING ${agent.toUpperCase()}...</span>`);

    try {
      const autoWorkflowPrompt = `

IMPORTANT: If your response involves a process, plan, or multiple steps, always include a visual workflow representation at the end of your response. Use the following JSON format inside a markdown json block:
\`\`\`json
{
  "workflow": {
    "nodes": [
      { "id": "1", "position": { "x": 100, "y": 100 }, "data": { "label": "Step 1" } },
      { "id": "2", "position": { "x": 350, "y": 100 }, "data": { "label": "Step 2" } }
    ],
    "edges": [
      { "id": "e1-2", "source": "1", "target": "2", "animated": true }
    ]
  }
}
\`\`\`
`;

      let systemPromptToUse = agentScripts[agent] || 'You are a helpful AI assistant.';
      
      if (agent !== 'Orqion') {
        systemPromptToUse += autoWorkflowPrompt;
      } else {
        systemPromptToUse += `\n\nIMPORTANT: As Orqion, you are a professional AI assistant. You must provide direct, point-to-point responses to the user's queries in a clear and concise manner. Do not generate visual workflows or complex internal structures unless explicitly requested.`;
      }

      if (agent === 'Orqion') {
        systemPromptToUse += `\n\nAdditionally, you have the ability to perform UI actions in the dashboard on behalf of the user (e.g., create a file, create a folder, or open an agent). 
CRITICAL RULE: DO NOT output UI action JSON blocks as examples, and DO NOT output them preemptively. ONLY output a UI action JSON block if the user explicitly requests you to perform that exact action. Keep your answers brief, conversational, and simple. Do not overwhelm the user with complex formatting or unsolicited workflows.
When explicitly requested to perform an action, use this format:
\`\`\`json
{
  "ui_action": {
    "type": "create_folder",
    "name": "folder_name"
  }
}
\`\`\`
Supported types:
- "create_folder" (requires "name")
- "create_file" (requires "name", optional "content")
- "delete_folder" (requires "name")
- "delete_file" (requires "name")
- "open_agent" (requires "agentName", e.g., "Planner Agent")
- "close_agent" (requires "agentName", e.g., "Planner Agent")
- "save_chat"
- "clear_chat"
- "open_terminal"
- "close_terminal"
- "open_workflow"
- "close_workflow"
`;
      }

      const queryToUse = localQuery.trim() || userQuery || 'Say hello';
      setLocalQuery('');

      let currentScriptCode = agentScripts[agent] || '';
      currentScriptCode += `\n\n**You:** ${queryToUse}\n`;
      updateAgentScript(agent, currentScriptCode);

      if (agent === 'Multi-Agent Hub') {
         let accumulatedContext = `User requested: ${queryToUse}\n\n`;
         for (const subAgent of hubSelectedAgents) {
            currentScriptCode += `\n**${subAgent}:**\n\n`;
            updateAgentScript(agent, currentScriptCode);
            addTerminalLog(`> Status: <span class="text-accent-yellow">HUB: Executing ${subAgent}...</span>`);

            let hubSystemPrompt = (AGENT_CONFIGS[subAgent]?.description || 'You are a helpful AI.') + autoWorkflowPrompt + `\n\n[CONTEXT FROM PREVIOUS AGENTS]\n${accumulatedContext}\nPlease build upon the previous responses to accomplish the user's request.`;
            
            const response = await fetch('http://localhost:8555/api/agent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                agentName: subAgent,
                systemPrompt: hubSystemPrompt,
                userQuery: queryToUse,
              }),
            });

            if (!response.ok) {
              addTerminalLog(`> <span class="text-accent-red">Hub Error (${subAgent}):</span> Failed to fetch.`);
              continue;
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let subAgentOutput = "";

            while (reader) {
              const { value, done } = await reader.read();
              if (done) break;
              if (value) {
                const chunkStr = decoder.decode(value, { stream: true });
                const lines = chunkStr.split('\n').filter((line) => line.trim() !== '');
                for (const line of lines) {
                  if (line.startsWith('data:')) {
                    const dataStr = line.replace(/^data:/, '').trim();
                    if (dataStr === '[DONE]') continue;
                    try {
                      const parsed = JSON.parse(dataStr);
                      const content = parsed.choices?.[0]?.delta?.content;
                      if (content) {
                        currentScriptCode += content;
                        subAgentOutput += content;
                        updateAgentScript(agent, currentScriptCode);
                      }
                    } catch (e) { }
                  }
                }
              }
            }
            accumulatedContext += `\n\n--- [Output from ${subAgent}] ---\n${subAgentOutput}\n`;
         }
      } else {

      const response = await fetch('http://localhost:8555/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: agent,
          systemPrompt: systemPromptToUse,
          userQuery: queryToUse,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error || errorData.detail || 'Failed to connect to agent.';
        addTerminalLog(`> <span class="text-accent-red">Error (${agent}):</span> ${errMsg}`);
        setAgentRunning(agent, false);
        return;
      }

      addTerminalLog(`> <span class="text-accent-green">${agent} connected. Task is executing...</span>`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let currentScriptCode = agentScripts[agent] || '';

      currentScriptCode += `\n\n**You:** ${queryToUse}\n`;
      currentScriptCode += `\n**${agent}:**\n\n`;
      updateAgentScript(agent, currentScriptCode);

      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split('\n').filter((line) => line.trim() !== '');
          for (const line of lines) {
            if (line.startsWith('data:')) {
              const dataStr = line.replace(/^data:/, '').trim();
              if (dataStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(dataStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  currentScriptCode += content;
                  updateAgentScript(agent, currentScriptCode);
                }
              } catch (e) {
                // ignore
              }
            }
          }
        }
      }

      const jsonBlocks = [...currentScriptCode.matchAll(/```json\s*([\s\S]*?)\s*```/g)];
      for (const match of jsonBlocks) {
        try {
          const parsed = JSON.parse(match[1]);
          if (parsed.workflow && parsed.workflow.nodes && parsed.workflow.edges) {
            useStore.getState().setWorkflowNodes(parsed.workflow.nodes);
            useStore.getState().setWorkflowEdges(parsed.workflow.edges);
            useStore.getState().setWorkflowOpen(true);
            addTerminalLog(`> Status: <span class="text-accent-blue">Generated workflow from response.</span>`);

            currentScriptCode = currentScriptCode.replace(match[0], '\n> *[Workflow configuration extracted and rendered in the Multi-Agent Workflow panel]*\n');
            updateAgentScript(agent, currentScriptCode);
            break;
          }
          
          if (parsed.ui_action) {
             const action = parsed.ui_action;
             if (action.type === 'create_folder') {
                useStore.getState().createFolder(useStore.getState().selectedFolderId || null, action.name);
                addTerminalLog(`> Status: <span class="text-accent-blue">Orqion created folder: ${action.name}</span>`);
             } else if (action.type === 'create_file') {
                useStore.getState().createFile(useStore.getState().selectedFolderId || null, action.name, action.content || '');
                addTerminalLog(`> Status: <span class="text-accent-blue">Orqion created file: ${action.name}</span>`);
             } else if (action.type === 'delete_folder' || action.type === 'delete_file') {
                const fs = useStore.getState().fileSystem;
                const findNode = (nodes: any[], name: string, type: string): any => {
                  for (const n of nodes) {
                    if (n.name === name && n.type === type) return n;
                    if (n.children) {
                      const found = findNode(n.children, name, type);
                      if (found) return found;
                    }
                  }
                  return null;
                };
                const targetType = action.type === 'delete_folder' ? 'folder' : 'file';
                const node = findNode(fs, action.name, targetType);
                if (node) {
                  useStore.getState().deleteNode(node.id);
                  addTerminalLog(`> Status: <span class="text-accent-blue">Orqion deleted ${targetType}: ${action.name}</span>`);
                } else {
                  addTerminalLog(`> Error: <span class="text-accent-red">Orqion could not find ${targetType} to delete: ${action.name}</span>`);
                }
             } else if (action.type === 'open_agent') {
                useStore.getState().addOpenAgent(action.agentName);
                useStore.getState().setActiveAgent(action.agentName);
                addTerminalLog(`> Status: <span class="text-accent-blue">Orqion opened agent: ${action.agentName}</span>`);
             } else if (action.type === 'close_agent') {
                useStore.getState().removeOpenAgent(action.agentName);
                addTerminalLog(`> Status: <span class="text-accent-blue">Orqion closed agent: ${action.agentName}</span>`);
             } else if (action.type === 'save_chat') {
                const chatContent = agentScripts[agent] || '';
                const titleMatch = chatContent.match(/\*\*You:\*\*\s*([^\n]+)/);
                const title = titleMatch ? titleMatch[1].substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_') : 'chat';
                const filename = `${agent.replace(' ', '_').toLowerCase()}_${title}.md`;
                useStore.getState().createFile(useStore.getState().selectedFolderId || null, filename, chatContent, agent);
                addTerminalLog(`> Status: <span class="text-accent-blue">Orqion saved chat to file: ${filename}</span>`);
             } else if (action.type === 'clear_chat') {
                useStore.getState().savePastConversation(agent, agentScripts[agent] || '');
                updateAgentScript(agent, `# ${agent} Script\n\n# Write your ${agent.toLowerCase()} prompt here...\n`);
                addTerminalLog(`> Status: <span class="text-accent-blue">Orqion cleared and archived the chat</span>`);
             } else if (action.type === 'open_terminal') {
                if (!useStore.getState().isTerminalOpen) useStore.getState().toggleTerminal();
             } else if (action.type === 'close_terminal') {
                if (useStore.getState().isTerminalOpen) useStore.getState().toggleTerminal();
             } else if (action.type === 'open_workflow') {
                if (!useStore.getState().isWorkflowOpen) useStore.getState().toggleWorkflow();
             } else if (action.type === 'close_workflow') {
                if (useStore.getState().isWorkflowOpen) useStore.getState().toggleWorkflow();
             }
             
             currentScriptCode = currentScriptCode.replace(match[0], '\n> *[Action executed successfully by Orqion]*\n');
             updateAgentScript(agent, currentScriptCode);
          }
        } catch (e) { }
      }
      
      } // end else for single agent processing

      // Log the conversation to the new API endpoint
      try {
        const fullAgentResponse = currentScriptCode.split(`**${agent}:**\n\n`)[1] || '';
        const logResponse = await fetch('http://localhost:8555/api/log_chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentName: agent,
            userQuery: queryToUse,
            agentResponse: fullAgentResponse.trim(),
            userId: userId
          })
        });
        if (logResponse.ok) {
          const logJson = await logResponse.json();
          const formattedLog = JSON.stringify(logJson, null, 2).replace(/\n/g, '<br>').replace(/ /g, '&nbsp;');
          addTerminalLog(`> <span class="text-blue-400">Chat API Log:</span> <br><pre class="text-xs text-gray-300 mt-1">${formattedLog}</pre>`);
        }
      } catch (logErr) {
        console.error("Failed to log chat:", logErr);
      }

      addTerminalLog(`> Status: <span class="text-accent-green">${agent.toUpperCase()} TASK COMPLETED</span>`);
    } catch (error: any) {
      addTerminalLog(`> <span class="text-accent-red">Error (${agent}):</span> ${error.message}`);
    } finally {
      setAgentRunning(agent, false);
    }
  };

  const [showSavePopup, setShowSavePopup] = useState<string | null>(null);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (selectedFolderId) {
      const selectedNode = findNode(fileSystem, selectedFolderId);
      if (selectedNode && selectedNode.type === 'file') {
        updateNodeContent(selectedFolderId, code, agent);
        addTerminalLog(`> <span class="text-accent-green">Success:</span> Saved script to file "${selectedNode.name}".`);

        setShowSavePopup(`Saved in file "${selectedNode.name}"`);
        setTimeout(() => setShowSavePopup(null), 3000);

        try {
          const logResponse = await fetch('http://localhost:8555/api/saved_files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: selectedNode.name, agentName: agent, folderName: findParentFolder(fileSystem, selectedFolderId) || "root", userId: userId })
          });
          if (logResponse.ok) {
            const logJson = await logResponse.json();
            const formattedLog = JSON.stringify(logJson, null, 2).replace(/\n/g, '<br>').replace(/ /g, '&nbsp;');
            addTerminalLog(`> <span class="text-blue-400">Save API Response:</span> <br><pre class="text-xs text-gray-300 mt-1">${formattedLog}</pre>`);
          }
        } catch (apiErr) {
          console.error("Failed to call save API:", apiErr);
        }

        return;
      }
    }

    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: `${agent.replace(' ', '_').toLowerCase()}_output.md`,
        types: [{
          description: 'Markdown Files',
          accept: { 'text/markdown': ['.md'] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(code);
      await writable.close();
      
      createFile(selectedFolderId || null, handle.name, code, agent);
      
      addTerminalLog(`> <span class="text-accent-green">Success:</span> Saved ${agent} response to local file system.`);

      setShowSavePopup(`Saved to local file system`);
      setTimeout(() => setShowSavePopup(null), 3000);

      try {
        const folderName = selectedFolderId ? (findNode(fileSystem, selectedFolderId)?.type === 'folder' ? findNode(fileSystem, selectedFolderId)?.name : findParentFolder(fileSystem, selectedFolderId)) || "root" : "local";
        const logResponse = await fetch('http://localhost:8555/api/saved_files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: handle.name, agentName: agent, folderName, userId: userId })
        });
        if (logResponse.ok) {
          const logJson = await logResponse.json();
          const formattedLog = JSON.stringify(logJson, null, 2).replace(/\n/g, '<br>').replace(/ /g, '&nbsp;');
          addTerminalLog(`> <span class="text-blue-400">Save API Response:</span> <br><pre class="text-xs text-gray-300 mt-1">${formattedLog}</pre>`);
        }
      } catch (apiErr) {
        console.error("Failed to call save API:", apiErr);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        addTerminalLog(`> <span class="text-accent-red">Error:</span> Failed to save file: ${err.message}`);
      }
    }
  };

  const isActive = activeAgent === agent;

  return (
    <div
      className={`relative flex flex-1 flex-col rounded-xl border bg-[#1e1e1e] overflow-hidden shadow-lg mx-1 min-w-[300px] transition-all ${isActive ? 'border-brand-500/50 ring-1 ring-brand-500/20' : 'border-[var(--color-border-primary)] opacity-90'}`}
      onClick={() => setActiveAgent(agent)}
    >
      <div className="flex items-center justify-between bg-transparent px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[15px] text-blue-400">{agent === 'Orqion' ? 'Orqion' : agent}</span>
        </div>
        <div className="flex items-center gap-5 text-gray-400">
          <button
            onClick={handleSave}
            className="flex items-center justify-center hover:text-white transition-colors cursor-pointer"
            title="Save"
          >
            <Save size={18} strokeWidth={2} />
          </button>
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              if (hasMessages) {
                savePastConversation(agent, code);
                updateAgentScript(agent, `# ${agent} Script\n\n# Write your ${agent.toLowerCase()} prompt here...\n`);
              }
            }}
            className="flex items-center justify-center hover:text-white transition-colors cursor-pointer"
            title="New Conversation"
          >
            <Plus size={18} strokeWidth={2} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowHistoryModal(true); }}
            className="flex items-center justify-center hover:text-white transition-colors cursor-pointer"
            title="Past Conversations"
          >
            <History size={16} strokeWidth={2} />
          </button>
          <button
            className="flex items-center justify-center hover:text-white transition-colors cursor-pointer"
            title="More Details"
          >
            <MoreHorizontal size={18} strokeWidth={2} />
          </button>
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              if (agent === 'Orqion') {
                toggleRightSidebar();
              } else {
                removeOpenAgent(agent); 
              }
            }}
            className="flex items-center justify-center hover:text-white transition-colors cursor-pointer ml-1"
            title="Close"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden relative">
        
        {/* Chat History / Initial State Area */}
        <div
          ref={scrollRef}
          className="w-full flex-1 overflow-y-auto p-4 text-gray-300 font-sans text-sm whitespace-pre-wrap break-words custom-scrollbar flex flex-col"
          style={{ fontFamily: "Inter, sans-serif", lineHeight: 1.6 }}
        >
          {!hasMessages ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-full animate-in fade-in duration-500 max-w-2xl mx-auto w-full py-8">
              <div className="w-14 h-14 bg-brand-500/10 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-brand-500/20 shadow-inner">
                <Bot size={28} className="text-brand-400" />
              </div>
              <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">{agent}</h1>
              <p className="text-gray-400 text-center max-w-md mb-10 text-[13.5px] leading-relaxed">
                {AGENT_CONFIGS[agent]?.description || "How can I assist you with your tasks today?"}
              </p>

              {AGENT_CONFIGS[agent]?.prompts && agent !== 'Multi-Agent Hub' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  {AGENT_CONFIGS[agent].prompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setLocalQuery(prompt);
                      }}
                      className="text-left px-4 py-3 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] hover:border-brand-500/40 hover:bg-brand-500/5 transition-all text-[13px] text-gray-300 flex items-start gap-3 group"
                    >
                      <MessageSquare size={14} className="mt-0.5 text-gray-500 group-hover:text-brand-400 transition-colors shrink-0" />
                      <span className="leading-snug">{prompt}</span>
                    </button>
                  ))}
                </div>
              )}

              {agent === 'Multi-Agent Hub' && (
                <div className="w-full mt-6 mb-4 max-w-2xl">
                  <h3 className="text-gray-300 text-sm font-medium mb-4 text-center">Select Collaborating Agents</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {Object.keys(AGENT_CONFIGS).filter(a => a !== 'Orqion' && a !== 'Multi-Agent Hub').map(a => (
                      <button
                        key={a}
                        onClick={() => toggleHubSelectedAgent(a as Agent)}
                        className={`px-3 py-1.5 rounded-full text-[12px] transition-all border ${
                          hubSelectedAgents.includes(a as Agent)
                            ? 'bg-brand-500/20 border-brand-500/50 text-brand-400 font-medium'
                            : 'bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-gray-400 hover:border-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {a.replace(' Agent', '')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            (() => {
              const renderAgentResponse = (msgId: string, text: string, msgAgentTheme: any) => {
                return (
                  <div className={`relative mt-2 pl-4 py-2 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:rounded-full before:bg-gradient-to-b ${msgAgentTheme.glow} before:to-transparent animate-in fade-in slide-in-from-left-2 duration-500`}>
                    <div className={`absolute -left-1.5 top-0 w-3 h-3 rounded-full ${msgAgentTheme.iconBg} border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)]`} style={{ boxShadow: `0 0 10px var(--tw-shadow-color)` }}></div>
                    <div className="text-[13.5px] text-gray-200 leading-[1.7] tracking-wide">
                      {formatMarkdown(text, msgAgentTheme)}
                    </div>
                  </div>
                );
              };

              const regex = new RegExp(`\\*\\*(You|[A-Za-z0-9 -]+):\\*\\*([\\s\\S]*?)(?=(?:\\*\\*(?:You|[A-Za-z0-9 -]+):\\*\\*|$))`, 'g');

              const messages: any[] = [];
              let match;
              let idCounter = 0;

              while ((match = regex.exec(displayCode)) !== null) {
                const senderName = match[1];
                const isUser = senderName === 'You';
                let text = match[2].trim();
                
                messages.push({
                  id: `msg-${idCounter++}`,
                  sender: isUser ? 'user' : 'agent',
                  senderName: senderName,
                  text: text
                });
              }

              if (messages.length === 0) {
                return displayCode;
              }

              return (
                <div className="flex flex-col gap-6 pb-2">
                  {messages.map((msg) => {
                    const msgAgentTheme = getAgentTheme(msg.senderName);
                    return (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      {msg.sender === 'user' ? (
                        <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] text-gray-100 px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] text-[13.5px] shadow-sm animate-in fade-in slide-in-from-right-2 duration-300">
                          {msg.text}
                        </div>
                      ) : (
                        <div className="w-full animate-in fade-in duration-300">
                          <div className="flex items-center gap-2 mb-2 px-1">
                            <div className={`w-7 h-7 rounded-lg ${msgAgentTheme.iconBg} border border-white/10 flex items-center justify-center shadow-sm`}>
                              <Bot size={16} className={msgAgentTheme.iconText} />
                            </div>
                            <span className={`text-[11px] font-bold ${msgAgentTheme.text} uppercase tracking-wider`}>{msg.senderName}</span>
                          </div>
                          {renderAgentResponse(msg.id, msg.text, msgAgentTheme)}
                        </div>
                      )}
                    </div>
                  )})}
                  
                  {isRunning && messages[messages.length - 1]?.sender === 'user' && (
                    <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="w-full">
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <div className={`w-7 h-7 rounded-lg ${agentTheme.iconBg} border border-white/10 flex items-center justify-center shadow-sm`}>
                            <Bot size={16} className={agentTheme.iconText} />
                          </div>
                          <span className={`text-[11px] font-bold ${agentTheme.text} uppercase tracking-wider`}>
                            {agent === 'Multi-Agent Hub' ? 'Agents are typing...' : agent}
                          </span>
                        </div>
                        <div className="flex gap-1.5 py-3.5 px-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-2xl rounded-tl-sm w-fit items-center shadow-sm">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>

        {/* Chat Input Area */}
        <div className="p-4 bg-[var(--color-bg-primary)] border-t border-[var(--color-border-primary)] shrink-0 z-10 w-full relative">
          <div className="max-w-4xl mx-auto flex flex-col gap-2">
            <div className="flex items-end bg-[var(--color-bg-secondary)] rounded-xl w-full shadow-sm border border-[var(--color-border-primary)] focus-within:border-brand-500/50 focus-within:ring-1 focus-within:ring-brand-500/50 transition-all overflow-hidden">
              <button className="text-gray-400 hover:text-gray-200 transition-colors flex-shrink-0 p-3 ml-1" title="Attach file">
                <Plus size={18} strokeWidth={2} />
              </button>

              <textarea
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isRunning) {
                    e.preventDefault();
                    if (localQuery.trim()) handleRunAgent(e as any);
                  }
                }}
                placeholder={isRunning ? "Agent is typing..." : `Message ${agent}...`}
                disabled={isRunning}
                rows={1}
                className="flex-1 bg-transparent text-[13.5px] text-gray-200 outline-none placeholder-gray-500 disabled:opacity-50 py-3 resize-none max-h-32 min-h-[44px] custom-scrollbar"
                autoFocus
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                }}
              />

              <button
                onClick={handleRunAgent}
                disabled={isRunning || !localQuery.trim()}
                className={`p-2 m-1.5 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                  isRunning ? 'bg-brand-500/20 text-brand-500' : 
                  !localQuery.trim() ? 'bg-[var(--color-bg-tertiary)] text-gray-500 cursor-not-allowed' :
                  'bg-brand-500 hover:bg-brand-400 text-white shadow-sm'
                }`}
                title="Send message"
              >
                {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />}
              </button>
            </div>
            <div className="text-center text-[10px] text-gray-500">
              AI can make mistakes. Verify important information.
            </div>
          </div>
        </div>
      </div>
      {/* Save Popup */}
      {showSavePopup && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-brand-600 text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Save size={16} />
          <span className="text-sm font-medium">{showSavePopup}</span>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="absolute inset-0 bg-black/60 z-[100] flex items-center justify-center animate-in fade-in duration-200">
          <div 
            className="bg-[#1e1e1e] border border-[var(--color-border-primary)] rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <History size={18} className="text-brand-400" /> Past Conversations
              </h3>
              <button onClick={(e) => { e.stopPropagation(); setShowHistoryModal(false); }} className="text-gray-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-4">
              {pastConversations.filter(c => c.agent === agent).length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No past conversations found for {agent}.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {pastConversations.filter(c => c.agent === agent).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(convo => (
                    <div key={convo.id} className="group relative flex items-center justify-between p-3 rounded-lg border border-[var(--color-border-primary)] hover:border-brand-500/50 bg-[var(--color-bg-secondary)] hover:bg-brand-500/5 cursor-pointer transition-all" onClick={() => {
                      loadPastConversation(agent, convo.id);
                      setShowHistoryModal(false);
                    }}>
                      <div className="flex flex-col flex-1 truncate pr-8">
                        <span className="text-sm font-medium text-gray-200 truncate">{convo.title}</span>
                        <span className="text-[11px] text-gray-500">{new Date(convo.timestamp).toLocaleString()}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deletePastConversation(convo.id); }}
                        className="absolute right-3 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete Conversation"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end pt-2 border-t border-[var(--color-border-primary)]">
              <button
                onClick={(e) => { e.stopPropagation(); setShowHistoryModal(false); }}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
