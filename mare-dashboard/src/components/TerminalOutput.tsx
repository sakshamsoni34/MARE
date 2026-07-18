import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function TerminalOutput() {
  const { terminalLogs, isRunning } = useStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  return (
    <div className="h-64 shrink-0 flex flex-col rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-panel)] overflow-hidden shadow-lg">
      <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-text-secondary" />
          <span className="text-sm font-medium text-white">Output / Terminal</span>
        </div>
        <div className="flex gap-2">
          <div className="h-3 w-3 rounded-full bg-accent-red/20 border border-accent-red"></div>
          <div className="h-3 w-3 rounded-full bg-accent-yellow/20 border border-accent-yellow"></div>
          <div className="h-3 w-3 rounded-full bg-accent-green/20 border border-accent-green"></div>
        </div>
      </div>
      <div className="flex-1 p-4 font-mono text-sm leading-relaxed text-text-secondary overflow-y-auto bg-black/20">
        {terminalLogs.map((log, index) => (
          <div key={index} className="mt-1">
            <span className="text-brand-400 mr-2">{'>'}</span>
            <span dangerouslySetInnerHTML={{ __html: log }} />
          </div>
        ))}
        {isRunning && (
          <div className="mt-1 animate-pulse">
            <span className="text-brand-400 mr-2">{'>'}</span>
            <span className="text-text-tertiary">_</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
