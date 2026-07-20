import React from 'react';
import { Folder, Play, Settings, Database, BookOpen, BrainCircuit, Code, Eye, Pause, Plus, Activity, User, Box, ShieldCheck, Zap } from 'lucide-react';
import { useStore, Agent } from '@/store/useStore';

export default function Sidebar() {
  const { activeProject, setActiveProject, activeAgent, setActiveAgent } = useStore();

  const projects = ['Market Analysis', 'Fraud Detection'];
  const agents: { name: Agent, icon: React.ReactNode, statusIcon: React.ReactNode }[] = [
    { name: 'Orchestrator (Manager)', icon: <BrainCircuit size={18} />, statusIcon: <Play size={14} className="text-accent-green" /> },
    { name: 'Researcher', icon: <BookOpen size={18} />, statusIcon: <Activity size={14} className="text-brand-400" /> },
    { name: 'Software Engineer', icon: <Code size={18} />, statusIcon: <Play size={14} className="text-text-tertiary group-hover:text-white transition-colors" /> },
    { name: 'Execution Sandbox', icon: <Box size={18} />, statusIcon: <Pause size={14} className="text-accent-yellow" /> },
    { name: 'Data Analyst', icon: <Database size={18} />, statusIcon: <Play size={14} className="text-text-tertiary group-hover:text-white transition-colors" /> },
    { name: 'Critic / QA', icon: <ShieldCheck size={18} />, statusIcon: <Play size={14} className="text-text-tertiary group-hover:text-white transition-colors" /> },
    { name: 'Synthesizer', icon: <Zap size={18} />, statusIcon: <Play size={14} className="text-text-tertiary group-hover:text-white transition-colors" /> },
    { name: 'Human Proxy', icon: <User size={18} />, statusIcon: <Play size={14} className="text-text-tertiary group-hover:text-white transition-colors" /> },
  ];

  return (
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
            {projects.map((proj) => (
              <div 
                key={proj}
                onClick={() => setActiveProject(proj)}
                className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors ${activeProject === proj ? 'bg-[var(--color-bg-tertiary)] text-brand-400' : 'text-text-primary hover:bg-[var(--color-bg-tertiary)]'}`}
              >
                <Folder size={18} className={activeProject === proj ? 'text-brand-400' : 'text-text-tertiary'} />
                <span className="text-sm">{proj}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center gap-2 px-3 py-2 text-sm font-semibold tracking-wider text-text-secondary uppercase">
            <span>Agents</span>
          </div>
          <div className="mt-2 flex flex-col gap-1.5">
             {agents.map((agent) => (
                <div 
                  key={agent.name}
                  onClick={() => setActiveAgent(agent.name)}
                  className={`flex items-center justify-between group cursor-pointer rounded-md px-3 py-2 transition-colors ${activeAgent === agent.name ? 'bg-brand-500/10 border border-brand-500/20 text-brand-300' : 'hover:bg-[var(--color-bg-tertiary)]'}`}
                >
                  <div className={`flex items-center gap-3 transition-colors ${activeAgent === agent.name ? 'text-brand-300' : 'text-text-secondary group-hover:text-white'}`}>
                    {agent.icon}
                    <span className="text-sm">{agent.name}</span>
                  </div>
                  {agent.statusIcon}
                </div>
             ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
