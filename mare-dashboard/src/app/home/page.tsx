'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  FolderPlus, 
  FileUp, 
  Network, 
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Files,
  Search,
  GitBranch,
  Play,
  Settings,
  User,
  Activity,
  Box,
  FileCode2,
  TerminalSquare
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  const handleCreateProject = () => {
    // When the user interacts (e.g. creates folder), navigate to the dashboard
    router.push('/dashboard');
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#0d0d12] text-slate-300 font-sans selection:bg-blue-500/30">
      
      {/* Top Menu Bar - Minimalist VSCode Style */}
      <header className="flex h-8 shrink-0 items-center justify-between bg-[#181824] px-3 text-xs text-slate-400 border-b border-[#2d2d3d]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Network size={10} className="text-blue-400" />
            </div>
            <span className="hover:text-slate-200 cursor-pointer">File</span>
            <span className="hover:text-slate-200 cursor-pointer">Edit</span>
            <span className="hover:text-slate-200 cursor-pointer">Selection</span>
            <span className="hover:text-slate-200 cursor-pointer">View</span>
            <span className="hover:text-slate-200 cursor-pointer">Go</span>
            <span className="hover:text-slate-200 cursor-pointer">Run</span>
            <span className="hover:text-slate-200 cursor-pointer">Terminal</span>
            <span className="hover:text-slate-200 cursor-pointer">Agents</span>
            <span className="hover:text-slate-200 cursor-pointer">Help</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-500 font-medium">NEXUS Agent Hub</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
             <div className="w-3 h-3 rounded-full bg-[#2d2d3d] hover:bg-slate-400 cursor-pointer transition-colors"></div>
             <div className="w-3 h-3 rounded-full bg-[#2d2d3d] hover:bg-slate-400 cursor-pointer transition-colors"></div>
             <div className="w-3 h-3 rounded-full bg-[#2d2d3d] hover:bg-slate-400 cursor-pointer transition-colors"></div>
          </div>
        </div>
      </header>

      {/* Main App Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Activity Bar (Far Left) */}
        <div className="w-12 shrink-0 bg-[#181824] border-r border-[#2d2d3d] flex flex-col items-center py-4 gap-6 text-slate-500">
          <Files size={24} className="text-slate-300 cursor-pointer" />
          <Search size={22} className="cursor-pointer hover:text-slate-300 transition-colors" />
          <GitBranch size={22} className="cursor-pointer hover:text-slate-300 transition-colors" />
          <Play size={22} className="cursor-pointer hover:text-slate-300 transition-colors" />
          <TerminalSquare size={22} className="cursor-pointer hover:text-slate-300 transition-colors" />
          <Box size={22} className="cursor-pointer hover:text-slate-300 transition-colors" />
          
          <div className="mt-auto flex flex-col gap-6 items-center">
            <User size={22} className="cursor-pointer hover:text-slate-300 transition-colors" />
            <Settings size={22} className="cursor-pointer hover:text-slate-300 transition-colors" />
          </div>
        </div>

        {/* Explorer Sidebar */}
        <div className="w-72 shrink-0 bg-[#12121a] border-r border-[#2d2d3d] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 text-xs font-semibold tracking-wider text-slate-300 uppercase">
            <span>Agent Environment Explorer</span>
            <MoreHorizontal size={16} className="cursor-pointer hover:text-white" />
          </div>

          <div className="flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-[#1e1e2d]">
            <ChevronDown size={16} />
            <span className="text-sm font-medium">No Folder Opened</span>
          </div>

          <div className="px-6 py-4 flex flex-col gap-4 text-sm">
            <p className="font-medium text-slate-200">No Multi-Agent Project Initiated</p>
            <p className="text-slate-400 leading-relaxed text-xs">
              Welcome to the Nexus Multi-Agent Hub.
            </p>
            <p className="text-slate-400 leading-relaxed text-xs">
              You have not yet initialized or loaded a multi-agent project. You can start a new project from scratch or import existing research workflow files.
            </p>
            
            <button 
              onClick={handleCreateProject}
              className="mt-2 w-full bg-[#0e639c] hover:bg-[#1177bb] text-white py-1.5 rounded text-sm transition-colors shadow-sm"
            >
              Create New Project
            </button>
            <button 
              onClick={handleCreateProject}
              className="w-full bg-[#30303d] hover:bg-[#3b3b4f] text-slate-200 py-1.5 rounded text-sm transition-colors border border-[#454558]"
            >
              Import Workflow File
            </button>
            
            <p className="text-slate-400 text-xs leading-relaxed mt-2">
              To learn more about agent coordination and system configuration in the engine, <a href="#" className="text-[#3794ff] hover:underline">read our docs</a>.
            </p>
          </div>
          
          <div className="mt-auto border-t border-[#2d2d3d]">
            <div className="flex items-center gap-1 px-2 py-2 cursor-pointer hover:bg-[#1e1e2d] border-b border-[#2d2d3d]">
              <ChevronRight size={16} className="text-slate-500" />
              <span className="text-xs font-medium text-slate-400">Outline</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-2 cursor-pointer hover:bg-[#1e1e2d]">
              <ChevronRight size={16} className="text-slate-500" />
              <span className="text-xs font-medium text-slate-400">Timeline</span>
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 bg-[#0d0d12] relative flex flex-col items-center justify-center p-8 overflow-y-auto">
          
          {/* Subtle Grid / Network Background */}
          <div className="absolute inset-0 pointer-events-none opacity-20"
               style={{
                 backgroundImage: `linear-gradient(to right, #ffffff05 1px, transparent 1px), linear-gradient(to bottom, #ffffff05 1px, transparent 1px)`,
                 backgroundSize: '40px 40px'
               }}
          ></div>
          <div className="absolute inset-0 pointer-events-none"
               style={{
                 background: 'radial-gradient(circle at center, rgba(56, 189, 248, 0.05) 0%, transparent 70%)'
               }}
          ></div>

          {/* User Avatar Top Right */}
          <div className="absolute top-6 right-6">
            <div className="w-12 h-12 rounded-full border-2 border-slate-700 overflow-hidden shadow-lg shadow-black/50 bg-slate-800 flex items-center justify-center">
               <User size={24} className="text-slate-400" />
            </div>
          </div>

          <div className="z-10 flex flex-col items-center max-w-2xl w-full">
            
            {/* Logo Graphic */}
            <div className="mb-8 relative flex items-center justify-center w-40 h-40">
              <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl"></div>
              <Network size={120} className="text-slate-300 drop-shadow-[0_0_15px_rgba(56,189,248,0.3)]" strokeWidth={1} />
              <div className="absolute center w-8 h-8 rounded-full bg-blue-400/20 animate-pulse blur-md"></div>
              <div className="absolute center w-3 h-3 rounded-full bg-blue-300 shadow-[0_0_10px_#93c5fd]"></div>
            </div>

            <h1 className="text-3xl font-light text-slate-200 tracking-wide mb-4">
              NEXUS Agent Hub
            </h1>
            
            <p className="text-center text-slate-400 mb-10 text-sm max-w-lg leading-relaxed">
              A powerful engine for deploying, monitoring, and analyzing complex multi-agent systems and research experiments.
            </p>

            <div className="flex flex-col gap-3 w-full max-w-sm mb-12">
              <button 
                onClick={handleCreateProject}
                className="flex items-center justify-center gap-2 w-full bg-[#0e639c] hover:bg-[#1177bb] text-white py-2.5 rounded-md text-sm font-medium transition-colors shadow-[0_0_15px_rgba(14,99,156,0.3)]"
              >
                <FolderPlus size={16} />
                Launch New Agent Team
              </button>
              <button 
                onClick={handleCreateProject}
                className="flex items-center justify-center gap-2 w-full bg-[#2a2a35] hover:bg-[#353545] text-slate-300 py-2.5 rounded-md text-sm font-medium transition-colors border border-[#3b3b4f]"
              >
                <FileUp size={16} />
                Import Research Workflow
              </button>
            </div>

            <div className="w-full max-w-lg">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-1">
                Recent Agent Executions
              </h3>
              
              <div className="flex flex-col gap-2">
                {[
                  {
                    id: 'PROJECT',
                    title: 'EXECUTION-001 | Swarm Intelligence Simulation',
                    path: 'C:\\Nexus\\Data\\simulations\\swarm1'
                  },
                  {
                    id: 'APL',
                    title: 'EXECUTION-002 | Autonomous Web Research Task',
                    path: 'C:\\Nexus\\Data\\experiments\\web_search'
                  },
                  {
                    id: 'AI-PDF-CHATBOT',
                    title: 'AGENT-DEV-01 | Natural Language Subsystem Testing',
                    path: 'C:\\Nexus\\Models\\core\\nlp_test'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="bg-[#1e1e2d] hover:bg-[#252536] border border-[#2d2d3d] p-3 rounded-md cursor-pointer transition-colors group">
                    <div className="text-xs text-slate-400 font-mono mb-1">{item.id}</div>
                    <div className="text-sm text-slate-200 group-hover:text-blue-400 transition-colors">{item.title}</div>
                    <div className="text-xs text-slate-500 font-mono mt-1 truncate">{item.path}</div>
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-6">
                <span className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer">Show More...</span>
              </div>
            </div>

          </div>
          
          <div className="absolute bottom-10 right-10 text-slate-700 animate-pulse">
             <div className="w-16 h-16 relative">
                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-16 bg-slate-800 rotate-45 rounded"></div>
                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-16 bg-slate-800 -rotate-45 rounded"></div>
             </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <footer className="flex h-6 shrink-0 items-center justify-between bg-[#0e639c] px-3 text-[11px] text-white">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 hover:bg-white/20 px-1.5 py-0.5 rounded cursor-pointer">
            <span className="bg-[#1177bb] px-1 rounded mr-1">{"><_"}</span>
            0
          </div>
          <div className="flex items-center gap-1 hover:bg-white/20 px-1.5 py-0.5 rounded cursor-pointer">
            <span className="text-white">⚠</span> 0
          </div>
          <div className="flex items-center gap-1 hover:bg-white/20 px-1.5 py-0.5 rounded cursor-pointer">
            <Activity size={12} />
          </div>
          <div className="flex items-center gap-2 hover:bg-white/20 px-1.5 py-0.5 rounded cursor-pointer">
            <FileCode2 size={12} />
            <span>(no project) (ready to initialize project)</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 hover:bg-white/20 px-1.5 py-0.5 rounded cursor-pointer">
            <User size={12} />
            <span>Nexus Engine Settings</span>
          </div>
          <div className="flex items-center gap-1.5 hover:bg-white/20 px-1.5 py-0.5 rounded cursor-pointer">
            <Bell size={12} />
          </div>
        </div>
      </footer>
    </div>
  );
}

// Just importing Bell for the footer
import { Bell } from 'lucide-react';
