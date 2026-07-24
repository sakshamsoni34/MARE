import React, { useState } from 'react';
import { Home, Bot, BrainCircuit, Search, Settings, BarChart2, FileText, Activity, Folder, Cog, Network } from 'lucide-react';
import { useStore, Agent } from '@/store/useStore';
import Explorer from '@/components/Explorer';

type ActivityTab = 'Explorer' | 'Planning' | 'Research' | 'Execution' | 'Analysis' | 'Reporting' | 'Monitoring' | 'Projects' | 'Settings';

export default function Sidebar() {
  const { activeAgent, setActiveAgent, addOpenAgent, toggleWorkflow, isWorkflowOpen, activeProject } = useStore();
  const [activeTab, setActiveTab] = useState<ActivityTab>('Planning');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const [showToast, setShowToast] = useState(false);

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
      setIsPanelOpen(!isPanelOpen);
    } else {
      setActiveTab(tab);
      setIsPanelOpen(true);
    }
  };

  const ActivityIcon = ({ icon, label, isActive, onClick }: any) => (
    <div
      onClick={onClick}
      title={label}
      className={`flex items-center justify-center w-12 h-12 cursor-pointer transition-colors relative text-text-secondary hover:text-white ${isActive ? 'text-white' : ''}`}
    >
      {isActive && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-brand-400" />}
      {icon}
    </div>
  );

  const StaticItem = ({ label }: { label: string }) => (
    <div className="flex items-center gap-2 rounded-md px-3 py-1.5 ml-1 cursor-pointer text-text-secondary hover:bg-[var(--color-bg-tertiary)] hover:text-white transition-colors">
      <div className="w-1.5 h-1.5 rounded-full bg-text-tertiary" />
      <span className="text-[13px]">{label}</span>
    </div>
  );

  const AgentItem = ({ agent, displayName }: { agent: string, displayName?: string }) => {
    const isActive = activeAgent === agent;
    return (
      <div
        onClick={() => handleAgentClick(agent as Agent)}
        className={`flex items-center gap-2 rounded-md px-3 py-1.5 ml-1 cursor-pointer transition-colors ${
          isActive 
            ? 'bg-brand-500/10 text-brand-400' 
            : 'text-text-secondary hover:bg-[var(--color-bg-tertiary)] hover:text-white'
        }`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-brand-400' : 'bg-text-tertiary'}`} />
        <span className="text-[13px]">{displayName || agent.replace(' Agent', '')}</span>
      </div>
    );
  };

  const renderPanelContent = () => {
    switch(activeTab) {
      case 'Explorer':
        return <Explorer />;
      case 'Planning':
        return (
          <div className="flex flex-col gap-0.5 p-2">
            <AgentItem agent="Planner Agent" />
            <AgentItem agent="Task Decomposer Agent" displayName="Task Decomposer" />
            <AgentItem agent="Goal Manager Agent" displayName="Goal Manager" />
          </div>
        );
      case 'Research':
        return (
          <div className="flex flex-col gap-0.5 p-2">
            <AgentItem agent="Web Search Agent" displayName="Web Research Agent" />
            <AgentItem agent="Academic Research Agent" displayName="Academic Research Agent" />
            <AgentItem agent="Browser Agent" />
            <AgentItem agent="News Agent" />
          </div>
        );
      case 'Execution':
        return (
          <div className="flex flex-col gap-0.5 p-2">
            <AgentItem agent="Code Agent" />
            <AgentItem agent="Python Agent" />
            <AgentItem agent="Executor Agent" displayName="API Agent" />
            <AgentItem agent="Automation Agent" />
          </div>
        );
      case 'Analysis':
        return (
          <div className="flex flex-col gap-0.5 p-2">
            <AgentItem agent="Data Analysis Agent" />
            <AgentItem agent="Visualization Agent" />
            <AgentItem agent="Validation Agent" />
          </div>
        );
      case 'Reporting':
        return (
          <div className="flex flex-col gap-0.5 p-2">
            <AgentItem agent="Report Generator Agent" displayName="Report Generator" />
            <AgentItem agent="Presentation Agent" />
            <AgentItem agent="Export Agent" displayName="Export" />
          </div>
        );
      case 'Monitoring':
        return (
          <div className="flex flex-col gap-0.5 p-2">
            <AgentItem agent="Live Workflow Agent" displayName="Live Workflow" />
            <AgentItem agent="Agent Communication Agent" displayName="Agent Communication" />
            <AgentItem agent="Logs Agent" displayName="Logs" />
            <AgentItem agent="Events Agent" displayName="Events" />
          </div>
        );
      case 'Projects':
        return <div className="p-4 text-text-secondary text-sm">Projects List</div>;
      case 'Settings':
        return <div className="p-4 text-text-secondary text-sm">Settings Configuration</div>;
      default:
        return null;
    }
  };

  return (
    <>
      {showToast && (
        <div className="fixed top-12 right-6 z-[9999] bg-[#1e1e1e] border border-[#2d2d2d] border-l-4 border-l-red-500 text-[#e0e0e0] px-5 py-3 rounded shadow-2xl text-sm flex items-center gap-3 transition-all duration-300 animate-in fade-in slide-in-from-right-8">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>Please select or create a project folder to use agents.</span>
        </div>
      )}
      <div className="flex h-full border-r border-[var(--color-border-primary)] shrink-0 z-20 bg-[var(--color-bg-secondary)]">
      {/* Activity Bar (Icons only) */}
      <aside className="w-12 shrink-0 bg-[#1e1e1e] flex flex-col items-center py-2 h-full border-r border-[#2d2d2d] z-10">
        <ActivityIcon icon={<Home size={22} strokeWidth={1.5} />} label="Explorer" isActive={activeTab === 'Explorer'} onClick={() => handleTabClick('Explorer')} />
        <ActivityIcon icon={<BrainCircuit size={22} strokeWidth={1.5} />} label="Planning" isActive={activeTab === 'Planning'} onClick={() => handleTabClick('Planning')} />
        <ActivityIcon icon={<Search size={22} strokeWidth={1.5} />} label="Research" isActive={activeTab === 'Research'} onClick={() => handleTabClick('Research')} />
        <ActivityIcon icon={<Cog size={22} strokeWidth={1.5} />} label="Execution" isActive={activeTab === 'Execution'} onClick={() => handleTabClick('Execution')} />
        <ActivityIcon icon={<BarChart2 size={22} strokeWidth={1.5} />} label="Analysis" isActive={activeTab === 'Analysis'} onClick={() => handleTabClick('Analysis')} />
        <ActivityIcon icon={<FileText size={22} strokeWidth={1.5} />} label="Reporting" isActive={activeTab === 'Reporting'} onClick={() => handleTabClick('Reporting')} />
        <ActivityIcon icon={<Activity size={22} strokeWidth={1.5} />} label="Monitoring" isActive={activeTab === 'Monitoring'} onClick={() => handleTabClick('Monitoring')} />
        
        <div className="flex-1" />
        
        <ActivityIcon icon={<Network size={22} strokeWidth={1.5} />} label="Workflow Config" isActive={isWorkflowOpen} onClick={toggleWorkflow} />
        <ActivityIcon icon={<Folder size={22} strokeWidth={1.5} />} label="Projects" isActive={activeTab === 'Projects'} onClick={() => handleTabClick('Projects')} />
        <ActivityIcon icon={<Settings size={22} strokeWidth={1.5} />} label="Settings" isActive={activeTab === 'Settings'} onClick={() => handleTabClick('Settings')} />
      </aside>

      {/* Primary Sidebar (Panel) */}
      {isPanelOpen && (
        <aside className="w-56 shrink-0 bg-[var(--color-bg-secondary)] flex flex-col h-full overflow-y-auto custom-scrollbar select-none">
          <div className="px-4 py-3 text-xs font-semibold tracking-wider text-text-primary uppercase border-b border-[var(--color-border-primary)]/50">
            {activeTab}
          </div>
          <div className="flex-1 overflow-y-auto pt-2">
            {renderPanelContent()}
          </div>
        </aside>
      )}
      </div>
    </>
  );
}

