import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Code, Play, Save, X, Terminal as TerminalIcon, Shield } from 'lucide-react';
import { useStore, Agent, FileSystemNode } from '@/store/useStore';
import { executeCodeApi } from '@/lib/api';

// Dynamically import Monaco Editor to reduce initial bundle size
const Editor = dynamic(() => import('@monaco-editor/react'), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-text-tertiary">Loading Editor...</div>
});

interface CodeEditorProps {
  agent: Agent;
}

export default function CodeEditor({ agent }: CodeEditorProps) {
  const { 
    agentScripts, 
    updateAgentScript, 
    removeOpenAgent, 
    activeAgent, 
    setActiveAgent, 
    runningAgents, 
    setAgentRunning, 
    addTerminalLog, 
    userQuery, 
    selectedFolderId, 
    updateNodeContent, 
    fileSystem, 
    createFile
  } = useStore();
  
  const code = agentScripts[agent] || '';
  const isRunning = runningAgents[agent];
  const [showSavePopup, setShowSavePopup] = useState<string | null>(null);
  const [isExecutingCode, setIsExecutingCode] = useState(false);

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

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateAgentScript(agent, value);
    }
  };

  const handleExecuteCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExecutingCode) return;
    setIsExecutingCode(true);

    if (!useStore.getState().isTerminalOpen) {
      useStore.getState().toggleTerminal();
    }

    addTerminalLog(`> <span class="text-accent-yellow">Executing ${agent} script in Sandboxed AST Runtime...</span>`);

    try {
      const res = await executeCodeApi(code, 'python', 10);
      if (res.status === 'success') {
        addTerminalLog(`> <span class="text-accent-green">✓ Execution Finished</span> in ${res.duration_ms}ms (exit code: ${res.returncode})`);
        if (res.stdout) {
          const formatted = res.stdout.replace(/\n/g, '<br/>').replace(/ /g, '&nbsp;');
          addTerminalLog(`<div class="text-emerald-300 font-mono text-xs pl-2 border-l-2 border-emerald-500/50 my-1">${formatted}</div>`);
        }
        if (res.stderr) {
          const formattedErr = res.stderr.replace(/\n/g, '<br/>').replace(/ /g, '&nbsp;');
          addTerminalLog(`<div class="text-amber-400 font-mono text-xs pl-2 border-l-2 border-amber-500/50 my-1">${formattedErr}</div>`);
        }
        if (!res.stdout && !res.stderr) {
          addTerminalLog(`<span class="text-gray-400 font-mono text-xs">[Process finished with no output]</span>`);
        }
      } else {
        const errorText = (res.stderr || 'Execution failed').replace(/\n/g, '<br/>');
        addTerminalLog(`> <span class="text-accent-red">Security / Execution Failure:</span><br/><div class="text-red-400 font-mono text-xs pl-2 border-l-2 border-red-500/50 my-1">${errorText}</div>`);
      }
    } catch (err: any) {
      addTerminalLog(`> <span class="text-accent-red">System Error:</span> ${err.message}`);
    } finally {
      setIsExecutingCode(false);
    }
  };

  const handleRunAgent = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRunning) return;

    setAgentRunning(agent, true);
    addTerminalLog(`> Status: <span class="text-accent-yellow">INITIALIZING ${agent.toUpperCase()}...</span>`);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8555';

    try {
      const response = await fetch(`${apiUrl}/api/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: agent,
          systemPrompt: agentScripts[agent] || 'You are a helpful AI assistant.',
          userQuery: userQuery || 'Generate code',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        addTerminalLog(`> <span class="text-accent-red">Error (${agent}):</span> ${errorData.error || 'Failed to connect to agent.'}`);
        setAgentRunning(agent, false);
        return;
      }

      addTerminalLog(`> <span class="text-accent-green">${agent} connected. Task executing...</span>`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let currentScriptCode = agentScripts[agent] || '';
      currentScriptCode += `\n\n# --- ${agent} Output ---\n\n`;
      updateAgentScript(agent, currentScriptCode);
      
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
                    updateAgentScript(agent, currentScriptCode);
                    lastUpdate = now;
                  }
                }
              } catch (_) {
                // ignore streaming parse errors
              }
            }
          }
        }
      }
      updateAgentScript(agent, currentScriptCode);

      const jsonBlocks = [...currentScriptCode.matchAll(/```json\s*([\s\S]*?)\s*```/g)];
      for (const match of jsonBlocks) {
        try {
          const parsed = JSON.parse(match[1]);
          if (parsed.workflow && parsed.workflow.nodes && parsed.workflow.edges) {
            useStore.getState().setWorkflowNodes(parsed.workflow.nodes);
            useStore.getState().setWorkflowEdges(parsed.workflow.edges);
            useStore.getState().setWorkflowOpen(true);
            addTerminalLog(`> Status: <span class="text-accent-blue">Generated workflow from response.</span>`);
          }
        } catch (_) {
          // ignore json parsing
        }
      }

      addTerminalLog(`> <span class="text-accent-green">${agent} execution completed.</span>`);
    } catch (err: any) {
      addTerminalLog(`> <span class="text-accent-red">Execution Error:</span> ${err.message}`);
    } finally {
      setAgentRunning(agent, false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentScript = agentScripts[agent] || '';
    const extension = agent.toLowerCase().includes('python') ? 'py' : 'ts';
    const defaultFileName = `${agent.toLowerCase().replace(/\s+/g, '_')}.${extension}`;

    if (selectedFolderId) {
      const targetNode = findNode(fileSystem, selectedFolderId);
      if (targetNode) {
        if (targetNode.type === 'file') {
          updateNodeContent(targetNode.id, currentScript, agent);
          setShowSavePopup(`Updated file: ${targetNode.name}`);
          setTimeout(() => setShowSavePopup(null), 3000);
          return;
        } else if (targetNode.type === 'folder') {
          createFile(selectedFolderId, defaultFileName, currentScript, agent);
          setShowSavePopup(`Saved to ${targetNode.name}/${defaultFileName}`);
          setTimeout(() => setShowSavePopup(null), 3000);
          return;
        }
      }
    }

    createFile(null, defaultFileName, currentScript, agent);
    setShowSavePopup(`Saved ${defaultFileName} to root workspace`);
    setTimeout(() => setShowSavePopup(null), 3000);
  };

  return (
    <div 
      className={`flex flex-1 flex-col rounded-xl border border-white/[0.08] bg-[#0c0d0e]/95 backdrop-blur-2xl overflow-hidden shadow-2xl transition-all duration-300 relative ${activeAgent === agent ? 'ring-1 ring-emerald-500/20' : 'opacity-90 hover:opacity-100'}`}
      onClick={() => setActiveAgent(agent)}
    >
      <div className="flex items-center justify-between border-b border-white/[0.07] bg-black/40 backdrop-blur-xl px-4 py-3 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
            <Code size={16} />
          </div>
          <span className="font-semibold text-[13.5px] text-white tracking-tight">{agent}</span>
          
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono">MARE</span>
          </span>

          <span 
            className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20"
            title="Code runs in an isolated ephemeral directory with AST static analysis and resource limits"
          >
            <Shield size={11} />
            <span>Sandbox Guard</span>
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-gray-400">
          <button
            onClick={handleExecuteCode}
            disabled={isExecutingCode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all border text-xs font-semibold cursor-pointer ${
              isExecutingCode 
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 cursor-wait' 
                : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border-emerald-500/30 shadow-sm shadow-emerald-950/40'
            }`}
            title="Execute Python Code in Sandbox"
          >
            <TerminalIcon size={14} className={isExecutingCode ? 'animate-spin' : ''} />
            <span>{isExecutingCode ? 'Running...' : 'Execute'}</span>
          </button>

          <button
            onClick={handleRunAgent}
            disabled={isRunning}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all border text-xs font-semibold cursor-pointer ${
              isRunning 
                ? 'bg-brand-500/15 text-brand-300 border-brand-500/30 opacity-60 cursor-not-allowed' 
                : 'bg-white/5 hover:bg-white/10 text-gray-200 border-white/10 hover:text-white'
            }`}
            title="Prompt AI Agent for Code"
          >
            <Play size={13} fill={isRunning ? 'currentColor' : 'none'} />
            <span>{isRunning ? 'Agent Active...' : 'AI Prompt'}</span>
          </button>

          <button
            onClick={handleSave}
            className="p-2 rounded-lg hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer border border-transparent hover:border-white/10"
            title="Save to File System"
          >
            <Save size={15} />
          </button>
          
          <div className="w-px h-4 bg-white/10 mx-0.5" />

          <button
            onClick={(e) => { e.stopPropagation(); removeOpenAgent(agent); }}
            className="p-2 rounded-lg hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/20 transition-all cursor-pointer border border-transparent"
            title="Close"
          >
            <X size={15} />
          </button>
        </div>
      </div>
      
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage={agent.toLowerCase().includes('python') ? 'python' : 'typescript'}
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 13.5,
            lineHeight: 1.5,
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
          }}
        />
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
