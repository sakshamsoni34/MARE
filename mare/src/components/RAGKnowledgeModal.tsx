'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  BrainCircuit, 
  Search, 
  Plus, 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  X, 
  FileText, 
  Sparkles, 
  Cpu, 
  Layers, 
  Zap,
  ExternalLink,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, Agent } from '@/store/useStore';

const ALL_AGENTS_LIST = [
  'all',
  'Multi-Agent Hub',
  'Planner Agent',
  'Task Decomposer Agent',
  'Goal Manager Agent',
  'Web Search Agent',
  'Academic Research Agent',
  'Browser Agent',
  'News Agent',
  'Code Agent',
  'Python Agent',
  'Executor Agent',
  'Automation Agent',
  'Data Analysis Agent',
  'Visualization Agent',
  'Validation Agent',
  'Reviewer Agent',
  'Designer Agent',
  'Tester Agent',
  'Report Generator Agent',
  'Presentation Agent',
  'Export Agent',
  'Live Workflow Agent',
  'Agent Communication Agent',
  'Logs Agent',
  'Events Agent',
  'Orqion'
];

export default function RAGKnowledgeModal() {
  const { isRAGModalOpen, setRAGModalOpen, ragFilterAgent, addTerminalLog } = useStore();
  
  const [activeTab, setActiveTab] = useState<'explorer' | 'tester' | 'ingest' | 'stats'>('explorer');
  const [documents, setDocuments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>(ragFilterAgent || 'all');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  // Ingest form state
  const [ingestTitle, setIngestTitle] = useState('');
  const [ingestCategory, setIngestCategory] = useState('documentation');
  const [ingestAgentTarget, setIngestAgentTarget] = useState('all');
  const [ingestContent, setIngestContent] = useState('');
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);

  // Tester state
  const [testQuery, setTestQuery] = useState('');
  const [testAgent, setTestAgent] = useState('all');
  const [testResults, setTestResults] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    if (isRAGModalOpen) {
      if (ragFilterAgent) {
        setSelectedAgentFilter(ragFilterAgent);
        setTestAgent(ragFilterAgent === 'all' ? 'all' : ragFilterAgent);
        setIngestAgentTarget(ragFilterAgent === 'all' ? 'all' : ragFilterAgent);
      }
      fetchRAGData();
    }
  }, [isRAGModalOpen, ragFilterAgent]);

  const handleAgentFilterChange = (agentName: string) => {
    setSelectedAgentFilter(agentName);
    setTestAgent(agentName);
    setIngestAgentTarget(agentName);
  };

  const fetchRAGData = async () => {
    setLoading(true);
    try {
      const [docsRes, statsRes] = await Promise.all([
        fetch('http://localhost:8555/api/rag/documents'),
        fetch('http://localhost:8555/api/rag/stats')
      ]);

      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.documents || []);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats || null);
      }
    } catch (err) {
      console.error('Failed to load RAG data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncWorkspace = async () => {
    setLoading(true);
    addTerminalLog('> Status: <span class="text-accent-yellow">Syncing workspace files to RAG vector database...</span>');
    try {
      const res = await fetch('http://localhost:8555/api/rag/reindex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ include_workspace_files: true })
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        addTerminalLog('> Status: <span class="text-accent-green">RAG Vector Store indexed all workspace files successfully.</span>');
        await fetchRAGData();
      }
    } catch (err: any) {
      addTerminalLog(`> <span class="text-accent-red">RAG Reindex Error:</span> ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`http://localhost:8555/api/rag/documents/${docId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.doc_id !== docId));
        fetchRAGData();
      }
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestTitle.trim() || !ingestContent.trim()) return;

    setIngestLoading(true);
    setIngestSuccess(null);
    try {
      const res = await fetch('http://localhost:8555/api/rag/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: ingestTitle.trim(),
          category: ingestCategory,
          agent_target: ingestAgentTarget,
          content: ingestContent.trim(),
          source: 'custom_knowledge'
        })
      });

      if (res.ok) {
        setIngestSuccess(`"${ingestTitle}" successfully indexed into RAG memory.`);
        setIngestTitle('');
        setIngestContent('');
        await fetchRAGData();
        setTimeout(() => setIngestSuccess(null), 4000);
      }
    } catch (err: any) {
      console.error('Failed to ingest document:', err);
    } finally {
      setIngestLoading(false);
    }
  };

  const handleRunRAGTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim()) return;

    setTestLoading(true);
    try {
      const res = await fetch('http://localhost:8555/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: testQuery.trim(),
          agent_name: testAgent,
          top_k: 4
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTestResults(data);
      }
    } catch (err) {
      console.error('Failed to test query:', err);
    } finally {
      setTestLoading(false);
    }
  };

  if (!isRAGModalOpen) return null;

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchFilter.toLowerCase()) || 
      doc.content_preview.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (doc.category && doc.category.toLowerCase().includes(searchFilter.toLowerCase()));
    
    const matchesAgent = 
      selectedAgentFilter === 'all' || 
      doc.agent_target === 'all' || 
      doc.agent_target.toLowerCase() === selectedAgentFilter.toLowerCase();

    return matchesSearch && matchesAgent;
  });

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[9999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-[#101012] border border-white/10 rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.8)] w-full max-w-5xl h-[88vh] max-h-[820px] flex flex-col overflow-hidden relative"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-48 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-1/4 w-80 h-40 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center shadow-inner">
              <BrainCircuit className="text-brand-400" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white tracking-wide">
                  {selectedAgentFilter === 'all' ? 'Multi-Agent RAG Knowledge Base' : `${selectedAgentFilter} • RAG Grounding & Knowledge`}
                </h2>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active & Grounded
                </span>
              </div>
              <p className="text-xs text-text-tertiary mt-0.5">
                {selectedAgentFilter === 'all'
                  ? 'Domain knowledge vectors & workspace memory powering all 26 agents'
                  : `Domain vector memory, workspace files & semantic retrieval grounding for ${selectedAgentFilter}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncWorkspace}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all cursor-pointer disabled:opacity-50"
              title="Index all workspace files into RAG"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Sync Workspace</span>
            </button>
            <button
              onClick={() => setRAGModalOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center justify-between px-6 border-b border-white/10 bg-black/20 text-xs select-none">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('explorer')}
              className={`py-3 font-medium transition-all relative ${
                activeTab === 'explorer' 
                  ? 'text-brand-400' 
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Database size={14} />
                Knowledge Base ({documents.length})
              </span>
              {activeTab === 'explorer' && (
                <motion.div layoutId="ragTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-400 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('tester')}
              className={`py-3 font-medium transition-all relative ${
                activeTab === 'tester' 
                  ? 'text-brand-400' 
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkles size={14} />
                Semantic Query Tester
              </span>
              {activeTab === 'tester' && (
                <motion.div layoutId="ragTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-400 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('ingest')}
              className={`py-3 font-medium transition-all relative ${
                activeTab === 'ingest' 
                  ? 'text-brand-400' 
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Plus size={14} />
                Add Custom Knowledge
              </span>
              {activeTab === 'ingest' && (
                <motion.div layoutId="ragTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-400 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`py-3 font-medium transition-all relative ${
                activeTab === 'stats' 
                  ? 'text-brand-400' 
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Layers size={14} />
                Engine Telemetry
              </span>
              {activeTab === 'stats' && (
                <motion.div layoutId="ragTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-400 rounded-full" />
              )}
            </button>
          </div>

          {stats && (
            <div className="hidden sm:flex items-center gap-4 text-[11px] text-text-tertiary">
              <span>{stats.total_chunks} Chunks Indexed</span>
              <span>•</span>
              <span className="text-brand-300">Hybrid Dense + BM25</span>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-black/10">
          {/* TAB 1: KNOWLEDGE EXPLORER */}
          {activeTab === 'explorer' && (
            <div className="flex flex-col gap-4">
              {/* Search & Agent Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search knowledge documents, best practices, guidelines..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-brand-500/50 focus:bg-white/[0.07] transition-all"
                  />
                  {searchFilter && (
                    <button 
                      onClick={() => setSearchFilter('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-tertiary whitespace-nowrap">Agent:</span>
                  <select
                    value={selectedAgentFilter}
                    onChange={(e) => handleAgentFilterChange(e.target.value)}
                    className="bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 outline-none focus:border-brand-500/50 cursor-pointer max-w-[200px]"
                  >
                    <option value="all">All Agents</option>
                    {ALL_AGENTS_LIST.filter(a => a !== 'all').map(agent => (
                      <option key={agent} value={agent}>{agent}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Document List */}
              {loading && documents.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-text-tertiary gap-3">
                  <RefreshCw size={24} className="animate-spin text-brand-400" />
                  <span className="text-xs">Loading indexed RAG knowledge base...</span>
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="py-16 text-center text-text-tertiary border border-dashed border-white/10 rounded-2xl p-8">
                  <BookOpen size={32} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-sm font-medium text-gray-300">No matching knowledge documents found</p>
                  <p className="text-xs text-gray-500 mt-1">Try adjusting your search query or agent filter, or add a custom document.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredDocs.map((doc) => {
                    const isExpanded = expandedDocId === doc.doc_id;
                    return (
                      <div
                        key={doc.doc_id}
                        onClick={() => setExpandedDocId(isExpanded ? null : doc.doc_id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] group relative overflow-hidden ${
                          isExpanded 
                            ? 'border-brand-500/40 shadow-[0_0_20px_rgba(139,92,246,0.1)]' 
                            : 'border-white/5 hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <FileText size={15} className="text-brand-400 shrink-0" />
                            <h4 className="text-xs font-semibold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                              {doc.title}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-gray-400 border border-white/5">
                              {doc.chunk_count} chunk{doc.chunk_count !== 1 ? 's' : ''}
                            </span>
                            {!doc.metadata?.is_default && (
                              <button
                                onClick={(e) => handleDeleteDocument(doc.doc_id, e)}
                                className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100"
                                title="Delete document"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-[11.5px] text-gray-400 line-clamp-2 leading-relaxed mb-3">
                          {doc.content_preview}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10.5px]">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full font-medium ${
                              doc.agent_target === 'all' 
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            }`}>
                              🎯 {doc.agent_target}
                            </span>
                            <span className="text-gray-500 uppercase tracking-wider text-[9.5px]">
                              {doc.category || doc.source}
                            </span>
                          </div>
                          <ChevronRight size={13} className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>

                        {/* Expanded Preview */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-300 bg-black/40 p-3 rounded-lg font-mono leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar">
                            {doc.content_preview}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SEMANTIC QUERY TESTER */}
          {activeTab === 'tester' && (
            <div className="flex flex-col gap-5">
              <form onSubmit={handleRunRAGTest} className="flex flex-col gap-3 bg-white/[0.02] border border-white/10 p-4 rounded-xl">
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <Sparkles size={14} className="text-brand-400" />
                  Test RAG Retrieval & Relevance Scoring
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                    placeholder="Enter query to retrieve grounding knowledge (e.g., 'How to structure CPM milestones?')..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-brand-500/50"
                  />
                  <select
                    value={testAgent}
                    onChange={(e) => setTestAgent(e.target.value)}
                    className="bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 outline-none"
                  >
                    <option value="all">Agent: All</option>
                    {ALL_AGENTS_LIST.filter(a => a !== 'all').map(agent => (
                      <option key={agent} value={agent}>{agent}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={testLoading || !testQuery.trim()}
                    className="px-5 py-2.5 rounded-xl text-xs font-medium bg-brand-500 hover:bg-brand-400 text-white transition-all shadow-md shadow-brand-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {testLoading ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
                    <span>Test Retrieve</span>
                  </button>
                </div>
              </form>

              {testResults && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Retrieved {testResults.retrieved_count} grounded knowledge chunks:</span>
                    <span className="font-mono text-[11px] text-brand-300">Target: {testResults.agent_name}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {testResults.sources?.map((s: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl border border-white/10 bg-white/[0.03] flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-[10px] font-mono flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-medium text-white">{s.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-white/10 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-brand-500 to-emerald-400 h-full rounded-full" 
                                style={{ width: `${s.relevance}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-mono text-emerald-400 font-bold">{s.relevance}%</span>
                          </div>
                        </div>

                        <p className="text-xs text-gray-300 leading-relaxed bg-black/30 p-3 rounded-lg font-mono">
                          {s.snippet}
                        </p>
                      </div>
                    ))}
                  </div>

                  {testResults.context_prompt_block && (
                    <div className="mt-2">
                      <h4 className="text-xs font-semibold text-gray-400 mb-2">Injected LLM Prompt Grounding Block:</h4>
                      <pre className="text-[11px] text-gray-300 bg-black/60 p-4 rounded-xl border border-white/10 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto custom-scrollbar">
                        {testResults.context_prompt_block}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADD CUSTOM KNOWLEDGE */}
          {activeTab === 'ingest' && (
            <form onSubmit={handleIngestSubmit} className="max-w-2xl mx-auto flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-white">Add Knowledge to RAG Memory</h3>
                <p className="text-xs text-text-tertiary">
                  Upload custom technical guidelines, API documentation, or architecture notes. All target agents will immediately retrieve and cite this knowledge.
                </p>
              </div>

              {ingestSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle size={15} />
                  <span>{ingestSuccess}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-300 font-medium">Document Title</label>
                <input
                  type="text"
                  required
                  value={ingestTitle}
                  onChange={(e) => setIngestTitle(e.target.value)}
                  placeholder="e.g. Next.js Architecture Guidelines 2026"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-brand-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-300 font-medium">Target Agent Specialization</label>
                  <select
                    value={ingestAgentTarget}
                    onChange={(e) => setIngestAgentTarget(e.target.value)}
                    className="bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-200 outline-none"
                  >
                    <option value="all">All Agents (Global Knowledge)</option>
                    {ALL_AGENTS_LIST.filter(a => a !== 'all').map(agent => (
                      <option key={agent} value={agent}>{agent}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-300 font-medium">Category</label>
                  <select
                    value={ingestCategory}
                    onChange={(e) => setIngestCategory(e.target.value)}
                    className="bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-200 outline-none"
                  >
                    <option value="documentation">Documentation</option>
                    <option value="engineering">Engineering / Code</option>
                    <option value="planning">Planning / Roadmaps</option>
                    <option value="research">Research & Papers</option>
                    <option value="data">Data Science / EDA</option>
                    <option value="api">API Specification</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-300 font-medium">Content / Technical Rules</label>
                <textarea
                  required
                  rows={8}
                  value={ingestContent}
                  onChange={(e) => setIngestContent(e.target.value)}
                  placeholder="Paste Markdown, technical specs, rules, schemas, or architectural guidelines here..."
                  className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white placeholder-gray-500 outline-none focus:border-brand-500/50 resize-none font-mono leading-relaxed custom-scrollbar"
                />
              </div>

              <button
                type="submit"
                disabled={ingestLoading || !ingestTitle.trim() || !ingestContent.trim()}
                className="w-full py-3 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-400 text-white transition-all shadow-lg shadow-brand-500/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {ingestLoading ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                <span>Ingest & Index into RAG Store</span>
              </button>
            </form>
          )}

          {/* TAB 4: ENGINE TELEMETRY */}
          {activeTab === 'stats' && (
            <div className="flex flex-col gap-5 max-w-3xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col gap-1">
                  <span className="text-xs text-text-tertiary uppercase tracking-wider">Total Documents</span>
                  <span className="text-2xl font-bold font-mono text-white">{stats?.total_documents || documents.length}</span>
                  <span className="text-[11px] text-emerald-400">Indexed & Active</span>
                </div>

                <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col gap-1">
                  <span className="text-xs text-text-tertiary uppercase tracking-wider">Vector Chunks</span>
                  <span className="text-2xl font-bold font-mono text-brand-400">{stats?.total_chunks || 0}</span>
                  <span className="text-[11px] text-gray-400">Normalized Subword Vectors</span>
                </div>

                <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col gap-1">
                  <span className="text-xs text-text-tertiary uppercase tracking-wider">Distinct Sources</span>
                  <span className="text-2xl font-bold font-mono text-blue-400">{stats?.sources_count || 0}</span>
                  <span className="text-[11px] text-gray-400">Domain + Files + Custom</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col gap-3">
                <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                  <Cpu size={14} className="text-brand-400" />
                  Embedding & Retrieval Pipeline
                </h4>
                <div className="flex flex-col gap-2 text-xs text-gray-300">
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400">Embedding Engine:</span>
                    <span className="font-mono text-brand-300">{stats?.embedding_engine || 'Mistral Embed + Local N-Gram'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400">Search Strategy:</span>
                    <span className="font-mono text-emerald-400">Hybrid Dense Cosine (65%) + BM25 Lexical (35%)</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400">Agent Routing:</span>
                    <span className="font-mono text-blue-400">Dynamic Domain Boosting (+20% specificity bonus)</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-gray-400">Workspace Auto-Sync:</span>
                    <span className="font-mono text-purple-400">Enabled on all file save & sync events</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
