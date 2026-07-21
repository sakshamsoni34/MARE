import React from 'react';
import Editor from '@monaco-editor/react';
import { Code } from 'lucide-react';
import { useStore, Agent } from '@/store/useStore';

interface CodeEditorProps {
  agent: Agent;
}

export default function CodeEditor({ agent }: CodeEditorProps) {
  const { agentScripts, updateAgentScript, removeOpenAgent, activeAgent, setActiveAgent } = useStore();
  const code = agentScripts[agent] || '';

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateAgentScript(agent, value);
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
        <div className="flex items-center pb-2 -mb-3">
          <span 
            onClick={(e) => { e.stopPropagation(); removeOpenAgent(agent); }} 
            className="cursor-pointer text-text-tertiary hover:text-accent-red transition-colors text-lg leading-none"
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
    </div>
  );
}
