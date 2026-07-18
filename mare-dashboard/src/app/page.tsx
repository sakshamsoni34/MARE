import React from 'react';
import { 
  Folder, Play, Settings, Bell, Search,
  Terminal, Activity, Cpu, Database,
  Code, BookOpen, UserCircle, BrainCircuit,
  Eye, Pause, Plus
} from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden text-base bg-[var(--color-bg-primary)]">
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
            placeholder="Configure and launch your multi-agent workflow..." 
            className="w-full bg-transparent text-sm outline-none placeholder:text-text-tertiary text-text-primary"
          />
        </div>

        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white shadow-md transition-all hover:bg-brand-500 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0">
            <Play size={16} fill="currentColor" />
            Start Research
          </button>
          <div className="h-6 w-px bg-[var(--color-border-secondary)]"></div>
          <Activity size={20} className="text-text-secondary cursor-pointer hover:text-white transition-colors" />
          <Bell size={20} className="text-text-secondary cursor-pointer hover:text-white transition-colors" />
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-sm ring-2 ring-[var(--color-border-primary)] hover:ring-brand-400 transition-all">
              RT
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar */}
        <aside className="w-72 shrink-0 border-r border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] flex flex-col">
          <div className="p-5">
            <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] py-2.5 text-sm font-medium text-text-secondary hover:bg-[var(--color-bg-tertiary)] hover:border-brand-500/50 hover:text-white transition-all shadow-sm">
              <Plus size={16} /> NEW RESEARCH
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-3 pb-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 px-3 py-2 text-sm font-semibold tracking-wider text-text-secondary uppercase">
                <span>Projects</span>
              </div>
              <div className="ml-4 mt-2 flex flex-col gap-1.5">
                <div className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-text-primary hover:bg-[var(--color-bg-tertiary)] transition-colors">
                  <Folder size={18} className="text-text-tertiary" />
                  <span className="text-sm">Market Analysis</span>
                </div>
                <div className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-text-primary hover:bg-[var(--color-bg-tertiary)] transition-colors">
                  <Folder size={18} className="text-text-tertiary" />
                  <span className="text-sm">Fraud Detection</span>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center gap-2 px-3 py-2 text-sm font-semibold tracking-wider text-text-secondary uppercase">
                <span>Agents</span>
              </div>
              <div className="mt-2 flex flex-col gap-1.5">
                 <div className="flex items-center justify-between group cursor-pointer rounded-md px-3 py-2 hover:bg-[var(--color-bg-tertiary)] transition-colors">
                  <div className="flex items-center gap-3 text-text-secondary group-hover:text-white transition-colors">
                    <Database size={18} />
                    <span className="text-sm">Scraper</span>
                  </div>
                  <Play size={14} className="text-accent-green" />
                </div>
                 <div className="flex items-center justify-between group cursor-pointer rounded-md px-3 py-2 bg-brand-500/10 border border-brand-500/20 text-brand-300">
                  <div className="flex items-center gap-3">
                    <Settings size={18} />
                    <span className="text-sm font-medium">Cleanser</span>
                  </div>
                  <Activity size={14} className="text-brand-400" />
                </div>
                 <div className="flex items-center justify-between group cursor-pointer rounded-md px-3 py-2 hover:bg-[var(--color-bg-tertiary)] transition-colors">
                  <div className="flex items-center gap-3 text-text-secondary group-hover:text-white transition-colors">
                    <BookOpen size={18} />
                    <span className="text-sm">Research Agent</span>
                  </div>
                  <Play size={14} className="text-text-tertiary group-hover:text-white transition-colors" />
                </div>
                 <div className="flex items-center justify-between group cursor-pointer rounded-md px-3 py-2 hover:bg-[var(--color-bg-tertiary)] transition-colors">
                  <div className="flex items-center gap-3 text-text-secondary group-hover:text-white transition-colors">
                    <BrainCircuit size={18} />
                    <span className="text-sm">Lead Developer</span>
                  </div>
                  <Pause size={14} className="text-accent-yellow" />
                </div>
                 <div className="flex items-center justify-between group cursor-pointer rounded-md px-3 py-2 hover:bg-[var(--color-bg-tertiary)] transition-colors">
                  <div className="flex items-center gap-3 text-text-secondary group-hover:text-white transition-colors">
                    <Code size={18} />
                    <span className="text-sm">Code Agent</span>
                  </div>
                  <Play size={14} className="text-text-tertiary group-hover:text-white transition-colors" />
                </div>
                 <div className="flex items-center justify-between group cursor-pointer rounded-md px-3 py-2 hover:bg-[var(--color-bg-tertiary)] transition-colors">
                  <div className="flex items-center gap-3 text-text-secondary group-hover:text-white transition-colors">
                    <Eye size={18} />
                    <span className="text-sm">Reviewer</span>
                  </div>
                  <Play size={14} className="text-text-tertiary group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Area (Editor + Terminal) */}
        <main className="flex flex-1 flex-col overflow-hidden bg-[var(--color-bg-primary)] p-4 gap-4">
          
          {/* Top Center: Editor & Workflow */}
          <div className="flex flex-1 gap-4 min-h-[50%]">
            
            {/* Code Editor Mockup */}
            <div className="flex flex-1 flex-col rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-panel)] overflow-hidden shadow-lg">
               <div className="flex items-center border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 py-3 text-sm">
                 <div className="flex items-center gap-3 text-white border-b-2 border-brand-500 pb-2 -mb-3">
                   <Code size={16} className="text-brand-400" />
                   <span className="font-medium">Fraud Detection Script</span>
                   <span className="text-xs text-accent-green bg-accent-green/10 px-2 py-0.5 rounded-full ml-1">Active</span>
                   <span className="ml-3 cursor-pointer text-text-tertiary hover:text-white transition-colors">×</span>
                 </div>
               </div>
               <div className="flex-1 p-5 font-mono text-base leading-relaxed text-text-secondary overflow-y-auto">
                 <div className="flex hover:bg-white/5 px-2 -mx-2 rounded"><span className="w-10 text-text-tertiary select-none">1</span><span className="text-brand-400">import</span> <span className="text-white">pandas</span> <span className="text-brand-400">as</span> <span className="text-white">pd</span></div>
                 <div className="flex hover:bg-white/5 px-2 -mx-2 rounded"><span className="w-10 text-text-tertiary select-none">2</span><span className="text-brand-400">from</span> <span className="text-white">sklearn.ensemble</span> <span className="text-brand-400">import</span> <span className="text-white">RandomForestClassifier</span></div>
                 <div className="flex hover:bg-white/5 px-2 -mx-2 rounded"><span className="w-10 text-text-tertiary select-none">3</span></div>
                 <div className="flex hover:bg-white/5 px-2 -mx-2 rounded"><span className="w-10 text-text-tertiary select-none">4</span><span className="text-text-tertiary italic"># Initialize fraud detection model</span></div>
                 <div className="flex hover:bg-white/5 px-2 -mx-2 rounded"><span className="w-10 text-text-tertiary select-none">5</span><span className="text-white">rf_model</span> <span className="text-accent-blue">=</span> <span className="text-accent-yellow">RandomForestClassifier</span>()</div>
                 <div className="flex hover:bg-white/5 px-2 -mx-2 rounded"><span className="w-10 text-text-tertiary select-none">6</span></div>
                 <div className="flex hover:bg-white/5 px-2 -mx-2 rounded"><span className="w-10 text-text-tertiary select-none">7</span><span className="text-white">rf_model</span>.<span className="text-accent-yellow">fit</span>(<span className="text-white">X_train</span>, <span className="text-white">y_train</span>)</div>
               </div>
            </div>

            {/* Workflow Config Mockup */}
             <div className="flex flex-1 flex-col rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-panel)] overflow-hidden shadow-lg">
               <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 py-3">
                 <span className="text-sm font-medium text-text-secondary">Multi-Agent Workflow Configuration</span>
                 <Settings size={16} className="text-text-tertiary cursor-pointer hover:text-white" />
               </div>
               <div className="flex-1 p-6 overflow-y-auto relative flex flex-col items-center justify-center bg-[url('/grid.svg')] bg-center">
                 {/* Mock nodes */}
                 <div className="flex gap-12 items-center">
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--color-bg-secondary)] border-2 border-[var(--color-border-secondary)] shadow-md">
                           <Database size={24} className="text-accent-blue" />
                        </div>
                        <span className="text-xs text-text-secondary font-medium">Scraper</span>
                    </div>
                    
                    <div className="h-0.5 w-16 bg-brand-500/50 relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 rounded-full bg-brand-400"></div>
                    </div>

                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-900/40 border-2 border-brand-500 shadow-md ring-4 ring-brand-500/10">
                            <Settings size={24} className="text-brand-400" />
                            </div>
                            <span className="text-xs text-brand-300 font-medium">Cleanser</span>
                        </div>
                    </div>
                 </div>
               </div>
            </div>

          </div>

          {/* Bottom Center: Terminal */}
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
               <div><span className="text-brand-400 mr-2">{'>'}</span> <span className="text-white">Status:</span> <span className="text-accent-green">OPERATING...</span></div>
               <div className="mt-1"><span className="text-brand-400 mr-2">{'>'}</span> <span className="text-text-secondary">Multi-Agent log:</span> Scraper found 12 sources...</div>
               <div className="mt-1"><span className="text-brand-400 mr-2">{'>'}</span> <span className="text-text-secondary">Multi-Agent log:</span> Cleanser active on dataset [credit_fraud_v2]...</div>
               <div className="mt-1"><span className="text-brand-400 mr-2">{'>'}</span> <span className="text-accent-yellow">Warning:</span> Rate limit approaching for node 'Data Enrichment'</div>
             </div>
          </div>

        </main>

        {/* Right Sidebar (Properties) */}
        <aside className="w-80 shrink-0 border-l border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] flex flex-col overflow-y-auto">
           <div className="p-6 border-b border-[var(--color-border-primary)]">
             <div className="flex items-center justify-between mb-3">
               <span className="text-xs font-bold tracking-wider text-text-secondary uppercase">Project Details</span>
             </div>
             <h3 className="text-xl font-semibold text-white mb-2">Market Analysis</h3>
             <p className="text-sm text-text-tertiary leading-relaxed">Description: Latest real-time case study on credit card fraud detection anomalies.</p>
           </div>
           
           <div className="p-6">
             <span className="text-xs font-bold tracking-wider text-text-secondary uppercase mb-4 block">Agent Settings</span>
             <div className="flex flex-col gap-5">
               <div className="space-y-2">
                 <label className="text-sm font-medium text-text-secondary block">Data Source</label>
                 <select className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-sm cursor-pointer hover:border-text-tertiary">
                   <option>Random Forest Model</option>
                   <option>Neural Network</option>
                   <option>Gradient Boosting</option>
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-medium text-text-secondary block">Model Type</label>
                 <select className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-sm cursor-pointer hover:border-text-tertiary">
                   <option>Classification</option>
                   <option>Regression</option>
                   <option>Clustering</option>
                 </select>
               </div>
               <div className="space-y-2 pt-2 border-t border-[var(--color-border-primary)]">
                 <label className="text-sm font-medium text-text-secondary block">Target Variable</label>
                 <input type="text" defaultValue="is_fraud" className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-sm" />
               </div>
             </div>
           </div>
        </aside>

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
              Excellent
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-text-secondary" />
            <span>CPU:</span>
            <span className="text-white w-8 text-right font-mono">34%</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-text-secondary" />
            <span>Memory:</span>
            <span className="text-white w-8 text-right font-mono">63%</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
