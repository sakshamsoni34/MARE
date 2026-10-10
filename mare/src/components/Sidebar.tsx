import React, { useState } from 'react';
import { 
  Home, 
  Bot, 
  BrainCircuit, 
  Search, 
  Settings, 
  BarChart2, 
  FileText, 
  Activity, 
  Folder, 
  Cog, 
  Network, 
  Users, 
  Sparkles, 
  RefreshCw 
} from 'lucide-react';
import { useStore, Agent } from '@/store/useStore';
import Explorer from '@/components/Explorer';
import { motion, AnimatePresence } from 'framer-motion';

type ActivityTab = 'Explorer' | 'Hub' | 'Planning' | 'Research' | 'Execution' | 'Analysis' | 'Reporting' | 'Monitoring' | 'Projects' | 'Settings';

const ActivityIcon = ({ icon, label, isActive, onClick }: any) => (
  <div
    onClick={onClick}
    title={label}
    className={`relative flex items-center justify-center w-12 h-12 cursor-pointer transition-all duration-300 group ${isActive ? 'text-white' : 'text-text-secondary hover:text-white'}`}
  >
    {isActive && (
      <motion.div 
        layoutId="activeTabIndicator"
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-400 rounded-r-md shadow-[0_0_10px_rgba(167,139,250,0.8)]" 
      />
    )}
    <div className={`transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'group-hover:scale-110'}`}>
      {icon}
    </div>
  </div>
);

const CategoryHeader = ({ 
  title, 
  count, 
  onSync, 
  isSyncing 
}: { 
  title: string; 
  count: number; 
  onSync: () => void; 
  isSyncing: boolean; 
}) => (
  <div className="px-3 pt-1 pb-2 border-b border-white/5 mb-1 flex items-center justify-between">
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold tracking-widest text-text-tertiary uppercase">{title}</span>
      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-white/5 text-gray-400 border border-white/5">{count}</span>
    </div>
    <button
      onClick={onSync}
      disabled={isSyncing}
      title="Sync workspace files to agent RAG vector store"
      className="flex items-center gap-1 text-[10px] text-brand-400 hover:text-brand-300 transition-colors cursor-pointer disabled:opacity-50"
    >
      <RefreshCw size={10} className={isSyncing ? 'animate-spin' : ''} />
      <span>Sync RAG</span>
    </button>
  </div>
);

const AgentItem = ({ 
  agent, 
  displayName, 
  activeAgent, 
  handleAgentClick,
  onOpenRAG 
}: { 
  agent: string; 
  displayName?: string; 
  activeAgent: Agent | null; 
  handleAgentClick: (a: Agent) => void;
  onOpenRAG: (agentName: string) => void;
}) => {
  const isActive = activeAgent === agent;
  return (
    <div
      onClick={() => handleAgentClick(agent as Agent)}
      className={`group relative flex items-center justify-between rounded-xl px-3 py-2 mx-2 my-0.5 cursor-pointer transition-all duration-200 border ${
        isActive 
          ? 'bg-brand-500/15 text-brand-300 border-brand-500/30 shadow-[inset_0_0_15px_rgba(139,92,246,0.1)]' 
          : 'text-text-secondary hover:bg-white/5 hover:text-text-primary border-transparent'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-300 ${
          isActive 
            ? 'bg-brand-400 shadow-[0_0_8px_rgba(167,139,250,0.9)]' 
            : 'bg-emerald-400/80 group-hover:bg-emerald-400'
        }`} />
        <span className="text-[13px] font-medium tracking-wide truncate">
          {displayName || agent.replace(' Agent', '')}
        </span>
      </div>

      {/* Integrated Knowledge Trigger */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpenRAG(agent);
        }}
        title={`Inspect RAG Knowledge Base & Grounding for ${agent}`}
        className="shrink-0 flex items-center justify-center p-1 rounded-md text-[9px] transition-all duration-200 bg-brand-500/10 hover:bg-brand-500/25 text-brand-300 border border-brand-500/20 hover:border-brand-500/40 hover:scale-105 active:scale-95 cursor-pointer ml-1.5"
      >
        <Sparkles size={11} className="text-brand-400" />
      </button>
    </div>
  );
};

export default function Sidebar() {
  const { 
    activeAgent, 
    setActiveAgent, 
    addOpenAgent, 
    toggleWorkflow, 
    isWorkflowOpen, 
    activeProject, 
    isSidebarOpen, 
    toggleSidebar, 
    setRAGModalOpen, 
    addTerminalLog 
  } = useStore();

  const [activeTab, setActiveTab] = useState<ActivityTab | null>('Explorer');
  const [showToast, setShowToast] = useState(false);
  const [syncingRAG, setSyncingRAG] = useState(false);

  const handleAgentClick = (agent: Agent) => {
    if (!activeProject) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    setActiveAgent(agent);
    addOpenAgent(agent);
  };

  const handleTabClick = (tab: ActivityTab) => {
    if (activeTab === tab) {
      toggleSidebar();
    } else {
      setActiveTab(tab);
      if (!isSidebarOpen) {
        toggleSidebar();
      }
    }
  };

  const handleQuickRAGSync = async () => {
    setSyncingRAG(true);
    addTerminalLog('> Status: <span class="text-accent-yellow">Syncing workspace files to RAG vector database...</span>');
    try {
      const res = await fetch('http://localhost:8555/api/rag/reindex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ include_workspace_files: true })
      });
      if (res.ok) {
        addTerminalLog('> Status: <span class="text-accent-green">RAG Vector Store indexed all workspace files successfully.</span>');
      }
    } catch (e: any) {
      addTerminalLog(`> <span class="text-accent-red">RAG Sync Error:</span> ${e.message}`);
    } finally {
      setSyncingRAG(false);
    }
  };

  const handleOpenAgentRAG = (agentName: string) => {
    setRAGModalOpen(true, agentName);
  };

  const renderPanelContent = () => {
    switch(activeTab) {
      case 'Explorer':
        return <Explorer />;
      case 'Hub':
        return (
          <div className="flex flex-col gap-1 py-1">
            <CategoryHeader title="Orchestration Hub" count={1} onSync={handleQuickRAGSync} isSyncing={syncingRAG} />
            <AgentItem 
              agent="Multi-Agent Hub" 
              displayName="Multi-Agent Hub"
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick}
              onOpenRAG={handleOpenAgentRAG}
            />
          </div>
        );
      case 'Planning':
        return (
          <div className="flex flex-col gap-1 py-1">
            <CategoryHeader title="Planning & Strategy" count={3} onSync={handleQuickRAGSync} isSyncing={syncingRAG} />
            <AgentItem 
              agent="Planner Agent" 
              displayName="Planner Agent"
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick} 
              onOpenRAG={handleOpenAgentRAG}
            />
            <AgentItem 
              agent="Task Decomposer Agent" 
              displayName="Task Decomposer" 
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick} 
              onOpenRAG={handleOpenAgentRAG}
            />
            <AgentItem 
              agent="Goal Manager Agent" 
              displayName="Goal Manager" 
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick} 
              onOpenRAG={handleOpenAgentRAG}
            />
          </div>
        );
      case 'Research':
        return (
          <div className="flex flex-col gap-1 py-1">
            <CategoryHeader title="Research & Discovery" count={4} onSync={handleQuickRAGSync} isSyncing={syncingRAG} />
            <AgentItem 
              agent="Web Search Agent" 
              displayName="Web Research" 
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick} 
              onOpenRAG={handleOpenAgentRAG}
            />
            <AgentItem 
              agent="Academic Research Agent" 
              displayName="Academic Research" 
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick} 
              onOpenRAG={handleOpenAgentRAG}
            />
            <AgentItem 
              agent="Browser Agent" 
              displayName="Browser Agent"
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick} 
              onOpenRAG={handleOpenAgentRAG}
            />
            <AgentItem 
              agent="News Agent" 
              displayName="News Agent"
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick} 
              onOpenRAG={handleOpenAgentRAG}
            />
          </div>
        );
      case 'Execution':
        return (
          <div className="flex flex-col gap-1 py-1">
            <CategoryHeader title="Software & Execution" count={4} onSync={handleQuickRAGSync} isSyncing={syncingRAG} />
            <AgentItem 
              agent="Code Agent" 
              displayName="Code Architect"
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick} 
              onOpenRAG={handleOpenAgentRAG}
            />
            <AgentItem 
              agent="Python Agent" 
              displayName="Python Specialist"
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick} 
              onOpenRAG={handleOpenAgentRAG}
            />
            <AgentItem 
              agent="Executor Agent" 
              displayName="API Executor" 
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick} 
              onOpenRAG={handleOpenAgentRAG}
            />
            <AgentItem 
              agent="Automation Agent" 
              displayName="Automation Agent"
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick} 
              onOpenRAG={handleOpenAgentRAG}
            />
          </div>
        );
      case 'Analysis':
        return (
          <div className="flex flex-col gap-1 py-1">
            <CategoryHeader title="Analysis & QA" count={5} onSync={handleQuickRAGSync} isSyncing={syncingRAG} />
            <AgentItem 
              agent="Data Analysis Agent" 
              displayName="Data Analysis" 
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick} 
              onOpenRAG={handleOpenAgentRAG}
            />
            <AgentItem 
              agent="Visualization Agent" 
              displayName="Visualization"
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick} 
              onOpenRAG={handleOpenAgentRAG}
            />
            <AgentItem 
              agent="Validation Agent" 
              displayName="Validation QA"
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick} 
              onOpenRAG={handleOpenAgentRAG}
            />
            <AgentItem 
              agent="Reviewer Agent" 
              displayName="Code Reviewer"
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick} 
              onOpenRAG={handleOpenAgentRAG}
            />
            <AgentItem 
              agent="Tester Agent" 
              displayName="Tester Agent"
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick} 
              onOpenRAG={handleOpenAgentRAG}
            />
          </div>
        );
      case 'Reporting':
        return (
          <div className="flex flex-col gap-1 py-1">
            <CategoryHeader title="Reporting & Presentation" count={4} onSync={handleQuickRAGSync} isSyncing={syncingRAG} />
            <AgentItem 
              agent="Report Generator Agent" 
              displayName="Report Generator" 
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick} 
              onOpenRAG={handleOpenAgentRAG}
            />
            <AgentItem 
              agent="Presentation Agent" 
              displayName="Presentation"
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick} 
              onOpenRAG={handleOpenAgentRAG}
            />
            <AgentItem 
              agent="Designer Agent" 
              displayName="UI/UX Designer"
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick} 
              onOpenRAG={handleOpenAgentRAG}
            />
            <AgentItem 
              agent="Export Agent" 
              displayName="Data Export" 
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick} 
              onOpenRAG={handleOpenAgentRAG}
            />
          </div>
        );
      case 'Monitoring':
        return (
          <div className="flex flex-col gap-1 py-1">
            <CategoryHeader title="Monitoring & Telemetry" count={4} onSync={handleQuickRAGSync} isSyncing={syncingRAG} />
            <AgentItem 
              agent="Live Workflow Agent" 
              displayName="Live Workflow" 
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick} 
              onOpenRAG={handleOpenAgentRAG}
            />
            <AgentItem 
              agent="Agent Communication Agent" 
              displayName="Agent Network" 
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick} 
              onOpenRAG={handleOpenAgentRAG}
            />
            <AgentItem 
              agent="Logs Agent" 
              displayName="System Logs" 
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick} 
              onOpenRAG={handleOpenAgentRAG}
            />
            <AgentItem 
              agent="Events Agent" 
              displayName="Event Stream" 
              activeAgent={activeAgent} 
              handleAgentClick={handleAgentClick} 
              onOpenRAG={handleOpenAgentRAG}
            />
          </div>
        );
      case 'Projects':
        return <div className="p-4 text-text-secondary text-sm">Projects List</div>;
      case 'Settings':
        return (
          <div className="p-4 text-text-secondary text-xs flex flex-col gap-3">
            <div className="font-semibold text-white">System Settings</div>
            <p className="text-[11px] text-gray-400">
              RAG grounding is active on all agents in your workspace. Select any agent from the categories to view or configure its vector knowledge memory.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-14 right-6 z-[9999] bg-[#0d0d0d]/90 backdrop-blur-xl border border-red-500/30 text-white px-5 py-3 rounded-xl shadow-[0_10px_40px_rgba(239,68,68,0.15)] text-sm flex items-center gap-3"
          >
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
            </div>
            <span className="font-medium">Workspace required to initialize agents.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-full border-r border-white/5 shrink-0 z-20 bg-[#0a0a0a]">
        {/* Activity Bar (Icons only - RAG is embedded into each agent) */}
        <aside className="w-14 shrink-0 bg-[#050505] flex flex-col items-center py-3 h-full border-r border-white/5 z-10 relative">
          <ActivityIcon icon={<Home size={20} strokeWidth={1.5} />} label="Explorer" isActive={activeTab === 'Explorer'} onClick={() => handleTabClick('Explorer')} />
          <ActivityIcon icon={<Users size={20} strokeWidth={1.5} />} label="Multi-Agent Hub" isActive={activeTab === 'Hub'} onClick={() => handleTabClick('Hub')} />
          <ActivityIcon icon={<BrainCircuit size={20} strokeWidth={1.5} />} label="Planning" isActive={activeTab === 'Planning'} onClick={() => handleTabClick('Planning')} />
          <ActivityIcon icon={<Search size={20} strokeWidth={1.5} />} label="Research" isActive={activeTab === 'Research'} onClick={() => handleTabClick('Research')} />
          <ActivityIcon icon={<Cog size={20} strokeWidth={1.5} />} label="Execution" isActive={activeTab === 'Execution'} onClick={() => handleTabClick('Execution')} />
          <ActivityIcon icon={<BarChart2 size={20} strokeWidth={1.5} />} label="Analysis" isActive={activeTab === 'Analysis'} onClick={() => handleTabClick('Analysis')} />
          <ActivityIcon icon={<FileText size={20} strokeWidth={1.5} />} label="Reporting" isActive={activeTab === 'Reporting'} onClick={() => handleTabClick('Reporting')} />
          <ActivityIcon icon={<Activity size={20} strokeWidth={1.5} />} label="Monitoring" isActive={activeTab === 'Monitoring'} onClick={() => handleTabClick('Monitoring')} />
          
          <div className="flex-1" />
          
          <ActivityIcon icon={<Network size={20} strokeWidth={1.5} />} label="Workflow Config" isActive={isWorkflowOpen} onClick={toggleWorkflow} />
          <div className="w-8 h-px bg-white/10 my-1" />
          <ActivityIcon icon={<Folder size={20} strokeWidth={1.5} />} label="Projects" isActive={activeTab === 'Projects'} onClick={() => handleTabClick('Projects')} />
          <ActivityIcon icon={<Settings size={20} strokeWidth={1.5} />} label="Settings" isActive={activeTab === 'Settings'} onClick={() => handleTabClick('Settings')} />
        </aside>

        {/* Primary Sidebar (Panel) */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && activeTab && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="shrink-0 bg-[#0a0a0a] flex flex-col h-full custom-scrollbar select-none overflow-hidden border-r border-white/5"
            >
              <div className="px-4 py-3.5 text-[11px] font-bold tracking-widest text-text-secondary uppercase border-b border-white/5 flex items-center justify-between bg-[#0d0d0d]/50">
                <span>{activeTab}</span>
                <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  RAG Active
                </span>
              </div>
              <div className="flex-1 overflow-y-auto pt-2 pb-4 w-[260px]">
                {renderPanelContent()}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
