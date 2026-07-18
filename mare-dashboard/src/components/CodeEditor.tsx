import React from 'react';
import Editor from '@monaco-editor/react';
import { Code } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function CodeEditor() {
  const { editorCode, setEditorCode, activeAgent } = useStore();

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorCode(value);
    }
  };

  return (
    <div className="flex flex-1 flex-col rounded-xl border border-[var(--color-border-primary)] bg-[#1e1e1e] overflow-hidden shadow-lg">
      <div className="flex items-center border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 py-3 text-sm">
        <div className="flex items-center gap-3 text-white border-b-2 border-brand-500 pb-2 -mb-3">
          <Code size={16} className="text-brand-400" />
          <span className="font-medium">{activeAgent} Script</span>
          <span className="text-xs text-accent-green bg-accent-green/10 px-2 py-0.5 rounded-full ml-1">Active</span>
          <span className="ml-3 cursor-pointer text-text-tertiary hover:text-white transition-colors">×</span>
        </div>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="python"
          theme="vs-dark"
          value={editorCode}
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
