import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Plus, ChevronDown, AtSign, Columns, Trash2, MoreHorizontal, Maximize, X } from 'lucide-react';
import { useStore } from '@/store/useStore';

const TABS = ['Problems', 'Output', 'Terminal', 'Ports', 'Query Results'];

export default function TerminalOutput() {
  const { terminalLogs, runningAgents, toggleTerminal, clearTerminalLogs, addTerminalLog } = useStore();
  const [activeTab, setActiveTab] = useState('Terminal');
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const isAnyAgentRunning = Object.values(runningAgents || {}).some(Boolean);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  return (
    <div className="h-64 shrink-0 flex flex-col rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-panel)] overflow-hidden shadow-lg">
      <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] bg-[#1e1e1e] px-4 py-2 select-none">
        <div className="flex items-center gap-6">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-medium uppercase tracking-wider transition-colors ${
                activeTab === tab 
                  ? 'text-white border-b border-brand-400 pb-1 -mb-1' 
                  : 'text-text-tertiary hover:text-text-secondary pb-1 -mb-1 border-b border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-text-tertiary">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-white/5 cursor-pointer">
            <Terminal size={14} className="text-brand-400" />
            <span className="text-xs">powershell</span>
          </div>
          <div className="flex items-center gap-0.5 cursor-pointer hover:bg-white/5 rounded px-1">
            <Plus size={14} />
            <ChevronDown size={12} />
          </div>
          <AtSign size={14} className="cursor-pointer hover:text-white transition-colors" />
          <Columns size={14} className="cursor-pointer hover:text-white transition-colors" />
          <Trash2 
            size={14} 
            className="cursor-pointer hover:text-white transition-colors" 
            onClick={clearTerminalLogs}
          />
          <MoreHorizontal size={14} className="cursor-pointer hover:text-white transition-colors" />
          <div className="w-px h-4 bg-white/10 mx-1"></div>
          <Maximize size={14} className="cursor-pointer hover:text-white transition-colors" />
          <X 
            size={14} 
            className="cursor-pointer hover:text-white transition-colors" 
            onClick={toggleTerminal} 
          />
        </div>
      </div>
      <div className="flex-1 p-4 font-mono text-sm leading-relaxed text-text-secondary overflow-y-auto bg-black/20" onClick={() => document.getElementById('terminal-input')?.focus()}>
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
      </div>
    </div>
  );
}
