'use client';

import React, { useEffect, useState } from 'react';
import { Play, Bell, Search, Activity, Cpu, Network } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import PropertiesPanel from '@/components/PropertiesPanel';
import TerminalOutput from '@/components/TerminalOutput';
import CodeEditor from '@/components/CodeEditor';
import WorkflowVisualizer from '@/components/WorkflowVisualizer';
import MenuBar from '@/components/MenuBar';
import { useStore } from '@/store/useStore';

export default function Dashboard() {
  const { runningAgents, setAgentRunning, addTerminalLog, updateLastTerminalLog, clearTerminalLogs, isTerminalOpen, activeAgent, editorCode, updateAgentScript, isWorkflowOpen, toggleWorkflow, userQuery, setUserQuery } = useStore();
  const [workflowWidth, setWorkflowWidth] = useState(500);

  const currentAgent = activeAgent || 'Researcher Agent';
  const isCurrentAgentRunning = runningAgents[currentAgent] || false;
  const isAnyAgentRunning = Object.values(runningAgents).some(Boolean);

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

  const handleStartResearch = async () => {
    const agentToRun = currentAgent;
    if (runningAgents[agentToRun]) return;
    
    setAgentRunning(agentToRun, true);
    clearTerminalLogs();
    
    if (!isTerminalOpen) {
      useStore.getState().toggleTerminal();
    }
    
    addTerminalLog(`> Status: <span class="text-accent-yellow">INITIALIZING ${agentToRun.toUpperCase()}...</span>`);
    
    try {
      const response = await fetch('http://localhost:8555/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentName: agentToRun,
          systemPrompt: useStore.getState().agentScripts[agentToRun] || 'You are a helpful AI assistant.',
          userQuery: userQuery || 'Say hello',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        addTerminalLog(`> <span class="text-accent-red">Error:</span> ${errorData.error || 'Failed to connect to agent.'}`);
        setAgentRunning(agentToRun, false);
        return;
      }

      addTerminalLog(`> <span class="text-accent-green">${agentToRun} connected. Task is executing...</span>`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      let currentScriptCode = useStore.getState().agentScripts[agentToRun] || '';
      currentScriptCode += `\n\n# --- ${agentToRun} Response ---\n\n`;
      useStore.getState().updateAgentScript(agentToRun, currentScriptCode);
      
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
                  useStore.getState().updateAgentScript(agentToRun, currentScriptCode);
                }
              } catch (e) {
                // ignore parse errors for partial lines
              }
            }
          }
        }
      }
      
      addTerminalLog(`> Status: <span class="text-accent-green">${agentToRun.toUpperCase()} TASK COMPLETED</span>`);
    } catch (error: any) {
      addTerminalLog(`> <span class="text-accent-red">Error:</span> ${error.message}`);
    } finally {
      setAgentRunning(agentToRun, false);
    }
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
            placeholder="Enter your query here..." 
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isCurrentAgentRunning) {
                handleStartResearch();
              }
            }}
            className="w-full bg-transparent text-sm outline-none placeholder:text-text-tertiary text-text-primary"
          />
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={toggleWorkflow}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              isWorkflowOpen ? 'bg-brand-500/20 text-brand-400 border border-brand-500/50 shadow-inner' : 'bg-transparent text-text-secondary hover:bg-[var(--color-bg-panel)] hover:text-white border border-transparent'
            }`}
          >
            <Network size={16} />
            Workflow Config
          </button>
          <button 
            onClick={handleStartResearch}
            disabled={isCurrentAgentRunning}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white shadow-md transition-all ${
              isCurrentAgentRunning ? 'bg-brand-500/50 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-500 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
            }`}
          >
            <Play size={16} fill="currentColor" />
            {isCurrentAgentRunning ? 'Running...' : 'Start Research'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        {/* Center Area (Editor + Terminal) */}
        <main className="flex flex-1 flex-col overflow-hidden bg-[var(--color-bg-primary)] p-4 gap-4">
          <div className="flex flex-1 min-h-[50%]">
            <div className="flex-1 overflow-hidden flex">
              <CodeEditor />
            </div>
            {isWorkflowOpen && (
              <>
                <div 
                  className="w-1.5 cursor-col-resize hover:bg-brand-500/50 bg-transparent transition-colors mx-2 flex-shrink-0 z-10 rounded-full"
                  onMouseDown={(e) => {
                    const startX = e.clientX;
                    const startWidth = workflowWidth;
                    
                    const onMouseMove = (moveEvent: MouseEvent) => {
                      const newWidth = Math.max(300, Math.min(800, startWidth - (moveEvent.clientX - startX)));
                      setWorkflowWidth(newWidth);
                    };
                    
                    const onMouseUp = () => {
                      document.removeEventListener('mousemove', onMouseMove);
                      document.removeEventListener('mouseup', onMouseUp);
                    };
                    
                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                  }}
                />
                <div style={{ width: workflowWidth }} className="flex flex-shrink-0">
                  <WorkflowVisualizer />
                </div>
              </>
            )}
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
              {isAnyAgentRunning ? 'Processing...' : 'Excellent'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-text-secondary" />
            <span>CPU:</span>
            <span className="text-white w-8 text-right font-mono">{isAnyAgentRunning ? '78%' : '34%'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-text-secondary" />
            <span>Memory:</span>
            <span className="text-white w-8 text-right font-mono">{isAnyAgentRunning ? '82%' : '63%'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
