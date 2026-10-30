import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Plus, ChevronDown, AtSign, Columns, Trash2, MoreHorizontal, Maximize, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { executeCodeApi, executeWorkflowApi } from '@/lib/api';

const TABS = ['Problems', 'Output', 'Terminal', 'Ports', 'Query Results'];

export default function TerminalOutput() {
  const { 
    terminalLogs, 
    runningAgents, 
    toggleTerminal, 
    clearTerminalLogs, 
    addTerminalLog, 
    activeProject, 
    openAgents, 
    userQuery 
  } = useStore();
  
  const [activeTab, setActiveTab] = useState('Terminal');
  const [isMaximized, setIsMaximized] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const isAnyAgentRunning = Object.values(runningAgents || {}).some(Boolean);

  useEffect(() => {
    if (activeTab === 'Terminal') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs, activeTab, isMaximized]);

  const handleCommand = async (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    // Record in history
    setCommandHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);

    // Echo input
    addTerminalLog(`<span class="text-white font-bold">$ ${trimmed}</span>`);

    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ').trim();

    switch (cmd) {
      case 'clear':
        clearTerminalLogs();
        break;

      case 'help':
        addTerminalLog(`
<div class="text-xs text-gray-300 space-y-1 my-1">
  <div class="text-brand-400 font-semibold mb-1">MARE Interactive Shell Commands:</div>
  <div><span class="text-emerald-400 font-mono">python &lt;code|filename&gt;</span> - Execute Python in AST Sandbox</div>
  <div><span class="text-emerald-400 font-mono">ls</span> - List files in current project workspace</div>
  <div><span class="text-emerald-400 font-mono">cat &lt;filename&gt;</span> - Display content of a file</div>
  <div><span class="text-emerald-400 font-mono">workflow run</span> - Execute the active agent workflow DAG</div>
  <div><span class="text-emerald-400 font-mono">run &lt;agent_name&gt;</span> - Open and run a multi-agent persona</div>
  <div><span class="text-emerald-400 font-mono">status</span> - Display active project, running agents & telemetry</div>
  <div><span class="text-emerald-400 font-mono">audit</span> - Inspect backend security auditor & threat logs</div>
  <div><span class="text-emerald-400 font-mono">clear</span> - Clear terminal logs</div>
</div>`);
        break;

      case 'ls': {
        const { fileSystem } = useStore.getState();
        if (!fileSystem || fileSystem.length === 0) {
          addTerminalLog('<span class="text-gray-400">Workspace is empty. Create a file or folder in Explorer.</span>');
        } else {
          const listItems = fileSystem.map(item => 
            item.type === 'folder' 
              ? `<span class="text-blue-400 font-semibold">📁 ${item.name}/</span>`
              : `<span class="text-emerald-300">📄 ${item.name}</span>`
          ).join('&nbsp;&nbsp;&nbsp;&nbsp;');
          addTerminalLog(`<div>${listItems}</div>`);
        }
        break;
      }

      case 'cat': {
        if (!args) {
          addTerminalLog('<span class="text-yellow-400">Usage: cat &lt;filename&gt;</span>');
          break;
        }
        const { fileSystem } = useStore.getState();
        const findFile = (nodes: any[], name: string): any => {
          for (const n of nodes) {
            if (n.name.toLowerCase() === name.toLowerCase()) return n;
            if (n.children) {
              const found = findFile(n.children, name);
              if (found) return found;
            }
          }
          return null;
        };
        const file = findFile(fileSystem, args);
        if (file) {
          const escaped = (file.content || '[empty file]').replace(/\n/g, '<br/>').replace(/ /g, '&nbsp;');
          addTerminalLog(`<div class="text-gray-300 font-mono text-xs pl-2 border-l border-white/20 my-1">${escaped}</div>`);
        } else {
          addTerminalLog(`<span class="text-red-400">cat: ${args}: No such file</span>`);
        }
        break;
      }

      case 'python':
      case 'python3': {
        if (!args) {
          addTerminalLog('<span class="text-yellow-400">Usage: python &lt;filename.py | print(\'hello\')&gt;</span>');
          break;
        }
        const { fileSystem } = useStore.getState();
        const findFile = (nodes: any[], name: string): any => {
          for (const n of nodes) {
            if (n.name.toLowerCase() === name.toLowerCase()) return n;
            if (n.children) {
              const found = findFile(n.children, name);
              if (found) return found;
            }
          }
          return null;
        };
        const matchedFile = findFile(fileSystem, args);
        const codeToRun = matchedFile ? (matchedFile.content || '') : args;

        addTerminalLog(`<span class="text-yellow-400">Executing Python code in AST Sandbox...</span>`);
        try {
          const res = await executeCodeApi(codeToRun, 'python', 10);
          if (res.status === 'success') {
            addTerminalLog(`<span class="text-accent-green">✓ Finished in ${res.duration_ms}ms (exit code: ${res.returncode})</span>`);
            if (res.stdout) {
              const outEscaped = res.stdout.replace(/\n/g, '<br/>').replace(/ /g, '&nbsp;');
              addTerminalLog(`<div class="text-emerald-300 font-mono text-xs pl-2 border-l-2 border-emerald-500/50">${outEscaped}</div>`);
            }
            if (res.stderr) {
              const errEscaped = res.stderr.replace(/\n/g, '<br/>').replace(/ /g, '&nbsp;');
              addTerminalLog(`<div class="text-amber-400 font-mono text-xs pl-2 border-l-2 border-amber-500/50">${errEscaped}</div>`);
            }
            if (!res.stdout && !res.stderr) {
              addTerminalLog(`<span class="text-gray-400 font-mono text-xs">[Process finished with no output]</span>`);
            }
          } else {
            addTerminalLog(`<span class="text-accent-red">Security / Execution Error:</span> ${res.stderr || 'Execution failed'}`);
          }
        } catch (err: any) {
          addTerminalLog(`<span class="text-accent-red">Error: ${err.message}</span>`);
        }
        break;
      }

      case 'workflow': {
        if (args === 'run') {
          const { workflowNodes, workflowEdges, activeProject } = useStore.getState();
          if (workflowNodes.length === 0) {
            addTerminalLog('<span class="text-yellow-400">Workflow Error: No nodes in workflow.</span>');
            break;
          }
          addTerminalLog(`<span class="text-brand-400">Executing Workflow (${workflowNodes.length} nodes)...</span>`);
          try {
            const res = await executeWorkflowApi({
              project_name: activeProject || 'default',
              nodes: workflowNodes,
              edges: workflowEdges
            });
            if (res.status === 'success') {
              for (const step of res.steps) {
                addTerminalLog(`<span class="text-emerald-400">✓ [${step.label}]:</span> ${step.output} <span class="text-gray-400">(${step.duration_ms}ms)</span>`);
              }
              addTerminalLog(`<span class="text-accent-green">Workflow complete: ${res.executed_nodes_count} nodes executed in ${res.total_duration_ms}ms.</span>`);
            } else {
              addTerminalLog('<span class="text-red-400">Workflow execution failed.</span>');
            }
          } catch (e: any) {
            addTerminalLog(`<span class="text-red-400">Workflow execution error: ${e.message}</span>`);
          }
        } else {
          addTerminalLog('<span class="text-yellow-400">Usage: workflow run</span>');
        }
        break;
      }

      case 'status': {
        const { activeProject: proj, openAgents: agents, runningAgents: running } = useStore.getState();
        const runningList = Object.keys(running).filter(k => running[k]);
        addTerminalLog(`
<div class="text-xs text-gray-300 space-y-1 my-1">
  <div><span class="text-brand-400 font-semibold">Active Project:</span> ${proj || 'None'}</div>
  <div><span class="text-brand-400 font-semibold">Open Agents:</span> ${agents.length > 0 ? agents.join(', ') : 'None'}</div>
  <div><span class="text-brand-400 font-semibold">Running:</span> ${runningList.length > 0 ? runningList.join(', ') : 'None'}</div>
</div>`);
        break;
      }

      case 'audit': {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8555';
        try {
          const res = await fetch(`${apiUrl}/api/security/audit`);
          const data = await res.json();
          addTerminalLog(`
<div class="text-xs text-gray-300 space-y-1 my-1">
  <div class="text-brand-400 font-semibold">Security Telemetry Status: ${data.status}</div>
  <div>Total Threats Blocked: <span class="text-emerald-400">${data.threat_counters?.total_threats_blocked || 0}</span></div>
  <div>Total Events Logged: ${data.total_events_logged || 0}</div>
</div>`);
        } catch (err: any) {
          addTerminalLog(`<span class="text-red-400">Failed to fetch security audit: ${err.message}</span>`);
        }
        break;
      }

      case 'run': {
        if (!args) {
          addTerminalLog('<span class="text-yellow-400">Usage: run &lt;agent_name&gt; (e.g. run Researcher Agent)</span>');
          break;
        }
        useStore.getState().addOpenAgent(args as any);
        addTerminalLog(`<span class="text-emerald-400">Opened agent workspace for: ${args}</span>`);
        break;
      }

      default:
        addTerminalLog(`Command not found: <span class="text-red-400">${cmd}</span>. Type <span class="text-emerald-400 font-mono">help</span> for available commands.`);
        break;
    }
  };

  return (
    <div className={`${isMaximized ? 'fixed inset-4 z-50 h-auto' : 'h-64'} shrink-0 flex flex-col rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-panel)] overflow-hidden shadow-lg transition-all duration-200`}>
      <div className="flex flex-wrap md:flex-nowrap items-center justify-between border-b border-[var(--color-border-primary)] bg-[#1e1e1e] px-4 py-2 select-none gap-2">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar w-full md:w-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-medium uppercase tracking-wider transition-colors whitespace-nowrap ${
                activeTab === tab 
                  ? 'text-white border-b border-brand-400 pb-1 -mb-1' 
                  : 'text-text-tertiary hover:text-text-secondary pb-1 -mb-1 border-b border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-text-tertiary ml-auto shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-white/5 cursor-pointer transition-colors" title="Default Shell Profile">
            <Terminal size={14} className="text-brand-400" />
            <span className="text-xs">ast-sandbox</span>
          </div>
          <div className="hidden sm:flex items-center gap-0.5 cursor-pointer hover:bg-white/5 rounded px-1 transition-colors" title="New Terminal">
            <Plus size={14} />
            <ChevronDown size={12} />
          </div>
          <div className="hidden sm:flex items-center justify-center p-0.5 cursor-pointer hover:text-white transition-colors" title="Toggle Developer Tools">
            <AtSign size={14} />
          </div>
          <div className="hidden md:flex items-center justify-center p-0.5 cursor-pointer hover:text-white transition-colors" title="Split Terminal">
            <Columns size={14} />
          </div>
          <div className="flex items-center justify-center p-0.5 cursor-pointer hover:text-white transition-colors" title="Clear Terminal" onClick={clearTerminalLogs}>
            <Trash2 size={14} />
          </div>
          <div className="hidden sm:flex items-center justify-center p-0.5 cursor-pointer hover:text-white transition-colors" title="More Actions">
            <MoreHorizontal size={14} />
          </div>
          <div className="w-px h-4 bg-white/10 mx-1"></div>
          <div className="flex items-center justify-center p-0.5 cursor-pointer hover:text-white transition-colors" title={isMaximized ? "Restore Terminal Size" : "Maximize Terminal Size"} onClick={() => setIsMaximized(!isMaximized)}>
            <Maximize size={14} />
          </div>
          <div className="flex items-center justify-center p-0.5 cursor-pointer hover:text-white transition-colors" title="Close Panel" onClick={toggleTerminal}>
            <X size={14} />
          </div>
        </div>
      </div>
      <div className="flex-1 p-4 font-mono text-sm leading-relaxed text-text-secondary overflow-y-auto bg-black/20" onClick={() => activeTab === 'Terminal' && document.getElementById('terminal-input')?.focus()}>
        {activeTab === 'Terminal' && (
          <>
            {terminalLogs.map((log, index) => (
              <div key={index} className="mt-1 flex">
                <span className="text-brand-400 mr-2 shrink-0">{'>'}</span>
                <span className="break-all" dangerouslySetInnerHTML={{ __html: log }} />
              </div>
            ))}
            {isAnyAgentRunning && (
              <div className="mt-1 animate-pulse flex">
                <span className="text-brand-400 mr-2 shrink-0">{'>'}</span>
                <span className="text-text-tertiary">_</span>
              </div>
            )}
            <div className="mt-1 flex items-center">
              <span className="text-brand-400 mr-2 shrink-0">{'>'}</span>
              <input 
                id="terminal-input"
                type="text" 
                className="flex-1 bg-transparent outline-none text-white placeholder:text-text-tertiary/50 font-mono"
                placeholder="Type 'help' for interactive sandbox commands..."
                spellCheck={false}
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = e.currentTarget.value;
                    handleCommand(val);
                    e.currentTarget.value = '';
                  } else if (e.key === 'ArrowUp') {
                    if (commandHistory.length > 0) {
                      const nextIdx = historyIndex + 1 < commandHistory.length ? historyIndex + 1 : historyIndex;
                      setHistoryIndex(nextIdx);
                      e.currentTarget.value = commandHistory[commandHistory.length - 1 - nextIdx] || '';
                    }
                  } else if (e.key === 'ArrowDown') {
                    if (historyIndex > 0) {
                      const nextIdx = historyIndex - 1;
                      setHistoryIndex(nextIdx);
                      e.currentTarget.value = commandHistory[commandHistory.length - 1 - nextIdx] || '';
                    } else {
                      setHistoryIndex(-1);
                      e.currentTarget.value = '';
                    }
                  }
                }}
              />
            </div>
            <div ref={bottomRef} />
          </>
        )}

        {activeTab === 'Output' && (
          <div className="text-text-secondary">
            {activeProject ? (
              <>
                <div className="mb-2 text-brand-400">MARE Project: {activeProject}</div>
                {openAgents.length === 0 ? (
                  <div>No agents are currently active in this project.</div>
                ) : (
                  <div>
                    <div className="mb-1 text-white">Active Agents:</div>
                    {openAgents.map(agent => (
                      <div key={agent} className="flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${runningAgents[agent] ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
                        <span>{agent} {runningAgents[agent] ? '(Running)' : '(Idle)'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div>No MARE project is active. Create or select a project to view output.</div>
            )}
          </div>
        )}

        {activeTab === 'Problems' && (
          <div className="text-text-secondary">
            {activeProject ? (
              <div className="flex items-center gap-2 text-green-400">
                <span>✓</span> No problems detected in project &apos;{activeProject}&apos;.
              </div>
            ) : (
              <div className="text-yellow-500">
                ⚠ No active project. Please initialize a project first.
              </div>
            )}
          </div>
        )}

        {activeTab === 'Ports' && (
          <div className="text-text-secondary">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-1 font-medium text-white">Port</th>
                  <th className="py-1 font-medium text-white">Process</th>
                  <th className="py-1 font-medium text-white">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="py-1">3000</td>
                  <td className="py-1">MARE Dashboard UI</td>
                  <td className="py-1 text-green-400">Active</td>
                </tr>
                <tr>
                  <td className="py-1">8555</td>
                  <td className="py-1">FastAPI Backend & Sandbox Engine</td>
                  <td className="py-1 text-green-400">Active</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Query Results' && (
          <div className="text-text-secondary">
            {userQuery ? (
              <>
                <div className="mb-2 text-white">Latest Query:</div>
                <div className="bg-white/5 p-2 rounded border border-white/10 italic text-brand-400">&quot;{userQuery}&quot;</div>
              </>
            ) : (
              <div>No queries have been made yet in this session.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
