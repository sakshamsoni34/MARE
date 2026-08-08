import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Code, Play, Save } from 'lucide-react';
import { useStore, Agent, FileSystemNode } from '@/store/useStore';

interface CodeEditorProps {
  agent: Agent;
}

export default function CodeEditor({ agent }: CodeEditorProps) {
  const { agentScripts, updateAgentScript, removeOpenAgent, activeAgent, setActiveAgent, runningAgents, setAgentRunning, addTerminalLog, userQuery, selectedFolderId, updateNodeContent, fileSystem, createFile } = useStore();
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
          userQuery: userQuery || 'Say hello',
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
      currentScriptCode += `\n\n# --- ${agent} Response ---\n\n`;
      updateAgentScript(agent, currentScriptCode);

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

    // Save to virtual file system if a file is selected
    if (selectedFolderId) {
      const selectedNode = findNode(fileSystem, selectedFolderId);
      if (selectedNode && selectedNode.type === 'file') {
        updateNodeContent(selectedFolderId, code, agent);
        addTerminalLog(`> <span class="text-accent-green">Success:</span> Saved script to file "${selectedNode.name}".`);

        // Show popup
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
      
      // Add it to the virtual file system
      createFile(selectedFolderId || null, handle.name, code, agent);
      
      addTerminalLog(`> <span class="text-accent-green">Success:</span> Saved ${agent} response to local file system.`);

      // Show popup
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
          <Code size={16} className={isActive ? 'text-brand-400' : 'text-text-tertiary'} />
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
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="python"
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
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
