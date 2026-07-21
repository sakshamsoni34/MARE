import React, { useState, useEffect } from 'react';
import { Folder, Play, Settings, Database, BookOpen, BrainCircuit, Code, Eye, Pause, Plus, Activity, User, Box, ShieldCheck, Zap, X } from 'lucide-react';
import { useStore, Agent } from '@/store/useStore';

export default function Sidebar() {
  const { activeProject, setActiveProject, activeAgent, setActiveAgent, projects, createNewProject, deleteProject } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [contextMenuInfo, setContextMenuInfo] = useState<{x: number, y: number, projectName: string} | null>(null);

  useEffect(() => {
    const handleClick = () => setContextMenuInfo(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectGoal, setNewProjectGoal] = useState('Data Analysis');
  const [newProjectSource, setNewProjectSource] = useState('');
  const [newProjectPriority, setNewProjectPriority] = useState('Medium');

  const handleNewResearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName && newProjectName.trim()) {
      if (typeof createNewProject === 'function') {
        createNewProject(newProjectName.trim(), newProjectDesc.trim(), newProjectGoal, newProjectSource.trim(), newProjectPriority);
      } else {
        // Fallback for hot-reload without alert
        window.location.reload();
      }
      setIsModalOpen(false);
      setNewProjectName('');
      setNewProjectDesc('');
      setNewProjectGoal('Data Analysis');
      setNewProjectSource('');
      setNewProjectPriority('Medium');
    }
  };

  const agents: { name: Agent, icon: React.ReactNode, statusIcon: React.ReactNode }[] = [
    { name: 'Researcher Agent', icon: <BookOpen size={18} />, statusIcon: <Activity size={14} className="text-brand-400" /> },
    { name: 'Coder Agent', icon: <Code size={18} />, statusIcon: <Play size={14} className="text-text-tertiary group-hover:text-white transition-colors" /> },
    { name: 'Planner Agent', icon: <BrainCircuit size={18} />, statusIcon: <Play size={14} className="text-accent-green" /> },
    { name: 'Executor Agent', icon: <Box size={18} />, statusIcon: <Pause size={14} className="text-accent-yellow" /> },
    { name: 'Reviewer Agent', icon: <ShieldCheck size={18} />, statusIcon: <Play size={14} className="text-text-tertiary group-hover:text-white transition-colors" /> },
    { name: 'Designer Agent', icon: <Eye size={18} />, statusIcon: <Play size={14} className="text-text-tertiary group-hover:text-white transition-colors" /> },
    { name: 'Tester Agent', icon: <Activity size={18} />, statusIcon: <Play size={14} className="text-text-tertiary group-hover:text-white transition-colors" /> },
  ];

  return (
    <aside className="w-72 shrink-0 border-r border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] flex flex-col">
      <div className="p-5">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] py-2.5 text-sm font-medium text-text-secondary hover:bg-[var(--color-bg-tertiary)] hover:border-brand-500/50 hover:text-white transition-all shadow-sm"
        >
          <Plus size={16} /> New Project
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 px-3 py-2 text-sm font-semibold tracking-wider text-text-secondary uppercase">
            <span>Projects</span>
          </div>
          <div className="ml-4 mt-2 flex flex-col gap-1.5">
            {(projects || []).map((proj) => (
              <div
                key={proj}
                onClick={() => setActiveProject(proj)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenuInfo({ x: e.pageX, y: e.pageY, projectName: proj });
                }}
                className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors ${activeProject === proj ? 'bg-[var(--color-bg-tertiary)] text-brand-400' : 'text-text-primary hover:bg-[var(--color-bg-tertiary)]'}`}
              >
                <Folder size={18} className={activeProject === proj ? 'text-brand-400' : 'text-text-tertiary'} />
                <span className="text-sm">{proj}</span>
              </div>
            ))}
          </div>
        </div>


      </div>

      {/* New Research Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[450px] rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Create New Research</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-text-tertiary hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleNewResearch} className="p-6">
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-text-secondary">Research Name <span className="text-accent-red">*</span></label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g., Q3 Market Analysis"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full rounded-md border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-4 py-2 text-sm text-text-primary outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-text-secondary">Description (Optional)</label>
                <textarea
                  placeholder="Brief context for the agents..."
                  rows={2}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full resize-none rounded-md border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-4 py-2 text-sm text-text-primary outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div className="mb-4 flex gap-4">
                <div className="flex-1">
                  <label className="mb-2 block text-sm font-medium text-text-secondary">Primary Goal</label>
                  <select
                    value={newProjectGoal}
                    onChange={(e) => setNewProjectGoal(e.target.value)}
                    className="w-full rounded-md border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-4 py-2 text-sm text-text-primary outline-none focus:border-brand-500 transition-colors"
                  >
                    <option value="Data Analysis">Data Analysis</option>
                    <option value="Literature Review">Literature Review</option>
                    <option value="Code Generation">Code Generation</option>
                    <option value="Security Audit">Security Audit</option>
                    <option value="General Assistant">General Assistant</option>
                  </select>
                </div>
                <div className="w-1/3">
                  <label className="mb-2 block text-sm font-medium text-text-secondary">Priority</label>
                  <select
                    value={newProjectPriority}
                    onChange={(e) => setNewProjectPriority(e.target.value)}
                    className="w-full rounded-md border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-4 py-2 text-sm text-text-primary outline-none focus:border-brand-500 transition-colors"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-text-secondary">Data Source / URL (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., https://api.example.com/data or s3://bucket"
                  value={newProjectSource}
                  onChange={(e) => setNewProjectSource(e.target.value)}
                  className="w-full rounded-md border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-4 py-2 text-sm text-text-primary outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-[var(--color-border-primary)] px-5 py-2 text-sm font-medium text-text-secondary hover:bg-[var(--color-bg-tertiary)] hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newProjectName.trim()}
                  className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white shadow-md hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Create Research
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[400px] rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] shadow-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-2">Delete Research</h2>
            <p className="text-sm text-text-secondary mb-6">
              Are you sure you want to permanently delete the research project 
              <span className="text-white font-medium ml-1">"{projectToDelete}"</span>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="rounded-lg border border-[var(--color-border-primary)] px-5 py-2 text-sm font-medium text-text-secondary hover:bg-[var(--color-bg-tertiary)] hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteProject(projectToDelete);
                  setProjectToDelete(null);
                }}
                className="rounded-lg bg-accent-red px-5 py-2 text-sm font-medium text-white shadow-md hover:bg-accent-red/80 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Context Menu */}
      {contextMenuInfo && (
        <div 
          className="fixed z-[100] w-40 rounded-md border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] shadow-xl py-1 overflow-hidden"
          style={{ top: contextMenuInfo.y, left: contextMenuInfo.x }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setProjectToDelete(contextMenuInfo.projectName);
              setContextMenuInfo(null);
            }}
            className="flex w-full items-center px-4 py-2 text-sm text-accent-red hover:bg-[var(--color-bg-tertiary)] transition-colors text-left font-medium"
          >
            Delete Project
          </button>
        </div>
      )}
    </aside>
  );
}
