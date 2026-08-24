'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Bell, Search, Activity, Cpu, Network, ChevronDown } from 'lucide-react';
import Explorer from '@/components/Explorer';
import TerminalOutput from '@/components/TerminalOutput';
import CodeEditor from '@/components/CodeEditor';
import ChatInterface from '@/components/ChatInterface';
import dynamic from 'next/dynamic';

const WorkflowVisualizer = dynamic(() => import('@/components/WorkflowVisualizer'), {
  ssr: false,
  loading: () => <div className="flex-1 h-full flex items-center justify-center text-text-tertiary">Loading Workflow...</div>
});
import Sidebar from '@/components/Sidebar';
import MenuBar from '@/components/MenuBar';

import { useStore } from '@/store/useStore';

export default function Dashboard() {
  const router = useRouter();
  const { runningAgents, setAgentRunning, addTerminalLog, updateLastTerminalLog, clearTerminalLogs, isTerminalOpen, isSidebarOpen, isRightSidebarOpen, activeAgent, setActiveAgent, openAgents, addOpenAgent, editorCode, updateAgentScript, isWorkflowOpen, toggleWorkflow, userQuery, setUserQuery, selectedFolderId, activeProject } = useStore();
  const [workflowWidth, setWorkflowWidth] = useState(500);
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);
  const [agentWidths, setAgentWidths] = useState<Record<string, number>>({});

  const currentAgent = activeAgent || 'Explorer';
  const areOpenAgentsRunning = openAgents.some(agent => runningAgents[agent]);
  const isAnyAgentRunning = Object.values(runningAgents).some(Boolean);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !activeProject) {
      router.replace('/');
    }
  }, [activeProject, router, mounted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === '`' || e.key === '~' || e.code === 'Backquote')) {
        e.preventDefault();
        useStore.getState().toggleTerminal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStartResearch = async () => {
    const agentsToRun = openAgents.filter(agent => !runningAgents[agent] && agent !== 'Orqion');
    if (agentsToRun.length === 0) return;

    clearTerminalLogs();

    const runPromises = agentsToRun.map(async (agentToRun) => {
      setAgentRunning(agentToRun, true);
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
          addTerminalLog(`> <span class="text-accent-red">Error (${agentToRun}):</span> ${errorData.error || 'Failed to connect to agent.'}`);
          setAgentRunning(agentToRun, false);
          return;
        }

        addTerminalLog(`> <span class="text-accent-green">${agentToRun} connected. Task is executing...</span>`);

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        let currentScriptCode = useStore.getState().agentScripts[agentToRun] || '';
        currentScriptCode += `\n\n# --- ${agentToRun} Response ---\n\n`;
        useStore.getState().updateAgentScript(agentToRun, currentScriptCode);
        
        let lastUpdate = Date.now();

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
                    const now = Date.now();
                    if (now - lastUpdate > 50) {
                      useStore.getState().updateAgentScript(agentToRun, currentScriptCode);
                      lastUpdate = now;
                    }
                  }
                } catch (e) {
                  // ignore parse errors for partial lines
                }
              }
            }
          }
        }
        useStore.getState().updateAgentScript(agentToRun, currentScriptCode);

        const jsonBlocks = [...currentScriptCode.matchAll(/```json\s*([\s\S]*?)\s*```/g)];
        for (const match of jsonBlocks) {
          try {
            const parsed = JSON.parse(match[1]);
            if (parsed.workflow && parsed.workflow.nodes && parsed.workflow.edges) {
              const uniqueNodes = Array.from(new Map(parsed.workflow.nodes.map((n: any) => [n.id, n])).values());
              const uniqueEdges = Array.from(new Map(parsed.workflow.edges.map((e: any) => [e.id, e])).values());

              useStore.getState().setWorkflowNodes(uniqueNodes as any);
              useStore.getState().setWorkflowEdges(uniqueEdges as any);
              useStore.getState().setWorkflowOpen(true);
              addTerminalLog(`> Status: <span class="text-accent-blue">Generated workflow from response.</span>`);
              break;
            }
          } catch (e) { }
        }

        addTerminalLog(`> Status: <span class="text-accent-green">${agentToRun.toUpperCase()} TASK COMPLETED</span>`);
      } catch (error: any) {
        addTerminalLog(`> <span class="text-accent-red">Error (${agentToRun}):</span> ${error.message}`);
      } finally {
        setAgentRunning(agentToRun, false);
      }
    });

    await Promise.all(runPromises);
  };

  if (!mounted || !activeProject) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden text-base bg-[var(--color-bg-primary)]">
      <MenuBar onNewFile={() => { }} onNewFolder={() => { }} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Main Content Area */}
          <div className="flex flex-1 overflow-hidden">
            <main className="flex flex-1 flex-col overflow-hidden bg-[var(--color-bg-primary)] p-4 gap-4">
              <div className="flex flex-1 min-h-[50%]">
                <div className="flex-1 overflow-x-auto overflow-y-hidden flex pb-2 custom-scrollbar">
                  {openAgents.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center h-full w-full select-none">
                      <img src="/logo.png?v=2" alt="MRE Logo" className="w-[500px] max-w-[80%] pointer-events-none" />
                    </div>
                  ) : (
                    openAgents.map((agent, index) => (
                      <React.Fragment key={agent}>
                        <div
                          style={agentWidths[agent] ? { width: agentWidths[agent], flex: 'none' } : { flex: 1, minWidth: 300 }}
                          className="flex flex-col"
                        >
                          {agent.toLowerCase().includes('coder') || agent.toLowerCase().includes('python') || agent.toLowerCase().includes('automation') ? (
                            <CodeEditor agent={agent} />
                          ) : (
                            <ChatInterface agent={agent} />
                          )}
                        </div>
                        {index < openAgents.length - 1 && (
                          <div
                            className="w-1.5 cursor-col-resize hover:bg-brand-500/50 bg-transparent transition-colors flex-shrink-0 z-10 rounded-full my-auto h-3/4 mx-1"
                            onMouseDown={(e) => {
                              const startX = e.clientX;
                              const startWidth = agentWidths[agent] || (e.currentTarget.previousElementSibling as HTMLElement)?.clientWidth || 400;

                              const onMouseMove = (moveEvent: MouseEvent) => {
                                const newWidth = Math.max(250, startWidth + (moveEvent.clientX - startX));
                                setAgentWidths(prev => ({ ...prev, [agent]: newWidth }));
                              };

                              const onMouseUp = () => {
                                document.removeEventListener('mousemove', onMouseMove);
                                document.removeEventListener('mouseup', onMouseUp);
                              };

                              document.addEventListener('mousemove', onMouseMove);
                              document.addEventListener('mouseup', onMouseUp);
                            }}
                          />
                        )}
                      </React.Fragment>
                    ))
                  )}
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
            {isRightSidebarOpen && (
              <div className="w-[400px] flex-shrink-0 flex flex-col border-l border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-2">
                <ChatInterface agent="Orqion" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <footer className="flex h-8 shrink-0 items-center justify-between border-t border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 text-xs font-medium text-text-tertiary w-full">
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
