import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Play, Save, Plus, Mic, AudioLines, X, Maximize2, FileText, Bot, Trash2 } from 'lucide-react';
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
  const { agentScripts, updateAgentScript, removeOpenAgent, activeAgent, setActiveAgent, runningAgents, setAgentRunning, addTerminalLog, userQuery, selectedFolderId, updateNodeContent, fileSystem } = useStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const code = agentScripts[agent] || '';
  const isRunning = runningAgents[agent];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [localQuery, setLocalQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<{ msgId: string, idx: number } | null>(null);
  const agentTheme = getAgentTheme(agent);

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

      const response = await fetch('http://localhost:8555/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: agent,
          systemPrompt: (agentScripts[agent] || 'You are a helpful AI assistant.') + autoWorkflowPrompt,
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
        } catch (e) { }
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
      addTerminalLog(`> <span class="text-accent-green">Success:</span> Saved ${agent} response to local file system.`);

      setShowSavePopup(`Saved to local file system`);
      setTimeout(() => setShowSavePopup(null), 3000);
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
            onClick={(e) => { e.stopPropagation(); removeOpenAgent(agent); }}
            className="cursor-pointer text-text-tertiary hover:text-accent-red transition-colors text-lg leading-none"
            title="Close"
          >
            ×
          </span>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 text-gray-300 font-sans text-sm whitespace-pre-wrap break-words custom-scrollbar"
        style={{ fontFamily: "Inter, sans-serif", lineHeight: 1.6 }}
      >
        {(() => {
          const initialText = `# ${agent} Script\n\n# Write your ${agent.toLowerCase()} prompt here...\n`;
          const isLegacyInitialState = code.trim().startsWith('#') && !code.includes('**You:**') && !code.includes(`**${agent}:**`);
          const isInitialState = code.trim() === '' || isLegacyInitialState;

          let displayCode = code;
          if (isLegacyInitialState) {
            displayCode = '';
          } else if (code.startsWith(initialText)) {
            displayCode = code.substring(initialText.length).trimStart();
          }

          if (isInitialState || !displayCode) {
            return (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-brand-500/20 rounded-full flex items-center justify-center mb-4 ring-4 ring-brand-500/10">
                  <MessageSquare size={32} className="text-brand-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to {agent}</h2>
                <p className="text-gray-400 max-w-md text-sm mb-8">
                  {AGENT_CONFIGS[agent]?.description || "I'm your specialized assistant. How can I help you with your tasks today?"}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg text-left">
                  {(AGENT_CONFIGS[agent]?.prompts || [
                    "Can you explain your capabilities?",
                    "Help me brainstorm some ideas",
                    "Review the current workflow",
                    "What's the status of my project?"
                  ]).map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => setLocalQuery(prompt)}
                      className="p-3 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] hover:border-brand-500/50 hover:bg-brand-500/5 transition-all text-xs text-gray-300 flex items-center gap-2 group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500/50 group-hover:bg-brand-500 group-hover:scale-125 transition-all"></span>
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            );
          }

          const renderAgentResponse = (msgId: string, text: string) => {
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                {finalSections.map((sec, idx) => {
                  const isExpanded = expandedSection?.msgId === msgId && expandedSection?.idx === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (isExpanded) setExpandedSection(null);
                        else setExpandedSection({ msgId, idx });
                      }}
                      className={`group cursor-pointer ${agentTheme.bg} border ${agentTheme.border} ${agentTheme.hoverBorder} ${agentTheme.hoverBg} rounded-lg transition-all relative overflow-hidden ${isExpanded ? 'col-span-1 md:col-span-2 shadow-lg' : ''}`}
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
            messages.push({
              id: `msg-${idCounter++}`,
              sender: isUser ? 'user' : 'agent',
              text: match[2].trim()
            });
          }

          if (messages.length === 0) {
            return displayCode;
          }

          return (
            <div className="flex flex-col gap-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.sender === 'user' ? (
                    <div className="bg-brand-500/20 border border-brand-500/30 text-brand-100 px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] text-[13.5px] shadow-sm">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="w-full">
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <div className={`w-7 h-7 rounded-lg ${agentTheme.iconBg} border border-white/5 flex items-center justify-center shadow-sm`}>
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
        })()}
      </div>

      {/* Chat Input Bar */}
      <div className="p-4 bg-[#1e1e1e] border-t border-[var(--color-border-primary)]">
        <div className="flex items-center bg-[#2a2a2a] rounded-full px-4 py-2 w-full gap-3 shadow-inner border border-white/5">
          <button className="text-gray-400 hover:text-white transition-colors flex-shrink-0">
            <Plus size={22} strokeWidth={1.5} />
          </button>

          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isRunning) {
                handleRunAgent(e as any);
              }
            }}
            placeholder="Ask anything"
            className="flex-1 bg-transparent text-gray-100 text-sm py-1.5 placeholder-gray-400 focus:outline-none"
          />

          <button className="text-gray-400 hover:text-white transition-colors flex-shrink-0">
            <Mic size={18} strokeWidth={1.5} />
          </button>

          <button
            onClick={handleRunAgent}
            disabled={isRunning || !localQuery.trim()}
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isRunning || !localQuery.trim() ? 'bg-[#3a3a3a] text-gray-500 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200 cursor-pointer'}`}
            title="Send message"
          >
            <AudioLines size={18} strokeWidth={2.5} />
          </button>
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
