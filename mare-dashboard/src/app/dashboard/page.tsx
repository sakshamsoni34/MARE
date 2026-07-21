'use client';

import React, { useEffect } from 'react';
import { Play, Bell, Search, Activity, Cpu } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import PropertiesPanel from '@/components/PropertiesPanel';
import TerminalOutput from '@/components/TerminalOutput';
import CodeEditor from '@/components/CodeEditor';
import WorkflowVisualizer from '@/components/WorkflowVisualizer';
import MenuBar from '@/components/MenuBar';
import { useStore } from '@/store/useStore';

export default function Dashboard() {
  const { isRunning, setIsRunning, addTerminalLog, clearTerminalLogs, isTerminalOpen } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === '`' || e.key === '~')) {
        e.preventDefault();
        useStore.getState().toggleTerminal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStartResearch = () => {
    if (isRunning) return;
    
    setIsRunning(true);
    clearTerminalLogs();
    addTerminalLog('> Status: <span class="text-accent-yellow">INITIALIZING WORKFLOW...</span>');
    
    setTimeout(() => {
      addTerminalLog('> <span class="text-text-secondary">Multi-Agent log:</span> Researcher Agent connected to remote sources.');
    }, 1500);

    setTimeout(() => {
      addTerminalLog('> <span class="text-text-secondary">Multi-Agent log:</span> Coder Agent active on codebase [mare_dashboard_v1]...');
    }, 3000);

    setTimeout(() => {
      addTerminalLog('> <span class="text-accent-yellow">Warning:</span> Rate limit approaching for node "Data Enrichment"');
    }, 4500);
    
    setTimeout(() => {
      addTerminalLog('> Status: <span class="text-accent-green">OPERATING NORMALLY</span>');
      setIsRunning(false);
    }, 6000);
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden text-base bg-[var(--color-bg-primary)]">
      <MenuBar onNewFile={() => {}} onNewFolder={() => {}} />
      {/* Top Navigation Bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/20 text-brand-400">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight text-white tracking-wide">MARE</h1>
            <p className="text-xs text-text-tertiary">Multi-Agent Research Engine</p>
          </div>
        </div>
        
        <div className="flex w-full max-w-xl items-center gap-3 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] px-4 py-2.5 mx-6 shadow-inner transition-colors focus-within:border-brand-500/50">
          <Search size={18} className="text-text-tertiary" />
          <input 
            type="text" 
            placeholder="Configure and launch your multi-agent workflow..." 
            className="w-full bg-transparent text-sm outline-none placeholder:text-text-tertiary text-text-primary"
          />
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={handleStartResearch}
            disabled={isRunning}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white shadow-md transition-all ${
              isRunning ? 'bg-brand-500/50 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-500 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
            }`}
          >
            <Play size={16} fill="currentColor" />
            {isRunning ? 'Running...' : 'Start Research'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        {/* Center Area (Editor + Terminal) */}
        <main className="flex flex-1 flex-col overflow-hidden bg-[var(--color-bg-primary)] p-4 gap-4">
          <div className="flex flex-1 gap-4 min-h-[50%]">
            <CodeEditor />
            <WorkflowVisualizer />
          </div>
          {isTerminalOpen && <TerminalOutput />}
        </main>

        <PropertiesPanel />
      </div>

      {/* Bottom Status Bar */}
      <footer className="flex h-10 shrink-0 items-center justify-between border-t border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-6 text-xs font-medium text-text-tertiary">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span>Tokens Used:</span>
            <span className="text-white bg-[var(--color-bg-tertiary)] px-2 py-0.5 rounded font-mono">2.45M</span>
          </div>
          <div className="flex items-center gap-2">
            <span>System Health:</span>
            <span className="text-accent-green flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-accent-green shadow-[0_0_8px_var(--color-accent-green)]"></div>
              {isRunning ? 'Processing...' : 'Excellent'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-text-secondary" />
            <span>CPU:</span>
            <span className="text-white w-8 text-right font-mono">{isRunning ? '78%' : '34%'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-text-secondary" />
            <span>Memory:</span>
            <span className="text-white w-8 text-right font-mono">{isRunning ? '82%' : '63%'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
