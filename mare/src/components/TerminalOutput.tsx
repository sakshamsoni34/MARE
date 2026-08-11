import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Plus, ChevronDown, AtSign, Columns, Trash2, MoreHorizontal, Maximize, X } from 'lucide-react';
import { useStore } from '@/store/useStore';

const TABS = ['Problems', 'Output', 'Terminal', 'Ports', 'Query Results'];

export default function TerminalOutput() {
  const { terminalLogs, runningAgents, toggleTerminal, clearTerminalLogs, addTerminalLog, activeAgent, activeProject, openAgents, userQuery } = useStore();
  const [activeTab, setActiveTab] = useState('Terminal');
  const [isMaximized, setIsMaximized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const isAnyAgentRunning = Object.values(runningAgents || {}).some(Boolean);

  useEffect(() => {
    if (activeTab === 'Terminal') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs, activeTab, isMaximized]);

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
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-white/5 cursor-pointer transition-colors" title="Select Default Profile">
            <Terminal size={14} className="text-brand-400" />
            <span className="text-xs">powershell</span>
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
                className="flex-1 bg-transparent outline-none text-white placeholder:text-text-tertiary/50"
                spellCheck={false}
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = e.currentTarget.value.trim();
                    if (val.toLowerCase() === 'clear') {
                      clearTerminalLogs();
                    } else if (val !== '') {
                      addTerminalLog(`Command not found: ${val}`);
                    }
                    e.currentTarget.value = '';
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
                <span>✓</span> No problems detected in project '{activeProject}'.
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
                  <td className="py-1">8000</td>
                  <td className="py-1">Agent API Service</td>
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
                <div className="bg-white/5 p-2 rounded border border-white/10 italic text-brand-400">"{userQuery}"</div>
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
