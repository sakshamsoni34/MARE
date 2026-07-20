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
              <option>Keras</option>
              <option>XGBoost</option>
              <option>LightGBM</option>
              <option>LangChain</option>
              <option>LlamaIndex</option>
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

          <div className="space-y-2 pt-2 border-t border-[var(--color-border-primary)]">
            <label className="text-sm font-medium text-text-secondary flex justify-between items-center">
              <span>Anomaly Threshold</span>
              <span className="text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded font-mono">85%</span>
            </label>
            <input 
              type="range" 
              min="0" max="100" step="1" 
              defaultValue="85" 
              className="w-full accent-brand-500 cursor-pointer h-1.5 bg-[var(--color-border-secondary)] rounded-lg appearance-none outline-none" 
            />
            <div className="flex justify-between text-[10px] text-text-tertiary">
              <span>Permissive</span>
              <span>Strict</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-primary)]">
            <div>
              <p className="text-sm font-medium text-text-secondary">Auto-Execute</p>
              <p className="text-[11px] text-text-tertiary mt-0.5">Run node automatically</p>
            </div>
            <div className="w-9 h-5 bg-brand-500 rounded-full flex items-center p-0.5 cursor-pointer transition-colors shadow-inner">
              <div className="w-4 h-4 bg-white rounded-full transform translate-x-4 shadow-sm transition-transform duration-200"></div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
