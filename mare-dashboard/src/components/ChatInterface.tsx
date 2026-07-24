import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Play, Save, Plus, Mic, AudioLines } from 'lucide-react';
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

export default function ChatInterface({ agent }: ChatInterfaceProps) {
  const { agentScripts, updateAgentScript, removeOpenAgent, activeAgent, setActiveAgent, runningAgents, setAgentRunning, addTerminalLog, userQuery, selectedFolderId, updateNodeContent, fileSystem } = useStore();
  const code = agentScripts[agent] || '';
  const isRunning = runningAgents[agent];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [localQuery, setLocalQuery] = useState('');

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
      const response = await fetch('http://localhost:8555/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: agent,
          systemPrompt: agentScripts[agent] || 'You are a helpful AI assistant.',
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
        } catch (e) {}
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
      className={`flex flex-1 flex-col rounded-xl border bg-[#1e1e1e] overflow-hidden shadow-lg mx-1 min-w-[300px] transition-all ${isActive ? 'border-brand-500/50 ring-1 ring-brand-500/20' : 'border-[var(--color-border-primary)] opacity-90'}`}
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
        className="flex-1 overflow-y-auto p-4 text-gray-300 font-sans text-sm whitespace-pre-wrap break-words"
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

          return displayCode;
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
    </div>
  );
}
