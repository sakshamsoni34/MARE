import React from 'react';
import { useStore } from '@/store/useStore';

export default function PropertiesPanel() {
  const { activeProject, activeAgent } = useStore();

  return (
    <aside className="w-80 shrink-0 border-l border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] flex flex-col overflow-y-auto">
      <div className="p-6 border-b border-[var(--color-border-primary)]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold tracking-wider text-text-secondary uppercase">Project Details</span>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">{activeProject}</h3>
        <p className="text-sm text-text-tertiary leading-relaxed">
          {activeProject === 'Market Analysis' 
            ? 'Latest real-time case study on credit card fraud detection anomalies.'
            : 'Automated pipeline for detecting fraudulent transactions in real-time streams.'}
        </p>
      </div>
      
      <div className="p-6">
        <span className="text-xs font-bold tracking-wider text-text-secondary uppercase mb-4 block">Agent Settings: {activeAgent}</span>
        <div className="flex flex-col gap-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary block">Model Framework</label>
            <select className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-sm cursor-pointer hover:border-text-tertiary">
              <option>Scikit-Learn</option>
              <option>TensorFlow</option>
              <option>PyTorch</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary block">Execution Priority</label>
            <select className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-sm cursor-pointer hover:border-text-tertiary">
              <option>High</option>
              <option>Normal</option>
              <option>Low</option>
            </select>
          </div>
          <div className="space-y-2 pt-2 border-t border-[var(--color-border-primary)]">
            <label className="text-sm font-medium text-text-secondary block">System Prompt</label>
            <textarea 
              rows={4}
              defaultValue={`You are the ${activeAgent}. Your goal is to ensure the integrity of the data pipeline.`} 
              className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-sm resize-none" 
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
