import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Code, Play, Save, X } from 'lucide-react';
import { useStore, Agent, FileSystemNode } from '@/store/useStore';

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
              } catch (e) {
                // ignore
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

            currentScriptCode = currentScriptCode.replace(match[0], '\n> *[Workflow configuration extracted and rendered in the Multi-Agent Workflow panel]*\n');
            updateAgentScript(agent, currentScriptCode);
            break;
          }
        } catch (e) { }
      }

      addTerminalLog(`> Status: <span class="text-accent-green">${agent.toUpperCase()} TASK COMPLETED & GROUNDED</span>`);
    } catch (error: any) {
      addTerminalLog(`> <span class="text-accent-red">Error (${agent}):</span> ${error.message}`);
    } finally {
      setAgentRunning(agent, false);
    }
  };

  const [showSavePopup, setShowSavePopup] = useState<string | null>(null);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Save to virtual file system if a file is selected
    if (selectedFolderId) {
      const selectedNode = findNode(fileSystem, selectedFolderId);
      if (selectedNode && selectedNode.type === 'file') {
        updateNodeContent(selectedFolderId, code, agent);
        addTerminalLog(`> <span class="text-accent-green">Success:</span> Saved script to file "${selectedNode.name}".`);

        // Show popup
        setShowSavePopup(`Saved in file "${selectedNode.name}"`);
        setTimeout(() => setShowSavePopup(null), 3000);

        try {
          await fetch('http://localhost:8555/api/sync/file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              node_id: selectedNode.id,
              name: selectedNode.name,
              type: 'file',
              content: code,
              agent_name: agent,
              agent_contents: { [agent]: code }
            })
          });
        } catch (err) { }

        return;
      }
    }

    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: `${agent.replace(' ', '_').toLowerCase()}_output.py`,
        types: [{
          description: 'Python Files',
          accept: { 'text/x-python': ['.py', '.md'] },
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
        await fetch('http://localhost:8555/api/sync/file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              node_id: Date.now().toString(),
              name: handle.name,
              type: 'file',
              content: code,
              agent_name: agent,
              agent_contents: { [agent]: code }
          })
        });
      } catch (err) { }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        addTerminalLog(`> <span class="text-accent-red">Error:</span> Failed to save file: ${err.message}`);
      }
    }
  };

  const isActive = activeAgent === agent;

  return (
    <div
      className={`flex flex-1 flex-col rounded-2xl border bg-[#0a0a0f]/95 backdrop-blur-2xl overflow-hidden shadow-2xl mx-1 min-w-[300px] transition-all duration-300 ${
        isActive 
          ? 'border-brand-500/40 ring-1 ring-brand-500/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]' 
          : 'border-white/[0.07] opacity-95 hover:border-white/15'
      }`}
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
        </div>
        
        <div className="flex items-center gap-1.5 text-gray-400">
          <button
            onClick={handleSave}
            className="p-2 rounded-lg hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer border border-transparent hover:border-white/10"
            title="Save to File System"
          >
            <Save size={15} />
          </button>
          
          <button
            onClick={handleRunAgent}
            disabled={isRunning}
            className={`p-2 rounded-lg transition-all border border-transparent ${isRunning ? 'text-brand-500 cursor-not-allowed opacity-50' : 'hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20 cursor-pointer'}`}
            title="Run this agent"
          >
            <Play size={14} fill={isRunning ? "currentColor" : "none"} />
          </button>
          
          <div className="w-px h-4 bg-white/10 mx-1" />

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
