import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Play, Save, Plus, Mic, AudioLines, X, Maximize2, FileText, Bot, Trash2, Send, Loader2 } from 'lucide-react';
import { useStore, Agent, FileSystemNode } from '@/store/useStore';

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
      .replace(/\*\*(.*?)\*\*/g, `<strong class="font-medium text-gray-100">$1</strong>`)
      .replace(/\*(.*?)\*/g, `<em class="italic text-gray-400">$1</em>`)
      .replace(/`(.*?)`/g, `<code class="bg-black/40 px-1.5 py-0.5 rounded text-[12px] font-mono text-gray-300 border border-white/5">$1</code>`)
      .replace(/\[(.*?)\]\((.*?)\)/g, `<a href="$2" target="_blank" class="${agentTheme.text} hover:underline">$1</a>`);

    if (line.trim().startsWith('- ')) {
      return (
        <div key={i} className="flex gap-3 my-1.5 items-start">
          <span className={`${agentTheme.text} mt-1.5 text-[8px]`}>●</span>
          <span dangerouslySetInnerHTML={{ __html: formatted.substring(2) }} />
        </div>
      );
    }

    const numListMatch = line.match(/^(\d+\.)\s(.*)/);
    if (numListMatch) {
      const remainingFormatted = formatted.replace(/^\d+\.\s/, '');
      return (
        <div key={i} className="flex gap-2 my-1.5 items-start">
          <span className={`${agentTheme.text} font-medium`}>{numListMatch[1]}</span>
          <span dangerouslySetInnerHTML={{ __html: remainingFormatted }} />
        </div>
      );
    }

    if (line.trim() === '') return <div key={i} className="h-1.5"></div>;

    if (line.trim().startsWith('>')) {
      return (
        <div key={i} className={`border-l-2 ${agentTheme.border} pl-3 my-2 text-gray-400 italic bg-black/20 p-2 rounded-r-md`} dangerouslySetInnerHTML={{ __html: formatted.replace(/^>\s?/, '') }}></div>
      );
    }

    return <div key={i} dangerouslySetInnerHTML={{ __html: formatted }} className="my-1" />;
  });
};

export default function ChatInterface({ agent }: ChatInterfaceProps) {
  const { agentScripts, updateAgentScript, removeOpenAgent, activeAgent, setActiveAgent, runningAgents, setAgentRunning, addTerminalLog, userQuery, selectedFolderId, updateNodeContent, fileSystem, createFile, toggleRightSidebar } = useStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
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
- "open_terminal"
- "open_workflow"
`;
      }

      const response = await fetch('http://localhost:8555/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: agent,
          systemPrompt: systemPromptToUse,
          userQuery: localQuery.trim() || userQuery || 'Say hello',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        addTerminalLog(`> <span class="text-accent-red">Error (${agent}):</span> ${errorData.error || 'Failed to connect to agent.'}`);
        setAgentRunning(agent, false);
        return;
      }

      addTerminalLog(`> <span class="text-accent-green">${agent} connected. Task is executing...</span>`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let currentScriptCode = agentScripts[agent] || '';

      const queryToUse = localQuery.trim() || userQuery || 'Say hello';
      currentScriptCode += `\n\n**You:** ${queryToUse}\n`;
      currentScriptCode += `\n**${agent}:**\n\n`;
      updateAgentScript(agent, currentScriptCode);
      setLocalQuery('');

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
             } else if (action.type === 'open_terminal') {
                if (!useStore.getState().isTerminalOpen) useStore.getState().toggleTerminal();
             } else if (action.type === 'open_workflow') {
                if (!useStore.getState().isWorkflowOpen) useStore.getState().toggleWorkflow();
             }
             
             currentScriptCode = currentScriptCode.replace(match[0], '\n> *[Action executed successfully by Orqion]*\n');
             updateAgentScript(agent, currentScriptCode);
          }
        } catch (e) { }
      }

      // Log the conversation to the new API endpoint
      try {
        const fullAgentResponse = currentScriptCode.split(`**${agent}:**\n\n`)[1] || '';
        const logResponse = await fetch('http://localhost:8555/api/log_chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentName: agent,
            userQuery: queryToUse,
            agentResponse: fullAgentResponse.trim()
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
            body: JSON.stringify({ fileName: selectedNode.name, agentName: agent, folderName: findParentFolder(fileSystem, selectedFolderId) || "root" })
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
          body: JSON.stringify({ fileName: handle.name, agentName: agent, folderName })
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
      <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 py-3 text-sm">
        <div className={`flex items-center gap-3 text-white border-b-2 pb-2 -mb-3 transition-colors ${isActive ? 'border-brand-500' : 'border-transparent'}`}>
          <MessageSquare size={16} className={isActive ? 'text-brand-400' : 'text-text-tertiary'} />
          <span className="font-medium">{agent}</span>
          {isActive && <span className="text-xs text-accent-green bg-accent-green/10 px-2 py-0.5 rounded-full ml-1">Active</span>}
        </div>
        <div className="flex items-center gap-3 pb-2 -mb-3">
          <button
            onClick={(e) => { e.stopPropagation(); setShowClearConfirm(true); }}
            className="flex items-center justify-center text-text-tertiary hover:text-accent-red transition-colors cursor-pointer"
            title="Clear Chat"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={handleSave}
            className="flex items-center justify-center text-text-tertiary hover:text-accent-blue transition-colors cursor-pointer"
            title="Save to File System"
          >
            <Save size={14} />
          </button>
          <button
            onClick={handleRunAgent}
            disabled={isRunning}
            className={`flex items-center justify-center transition-colors ${isRunning ? 'text-brand-500 cursor-not-allowed opacity-50' : 'text-text-tertiary hover:text-accent-green cursor-pointer'}`}
            title="Run this agent"
          >
            <Play size={14} fill={isRunning ? "currentColor" : "none"} />
          </button>
          <span
            onClick={(e) => { 
              e.stopPropagation(); 
              if (agent === 'Orqion') {
                toggleRightSidebar();
              } else {
                removeOpenAgent(agent); 
              }
            }}
            className="cursor-pointer text-text-tertiary hover:text-accent-red transition-colors text-lg leading-none"
            title="Close"
          >
            ×
          </span>
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

              {AGENT_CONFIGS[agent]?.prompts && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full w-full">
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
            </div>
          ) : (
            (() => {
              const renderAgentResponse = (msgId: string, text: string) => {
                if (agent === 'Orqion') {
                  return (
                    <div className="text-[14px] text-gray-200 leading-relaxed animate-in fade-in slide-in-from-left-2 duration-300 pl-1">
                      {formatMarkdown(text, agentTheme)}
                    </div>
                  );
                }

                const headingRegex = /^(#{1,6})\s+(.*)$/gm;
                const sections: { title: string, content: string }[] = [];
                let lastIndex = 0;
                let currentTitle = 'Overview';

                let match;
                while ((match = headingRegex.exec(text)) !== null) {
                  if (match.index > lastIndex) {
                    const content = text.substring(lastIndex, match.index).trim();
                    if (content) {
                      sections.push({ title: currentTitle, content });
                    }
                  }
                  currentTitle = match[2].replace(/\*\*/g, '').trim();
                  lastIndex = headingRegex.lastIndex;
                }

                if (lastIndex < text.length) {
                  const content = text.substring(lastIndex).trim();
                  if (content) {
                    sections.push({ title: currentTitle, content });
                  }
                }

                const finalSections = sections.length > 0 ? sections : [{ title: 'Response', content: text }];

                return (
                  <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3 w-full">
                    {finalSections.map((sec, idx) => {
                      const isExpanded = expandedSection?.msgId === msgId && expandedSection?.idx === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (isExpanded) setExpandedSection(null);
                            else setExpandedSection({ msgId, idx });
                          }}
                          className={`group cursor-pointer ${agentTheme.bg} border ${agentTheme.border} ${agentTheme.hoverBorder} ${agentTheme.hoverBg} rounded-lg transition-all relative overflow-hidden ${isExpanded ? 'col-span-1 2xl:col-span-2 shadow-md' : ''}`}
                        >
                          <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${agentTheme.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                          <div className="px-4 py-3 flex items-center justify-between relative z-10">
                            <h3 className={`text-sm font-medium transition-colors pr-2 ${isExpanded ? agentTheme.text : 'text-gray-200 group-hover:text-white truncate'}`}>
                              {sec.title}
                            </h3>
                            <Maximize2 size={14} className={`text-gray-500 transition-transform shrink-0 duration-300 ${isExpanded ? `rotate-180 ${agentTheme.text}` : `opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 ${agentTheme.text}`}`} />
                          </div>

                          {isExpanded && (
                            <div className="px-4 pb-4 text-[13.5px] text-gray-300 leading-relaxed border-t border-[#333333] pt-3 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                              {formatMarkdown(sec.content, agentTheme)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              };

              const tokenUser = '**You:**';
              const tokenAgent = `**${agent}:**`;
              const regex = new RegExp(`(${escapeRegExp(tokenUser)}|${escapeRegExp(tokenAgent)})([\\s\\S]*?)(?=(?:${escapeRegExp(tokenUser)}|${escapeRegExp(tokenAgent)}|$))`, 'g');

              const messages: any[] = [];
              let match;
              let idCounter = 0;

              while ((match = regex.exec(displayCode)) !== null) {
                const isUser = match[1] === tokenUser;
                let text = match[2].trim();
                
                // Remove duplicate agent name if the LLM accidentally generates it
                if (!isUser) {
                  const agentPrefixMatch = text.match(new RegExp(`^\\*\\*${escapeRegExp(agent)}:\\*\\*\\s*`, 'i'));
                  if (agentPrefixMatch) {
                    text = text.substring(agentPrefixMatch[0].length).trim();
                  }
                }

                messages.push({
                  id: `msg-${idCounter++}`,
                  sender: isUser ? 'user' : 'agent',
                  text: text
                });
              }

              if (messages.length === 0) {
                return displayCode;
              }

              return (
                <div className="flex flex-col gap-6 pb-2">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      {msg.sender === 'user' ? (
                        <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] text-gray-100 px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] text-[13.5px] shadow-sm animate-in fade-in slide-in-from-right-2 duration-300">
                          {msg.text}
                        </div>
                      ) : (
                        <div className="w-full animate-in fade-in duration-300">
                          <div className="flex items-center gap-2 mb-2 px-1">
                            <div className={`w-7 h-7 rounded-lg ${agentTheme.iconBg} border border-white/10 flex items-center justify-center shadow-sm`}>
                              <Bot size={16} className={agentTheme.iconText} />
                            </div>
                            <span className={`text-[11px] font-bold ${agentTheme.text} uppercase tracking-wider`}>{agent}</span>
                          </div>
                          {renderAgentResponse(msg.id, msg.text)}
                        </div>
                      )}
                    </div>
                  ))}
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

      {/* Clear Confirm Modal */}
      {showClearConfirm && (
        <div className="absolute inset-0 bg-black/60 z-[100] flex items-center justify-center animate-in fade-in duration-200">
          <div 
            className="bg-[#1e1e1e] border border-[var(--color-border-primary)] rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-white mb-2">Clear Chat?</h3>
            <p className="text-gray-400 text-sm mb-6">
              Are you sure you want to clear this chat? Unsaved progress will be lost and cannot be recovered.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); setShowClearConfirm(false); }}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateAgentScript(agent, `# ${agent} Script\n\n# Write your ${agent.toLowerCase()} prompt here...\n`);
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 text-sm bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-500/20 hover:border-red-500"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
