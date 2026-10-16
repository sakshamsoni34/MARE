import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Play, 
  Save, 
  Plus, 
  Mic, 
  AudioLines, 
  X, 
  Maximize2, 
  FileText, 
  Bot, 
  Trash2, 
  Send, 
  Loader2, 
  History, 
  MoreHorizontal,
  BrainCircuit,
  Sparkles,
  Layers,
  CheckCircle2,
  ExternalLink,
  Copy,
  ArrowUpRight,
  Code2,
  Search,
  ShieldCheck,
  Zap,
  ArrowUp,
  ArrowDown,
  CornerRightUp,
  ChevronDown,
  ChevronUp,
  Compass,
  FolderPlus,
  Network,
  Workflow,
  Cpu,
  Orbit
} from 'lucide-react';
import { useStore, Agent, FileSystemNode } from '@/store/useStore';
import { useSession } from 'next-auth/react';

interface ChatInterfaceProps {
  agent: Agent;
}

const AGENT_CONFIGS: Record<string, { description: string, prompts: string[] }> = {
  'Researcher Agent': {
    description: "I gather, analyze, and synthesize information grounded in peer-reviewed science and technical documentation.",
    prompts: ["Find latest research on AI Agent Workflows", "Summarize the architecture", "Find sources for our design", "Extract key empirical data points"]
  },
  'Planner Agent': {
    description: "I structure projects, break down goals via CPM/WBS, and create resilient roadmaps.",
    prompts: ["Create a project roadmap with CPM", "Decompose milestones and quality gates", "What are the critical dependencies?", "Draft an executive execution plan"]
  },
  'Executor Agent': {
    description: "I execute tasks, orchestrate APIs, and manage integrations according to the plan.",
    prompts: ["Execute the next deployment step", "Run the API integration pipeline", "Process the task queue", "Complete pending execution actions"]
  },
  'Reviewer Agent': {
    description: "I review code and documents for quality, security, and architectural best practices.",
    prompts: ["Review this implementation", "Audit for security vulnerabilities", "Suggest performance optimizations", "Verify framework compliance"]
  },
  'Designer Agent': {
    description: "I design modern, high-contrast UI/UX layouts, color palettes, and component systems.",
    prompts: ["Suggest a glassmorphic color palette", "Design dashboard layout hierarchy", "Improve micro-animations", "Create responsive component specs"]
  },
  'Tester Agent': {
    description: "I generate test cases, run QA matrices, and discover boundary edge cases.",
    prompts: ["Generate comprehensive unit tests", "Test API edge cases and limits", "Design fuzzing test scenarios", "Run regression verification"]
  },
  'Task Decomposer Agent': {
    description: "I break complex strategic plans into atomic, parallelizable units and dependency DAGs.",
    prompts: ["Decompose this feature into atomic tasks", "Create a dependency DAG", "Identify parallel tasks", "Order by topological sort"]
  },
  'Goal Manager Agent': {
    description: "I track OKRs, detect scope drift, mitigate blockers, and verify milestone gates.",
    prompts: ["Check project OKR progress", "Detect any scope creep or drift", "Resolve current blockers", "Generate milestone status report"]
  },
  'Web Search Agent': {
    description: "I retrieve, corroborate, and rank real-time information from credible online sources.",
    prompts: ["Search latest news on AI agents", "Find authoritative API docs", "Corroborate claims across sources", "Extract verified links and data"]
  },
  'Academic Research Agent': {
    description: "I search academic databases, analyze experimental methodologies, and format APA/IEEE citations.",
    prompts: ["Find arXiv papers on LLM Architectures", "Summarize paper methodology and limitations", "Format IEEE citations", "Compare contrasting study conclusions"]
  },
  'Browser Agent': {
    description: "I extract structured data, parse DOM trees, and scrape web content with zero noise.",
    prompts: ["Extract structured table data", "Scrape webpage content", "Parse semantic HTML hierarchy", "Extract metadata and articles"]
  },
  'News Agent': {
    description: "I aggregate breaking news, corroborate facts across outlets, and structure chronological timelines.",
    prompts: ["Get latest tech headlines", "Structure event timeline", "Summarize industry updates", "Analyze market impact"]
  },
  'Code Agent': {
    description: "I author clean, modular, and production-grade software architectures following SOLID principles.",
    prompts: ["Design a scalable service layer", "Refactor module with clean architecture", "Write typed async endpoints", "Implement robust error handling"]
  },
  'Python Agent': {
    description: "I write idiomatic Python 3.10+, async concurrency, type hints, and pytest fixtures.",
    prompts: ["Write an async pipeline with aiosqlite", "Optimize algorithm time complexity", "Create Pydantic models with validation", "Write pytest fixtures"]
  },
  'Automation Agent': {
    description: "I design CI/CD pipelines, Docker scripts, webhook handlers, and automated workflows.",
    prompts: ["Create a GitHub Actions CI/CD workflow", "Design automated testing pipeline", "Write cron automation script", "Implement webhook dispatcher"]
  },
  'Data Analysis Agent': {
    description: "I perform EDA, calculate descriptive and inferential statistics, and uncover actionable insights.",
    prompts: ["Perform EDA on dataset", "Calculate correlation matrix and anomalies", "Run statistical hypothesis tests", "Extract actionable business ROI"]
  },
  'Visualization Agent': {
    description: "I select optimal chart types, accessible palettes, and design interactive dashboards.",
    prompts: ["Recommend chart type for time-series", "Design KPI dashboard layout", "Create high-contrast color scheme", "Suggest interactive visual controls"]
  },
  'Validation Agent': {
    description: "I perform rigorous QA, validate JSON schemas, verify math logic, and detect contradictions.",
    prompts: ["Validate JSON schema compliance", "Verify calculation correctness", "Find logical contradictions", "Audit boundary constraints"]
  },
  'Report Generator Agent': {
    description: "I synthesize multi-agent findings into executive summaries using the Minto Pyramid Principle.",
    prompts: ["Generate executive summary report", "Synthesize findings from all agents", "Format report with action items", "Export structured markdown"]
  },
  'Presentation Agent': {
    description: "I transform long-form analysis into compelling pitch decks and visual slide outlines.",
    prompts: ["Draft a 5-slide pitch deck", "Create slide outlines with speaker notes", "Design visual suggestions per slide", "Structure executive presentation"]
  },
  'Export Agent': {
    description: "I format, serialize, and validate data for PDF, CSV, JSON, Markdown, and LaTeX export.",
    prompts: ["Format data as clean CSV", "Prepare markdown for PDF export", "Validate JSON schema for export", "Generate structured LaTeX"]
  },
  'Live Workflow Agent': {
    description: "I monitor and orchestrate real-time dynamic DAG workflows with automated retries.",
    prompts: ["Monitor active DAG execution", "Handle node retry with backoff", "Optimize pipeline concurrency", "Prevent graph deadlocks"]
  },
  'Agent Communication Agent': {
    description: "I manage inter-agent IPC routing, shared blackboard context, and consensus arbitration.",
    prompts: ["Route payload to Planner Agent", "Broadcast update to blackboard", "Arbitrate conflicting agent outputs", "Check blackboard shared context"]
  },
  'Logs Agent': {
    description: "I audit system execution, parse stack traces, and track performance telemetry.",
    prompts: ["Show recent system errors", "Analyze execution stack trace", "Track token consumption metrics", "Export structured audit logs"]
  },
  'Events Agent': {
    description: "I manage the real-time event bus, topic pub/sub subscriptions, and scheduled triggers.",
    prompts: ["List active event subscriptions", "Emit workflow completion event", "Schedule periodic trigger", "Monitor event stream"]
  },
  'Orqion': {
    description: "I am your autonomous general-purpose AI workspace assistant.",
    prompts: ["Create a new file in workspace", "How is our multi-agent system structured?", "Write an async Python module", "Coordinate a research workflow"]
  },
  'Multi-Agent Hub': {
    description: "Collaborative multi-agent hub. Coordinate cross-agent context chaining and consensus pipelines.",
    prompts: ["Chain Planner -> Code -> Validation", "Synthesize full project strategy", "Execute multi-agent research sprint"]
  }
};

const getAgentTheme = (agentName: string) => {
  const themes = [
    { bg: 'bg-blue-500/5', border: 'border-blue-500/20', hoverBorder: 'hover:border-blue-500/50', text: 'text-blue-400', glow: 'from-blue-500/20', iconBg: 'bg-blue-500/10', iconText: 'text-blue-400', hoverBg: 'hover:bg-blue-500/10' },
    { bg: 'bg-purple-500/5', border: 'border-purple-500/20', hoverBorder: 'hover:border-purple-500/50', text: 'text-purple-400', glow: 'from-purple-500/20', iconBg: 'bg-purple-500/10', iconText: 'text-purple-400', hoverBg: 'hover:bg-purple-500/10' },
    { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', hoverBorder: 'hover:border-emerald-500/50', text: 'text-emerald-400', glow: 'from-emerald-500/20', iconBg: 'bg-emerald-500/10', iconText: 'text-emerald-400', hoverBg: 'hover:bg-emerald-500/10' },
    { bg: 'bg-amber-500/5', border: 'border-amber-500/20', hoverBorder: 'hover:border-amber-500/50', text: 'text-amber-400', glow: 'from-amber-500/20', iconBg: 'bg-amber-500/10', iconText: 'text-amber-400', hoverBg: 'hover:bg-amber-500/10' },
    { bg: 'bg-rose-500/5', border: 'border-rose-500/20', hoverBorder: 'hover:border-rose-500/50', text: 'text-rose-400', glow: 'from-rose-500/20', iconBg: 'bg-rose-500/10', iconText: 'text-rose-400', hoverBg: 'hover:bg-rose-500/10' },
    { bg: 'bg-cyan-500/5', border: 'border-cyan-500/20', hoverBorder: 'hover:border-cyan-500/50', text: 'text-cyan-400', glow: 'from-cyan-500/20', iconBg: 'bg-cyan-500/10', iconText: 'text-cyan-400', hoverBg: 'hover:bg-cyan-500/10' },
  ];
  let hash = 0;
  for (let i = 0; i < agentName.length; i++) {
    hash = agentName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return themes[Math.abs(hash) % themes.length];
};

const getAgentMeta = (agentName: string) => {
  if (agentName.includes('Planner') || agentName.includes('Goal') || agentName.includes('Decomposer')) {
    return {
      Icon: BrainCircuit,
      category: 'Strategic Planning & DAG Execution',
      badge: 'CPM / WBS Engine',
      chips: ['Critical Path Method', 'WBS Decomposition', 'Milestone Verification', 'Topological Sort'],
      accentGradient: 'from-violet-500 via-purple-500 to-indigo-600',
      glowColor: 'rgba(139, 92, 246, 0.25)',
      textColor: 'text-purple-300',
      borderColor: 'border-purple-500/30'
    };
  }
  if (agentName.includes('Research') || agentName.includes('Search') || agentName.includes('News') || agentName.includes('Browser')) {
    return {
      Icon: Search,
      category: 'Deep Research & Fact Synthesis',
      badge: 'Empirical Intelligence',
      chips: ['Live Fact Corroboration', 'ArXiv & Journals', 'Structured Extraction', 'Zero Noise'],
      accentGradient: 'from-cyan-500 via-sky-500 to-blue-600',
      glowColor: 'rgba(6, 182, 212, 0.25)',
      textColor: 'text-cyan-300',
      borderColor: 'border-cyan-500/30'
    };
  }
  if (agentName.includes('Code') || agentName.includes('Python') || agentName.includes('Automation') || agentName.includes('Executor')) {
    return {
      Icon: Code2,
      category: 'Software Architecture & Pipelines',
      badge: 'Production Engine',
      chips: ['SOLID Principles', 'Async Concurrency', 'Type Safety', 'Robust Handling'],
      accentGradient: 'from-emerald-500 via-teal-500 to-green-600',
      glowColor: 'rgba(16, 185, 129, 0.25)',
      textColor: 'text-emerald-300',
      borderColor: 'border-emerald-500/30'
    };
  }
  if (agentName.includes('Reviewer') || agentName.includes('Validation') || agentName.includes('Tester')) {
    return {
      Icon: ShieldCheck,
      category: 'Quality Assurance & Security Audit',
      badge: 'Security Gate',
      chips: ['Static Analysis', 'Boundary QA', 'Schema Verification', 'Vulnerability Scan'],
      accentGradient: 'from-amber-500 via-orange-500 to-rose-600',
      glowColor: 'rgba(245, 158, 11, 0.25)',
      textColor: 'text-amber-300',
      borderColor: 'border-amber-500/30'
    };
  }
  if (agentName.includes('Designer') || agentName.includes('Presentation')) {
    return {
      Icon: Sparkles,
      category: 'UI/UX Architecture & Layouts',
      badge: 'Design System',
      chips: ['Design Tokens', 'Glassmorphism', 'Micro-interactions', 'Responsive Grids'],
      accentGradient: 'from-fuchsia-500 via-pink-500 to-rose-500',
      glowColor: 'rgba(217, 70, 239, 0.25)',
      textColor: 'text-fuchsia-300',
      borderColor: 'border-fuchsia-500/30'
    };
  }
  if (agentName.includes('Data') || agentName.includes('Visualization') || agentName.includes('Report') || agentName.includes('Export')) {
    return {
      Icon: Layers,
      category: 'Data Analytics & Reporting',
      badge: 'Analytics Engine',
      chips: ['Exploratory Analysis', 'Interactive Visuals', 'Correlation Metrics', 'Executive Minto'],
      accentGradient: 'from-blue-500 via-indigo-500 to-cyan-500',
      glowColor: 'rgba(59, 130, 246, 0.25)',
      textColor: 'text-blue-300',
      borderColor: 'border-blue-500/30'
    };
  }
  if (agentName === 'Orqion') {
    return {
      Icon: Orbit,
      category: 'Autonomous Multi-Agent Core',
      badge: 'Orqion v2.5 Quantum Engine',
      chips: ['Autonomous Workspace Control', 'Multi-Agent Mesh Routing', 'Dynamic DAG Synthesis', 'Secure AST Sandbox'],
      accentGradient: 'from-violet-500 via-fuchsia-500 to-cyan-400',
      glowColor: 'rgba(168, 85, 247, 0.35)',
      textColor: 'text-violet-300',
      borderColor: 'border-violet-500/30'
    };
  }
  return {
    Icon: Zap,
    category: 'Autonomous Multi-Agent Core',
    badge: 'Autonomous Agent',
    chips: ['Context Chaining', 'Task Synthesis', 'Continuous Memory', 'Deterministic Outputs'],
    accentGradient: 'from-brand-500 via-indigo-500 to-purple-600',
    glowColor: 'rgba(139, 92, 246, 0.25)',
    textColor: 'text-brand-300',
    borderColor: 'border-brand-500/30'
  };
};

const CodeSnippet = ({ code, language }: { code: string; language: string }) => {
  const [copied, setCopied] = useState(false);

  return (
    <div className="my-3.5 rounded-xl border border-white/10 bg-[#0d0d11] overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-white/5 border-b border-white/10 text-gray-400 text-[11.5px] font-mono">
        <span className="font-semibold text-gray-300">{language || 'code'}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer text-gray-400"
        >
          {copied ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy code'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto font-mono text-[12.5px] leading-relaxed text-gray-200">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const formatInline = (text: string, agentTheme: any) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold tracking-wide">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-gray-300">$1</em>')
    .replace(/`(.*?)`/g, `<code class="${agentTheme.bg} text-brand-300 px-1.5 py-0.5 rounded text-[12px] font-mono border ${agentTheme.border}">$1</code>`)
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-brand-400 hover:underline underline-offset-2">$1</a>');
};

const extractHeadings = (text: string) => {
  const headingRegex = /^#{1,4}\s+(.+)$/gm;
  const headings: { title: string; slug: string }[] = [];
  let match;
  while ((match = headingRegex.exec(text)) !== null) {
    const raw = match[1].replace(/[*_`]/g, '').trim();
    if (raw && !raw.includes('===DETAILS===')) {
      headings.push({
        title: raw,
        slug: raw.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      });
      if (headings.length >= 8) break;
    }
  }
  return headings;
};

const renderTextAndTables = (textBlock: string, agentTheme: any, keyPrefix: number) => {
  const lines = textBlock.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Interactive Workflow trigger
    if (line.includes('[[VIEW_WORKFLOW]]') || line.includes('[[VIEW WORKFLOW]]')) {
      elements.push(
        <div key={`${keyPrefix}-wf-${i}`} className="my-3.5 p-3 rounded-xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 text-brand-300 text-xs font-medium">
            <BrainCircuit size={16} className="text-brand-400" />
            <span>Interactive Workflow Diagram Generated</span>
          </div>
          <button 
            onClick={() => useStore.getState().toggleWorkflow()} 
            className="px-3 py-1.5 rounded-lg bg-brand-500/20 hover:bg-brand-500/35 text-brand-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border border-brand-500/30"
          >
            <ExternalLink size={12} />
            Open Workflow Canvas
          </button>
        </div>
      );
      i++;
      continue;
    }

    // Markdown Table detection
    if (line.trim().startsWith('|') && line.trim().endsWith('|') && i + 1 < lines.length && lines[i+1].includes('---')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const headerRow = tableLines[0].split('|').slice(1, -1).map(c => c.trim());
        const bodyRows = tableLines.slice(2).map(r => r.split('|').slice(1, -1).map(c => c.trim()));
        elements.push(
          <div key={`${keyPrefix}-tbl-${i}`} className="my-3.5 overflow-x-auto rounded-xl border border-white/10 bg-black/20 shadow-sm">
            <table className="w-full text-left border-collapse text-[12.5px]">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  {headerRow.map((h, hIdx) => (
                    <th key={hIdx} className="p-2.5 font-semibold text-white tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-2.5 text-gray-300" dangerouslySetInnerHTML={{ __html: formatInline(cell, agentTheme) }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Horizontal Divider
    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={`${keyPrefix}-hr-${i}`} className="my-4 border-white/10" />);
      i++;
      continue;
    }

    // Markdown Headers
    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const title = headerMatch[2];
      const headerSlug = title.replace(/<[^>]*>?/gm, '').replace(/[*_`]/g, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const sizeClass = level === 1 ? 'text-lg font-bold text-white mt-5 mb-2.5' : level === 2 ? 'text-base font-semibold text-white mt-4 mb-2' : 'text-[14.5px] font-semibold text-white mt-3.5 mb-1.5';
      elements.push(
        <div key={`${keyPrefix}-h-${i}`} id={`sec-${headerSlug}`} className={`tracking-tight flex items-center gap-2 ${sizeClass} scroll-mt-6`}>
          <span dangerouslySetInnerHTML={{ __html: formatInline(title, agentTheme) }} />
        </div>
      );
      i++;
      continue;
    }

    // Bullet points
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const cleanLine = line.trim().replace(/^[-*]\s+/, '');
      elements.push(
        <div key={`${keyPrefix}-li-${i}`} className="flex gap-2.5 my-1.5 items-start group">
          <div className={`mt-2 shrink-0 w-1.5 h-1.5 rounded-full ${agentTheme.bg} border ${agentTheme.border}`}></div>
          <span dangerouslySetInnerHTML={{ __html: formatInline(cleanLine, agentTheme) }} className="text-gray-300 leading-relaxed text-[13.5px]" />
        </div>
      );
      i++;
      continue;
    }

    // Numbered lists
    const numMatch = line.match(/^(\d+\.)\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={`${keyPrefix}-num-${i}`} className="flex gap-2.5 my-2 items-start group">
          <span className={`shrink-0 flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold ${agentTheme.bg} ${agentTheme.text} border ${agentTheme.border} shadow-sm`}>
            {numMatch[1].replace('.', '')}
          </span>
          <span dangerouslySetInnerHTML={{ __html: formatInline(numMatch[2], agentTheme) }} className="text-gray-300 mt-0.5 text-[13.5px] leading-relaxed" />
        </div>
      );
      i++;
      continue;
    }

    // Blockquote and Orqion Action Cards
    if (line.trim().startsWith('>')) {
      const quoteText = line.trim().replace(/^>\s?/, '');
      if (quoteText.includes('[Action executed successfully by Orqion]')) {
        elements.push(
          <div key={`${keyPrefix}-action-${i}`} className="my-2.5 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md flex items-center gap-3 text-emerald-300 shadow-sm animate-in fade-in duration-300">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 size={15} className="text-emerald-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-400">Workspace Action Executed</span>
              <span className="text-[12.5px] text-gray-200 font-medium">Orqion executed requested workspace modifications successfully.</span>
            </div>
          </div>
        );
        i++;
        continue;
      }
      elements.push(
        <div key={`${keyPrefix}-quote-${i}`} className={`border-l-2 ${agentTheme.border} pl-3.5 py-1.5 my-2.5 text-gray-300/90 italic ${agentTheme.bg} rounded-r-lg text-[13px]`}>
          <span dangerouslySetInnerHTML={{ __html: formatInline(quoteText, agentTheme) }}></span>
        </div>
      );
      i++;
      continue;
    }

    // Empty lines
    if (line.trim() === '') {
      elements.push(<div key={`${keyPrefix}-sp-${i}`} className="h-1.5"></div>);
      i++;
      continue;
    }

    // Standard paragraph
    elements.push(
      <div key={`${keyPrefix}-p-${i}`} dangerouslySetInnerHTML={{ __html: formatInline(line, agentTheme) }} className="my-1 text-gray-300 leading-relaxed text-[13.5px]" />
    );
    i++;
  }

  return <React.Fragment key={`block-${keyPrefix}`}>{elements}</React.Fragment>;
};

const formatMarkdown = (content: string, agentTheme: any) => {
  const codeBlockRegex = /```([a-zA-Z0-9_\-#+]*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = content.substring(lastIndex, match.index);
      parts.push(renderTextAndTables(textBefore, agentTheme, parts.length));
    }
    const lang = match[1].trim();
    const code = match[2];
    parts.push(<CodeSnippet key={`code-${match.index}`} language={lang} code={code} />);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const textRemaining = content.substring(lastIndex);
    parts.push(renderTextAndTables(textRemaining, agentTheme, parts.length));
  }

  return parts;
};

export default function ChatInterface({ agent }: ChatInterfaceProps) {
  const { data: session } = useSession();
  const { 
    agentScripts, 
    updateAgentScript, 
    removeOpenAgent, 
    activeAgent, 
    setActiveAgent, 
    runningAgents, 
    setAgentRunning, 
    addTerminalLog, 
    userQuery, 
    selectedFolderId, 
    updateNodeContent, 
    fileSystem, 
    createFile, 
    toggleRightSidebar, 
    pastConversations, 
    savePastConversation, 
    loadPastConversation, 
    deletePastConversation, 
    hubSelectedAgents, 
    toggleHubSelectedAgent
  } = useStore();

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const code = agentScripts[agent] || '';
  const isRunning = runningAgents[agent];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [localQuery, setLocalQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<{ msgId: string, idx: number } | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [collapsedResponses, setCollapsedResponses] = useState<Record<string, boolean>>({});
  const [focusMessage, setFocusMessage] = useState<{ id: string; senderName: string; text: string } | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const agentTheme = getAgentTheme(agent);
  const meta = getAgentMeta(agent);

  const handleChatScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollTop(scrollTop > 180);
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 180);
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  const scrollToSection = (slug: string) => {
    const el = document.getElementById(`sec-${slug}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToUserQuery = (queryId: string) => {
    const el = document.getElementById(queryId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const initialText = `# ${agent} Script\n\n# Write your ${agent.toLowerCase()} prompt here...\n`;
  const isLegacyInitialState = code.trim().startsWith('#') && !code.includes('**You:**') && !code.includes(`**${agent}:**`);
  const isInitialState = code.trim() === '' || isLegacyInitialState;
  let displayCode = code;
  if (isLegacyInitialState) {
    displayCode = '';
  } else if (code.startsWith(initialText)) {
    displayCode = code.substring(initialText.length).trimStart();
  }
  const hasMessages = !isInitialState && !!displayCode;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [code]);

  const findNode = (nodes: FileSystemNode[], id: string): FileSystemNode | undefined => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const findParentFolder = (nodes: FileSystemNode[], id: string, parentName: string | null = null): string | null => {
    for (const node of nodes) {
      if (node.id === id) return parentName;
      if (node.children) {
        const found = findParentFolder(node.children, id, node.type === 'folder' ? node.name : parentName);
        if (found) return found;
      }
    }
    return null;
  };

  const handleRunAgent = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRunning) return;

    setAgentRunning(agent, true);
    addTerminalLog(`> Status: <span class="text-accent-yellow">INITIALIZING ${agent.toUpperCase()}...</span>`);

    try {
      const autoWorkflowPrompt = `\n[UI WORKFLOW]\nTo show a workflow/diagram, output exact JSON inside a markdown block:\n\`\`\`json\n{\n  "workflow": {\n    "nodes": [\n      { "id": "1", "position": { "x": 100, "y": 100 }, "data": { "label": "Node 1" }, "type": "default" }\n    ],\n    "edges": [\n      { "id": "e1-2", "source": "1", "target": "2", "animated": true }\n    ]\n  }\n}\n\`\`\`\n`;

      let systemPromptToUse = (AGENT_CONFIGS[agent]?.description || 'You are a helpful AI assistant.') + autoWorkflowPrompt;
      
      if (agent === 'Orqion') {
        systemPromptToUse += `\nYou are Orqion, the primary orchestrator. You can perform UI workspace actions by outputting JSON:\n\`\`\`json\n{\n  "ui_action": {\n    "type": "create_file",\n    "name": "example.py",\n    "content": "print('hello')"\n  }\n}\n\`\`\`\n`;
      }

      const queryToUse = localQuery.trim() || userQuery || 'Say hello';
      setLocalQuery('');

      let currentScriptCode = agentScripts[agent] || '';
      currentScriptCode += `\n\n**You:** ${queryToUse}\n`;
      updateAgentScript(agent, currentScriptCode);

      if (agent === 'Multi-Agent Hub') {
         let accumulatedContext = `User requested: ${queryToUse}\n\n`;
         for (const subAgent of hubSelectedAgents) {
            currentScriptCode += `\n**${subAgent}:**\n\n`;
            updateAgentScript(agent, currentScriptCode);
            addTerminalLog(`> Status: <span class="text-accent-yellow">HUB: Executing ${subAgent}...</span>`);

            const hubSystemPrompt = (AGENT_CONFIGS[subAgent]?.description || 'You are a helpful AI.') + autoWorkflowPrompt + `\n\n[CONTEXT FROM PREVIOUS AGENTS]\n${accumulatedContext}\nPlease build upon the previous responses to accomplish the user's request.`;
            
            const response = await fetch('http://localhost:8555/api/agent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                agentName: subAgent,
                systemPrompt: hubSystemPrompt,
                userQuery: queryToUse,
              }),
            });

            if (!response.ok) {
              addTerminalLog(`> <span class="text-accent-red">Hub Error (${subAgent}):</span> Failed to fetch.`);
              continue;
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let subAgentOutput = "";
            let lastUpdate = Date.now();

            while (reader) {
              const { value, done } = await reader.read();
              if (done) break;
              if (value) {
                const chunkStr = decoder.decode(value, { stream: true });
                const lines = chunkStr.split('\n').filter((line) => line.trim() !== '');
                for (const line of lines) {
                  if (line.startsWith('data:')) {
                    const dataStr = line.replace(/^data:/, '').trim();
                    if (dataStr === '[DONE]') continue;
                    try {
                      const parsed = JSON.parse(dataStr);
                      const content = parsed.choices?.[0]?.delta?.content;
                      if (content) {
                        currentScriptCode += content;
                        subAgentOutput += content;
                        
                        const now = Date.now();
                        if (now - lastUpdate > 50) {
                          updateAgentScript(agent, currentScriptCode);
                          lastUpdate = now;
                        }
                      }
                    } catch (e) { }
                  }
                }
              }
            }
            updateAgentScript(agent, currentScriptCode);
            accumulatedContext += `\n\n--- [Output from ${subAgent}] ---\n${subAgentOutput}\n`;
         }
      } else {

      const response = await fetch('http://localhost:8555/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: agent,
          systemPrompt: systemPromptToUse,
          userQuery: queryToUse,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error || errorData.detail || 'Failed to connect to agent.';
        addTerminalLog(`> <span class="text-accent-red">Error (${agent}):</span> ${errMsg}`);
        setAgentRunning(agent, false);
        return;
      }

      addTerminalLog(`> <span class="text-accent-green">${agent} connected. Task executing...</span>`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let currentScriptCode = agentScripts[agent] || '';
      currentScriptCode += `\n\n**You:** ${queryToUse}\n`;
      currentScriptCode += `\n**${agent}:**\n\n`;
      updateAgentScript(agent, currentScriptCode);
      
      let lastUpdate = Date.now();

      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split('\n').filter((line) => line.trim() !== '');
          for (const line of lines) {
            if (line.startsWith('data:')) {
              const dataStr = line.replace(/^data:/, '').trim();
              if (dataStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(dataStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  currentScriptCode += content;
                  
                  const now = Date.now();
                  if (now - lastUpdate > 50) {
                    updateAgentScript(agent, currentScriptCode);
                    lastUpdate = now;
                  }
                }
              } catch (e) {
                // ignore
              }
            }
          }
        }
      }
      updateAgentScript(agent, currentScriptCode);

      const jsonBlocks = [...currentScriptCode.matchAll(/```json\s*([\s\S]*?)\s*```/g)];
      for (const match of jsonBlocks) {
        try {
          const parsed = JSON.parse(match[1]);
          if (parsed.workflow && parsed.workflow.nodes && parsed.workflow.edges) {
            useStore.getState().setWorkflowNodes(parsed.workflow.nodes);
            useStore.getState().setWorkflowEdges(parsed.workflow.edges);
            addTerminalLog(`> Status: <span class="text-accent-blue">Generated workflow from response.</span>`);

            currentScriptCode = currentScriptCode.replace(match[0], '\n[[VIEW_WORKFLOW]]\n');
            updateAgentScript(agent, currentScriptCode);
            break;
          }
          
          if (parsed.ui_action) {
             const action = parsed.ui_action;
             if (action.type === 'create_folder') {
                useStore.getState().createFolder(useStore.getState().selectedFolderId || null, action.name);
                addTerminalLog(`> Status: <span class="text-accent-blue">Orqion created folder: ${action.name}</span>`);
             } else if (action.type === 'create_file') {
                useStore.getState().createFile(useStore.getState().selectedFolderId || null, action.name, action.content || '');
                addTerminalLog(`> Status: <span class="text-accent-blue">Orqion created file: ${action.name}</span>`);
             } else if (action.type === 'delete_folder' || action.type === 'delete_file') {
                const fs = useStore.getState().fileSystem;
                const findNode = (nodes: any[], name: string, type: string): any => {
                  for (const n of nodes) {
                    if (n.name === name && n.type === type) return n;
                    if (n.children) {
                      const found = findNode(n.children, name, type);
                      if (found) return found;
                    }
                  }
                  return null;
                };
                const targetType = action.type === 'delete_folder' ? 'folder' : 'file';
                const node = findNode(fs, action.name, targetType);
                if (node) {
                  useStore.getState().deleteNode(node.id);
                  addTerminalLog(`> Status: <span class="text-accent-blue">Orqion deleted ${targetType}: ${action.name}</span>`);
                }
             } else if (action.type === 'open_agent') {
                useStore.getState().addOpenAgent(action.agentName);
                useStore.getState().setActiveAgent(action.agentName);
                addTerminalLog(`> Status: <span class="text-accent-blue">Orqion opened agent: ${action.agentName}</span>`);
             } else if (action.type === 'close_agent') {
                useStore.getState().removeOpenAgent(action.agentName);
                addTerminalLog(`> Status: <span class="text-accent-blue">Orqion closed agent: ${action.agentName}</span>`);
             } else if (action.type === 'save_chat') {
                const chatContent = agentScripts[agent] || '';
                const titleMatch = chatContent.match(/\*\*You:\*\*\s*([^\n]+)/);
                const title = titleMatch ? titleMatch[1].substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_') : 'chat';
                const filename = `${agent.replace(' ', '_').toLowerCase()}_${title}.md`;
                useStore.getState().createFile(useStore.getState().selectedFolderId || null, filename, chatContent, agent);
                addTerminalLog(`> Status: <span class="text-accent-blue">Orqion saved chat to file: ${filename}</span>`);
             } else if (action.type === 'clear_chat') {
                useStore.getState().savePastConversation(agent, agentScripts[agent] || '');
                updateAgentScript(agent, `# ${agent} Script\n\n# Write your ${agent.toLowerCase()} prompt here...\n`);
                addTerminalLog(`> Status: <span class="text-accent-blue">Orqion cleared and archived the chat</span>`);
             } else if (action.type === 'open_terminal') {
                if (!useStore.getState().isTerminalOpen) useStore.getState().toggleTerminal();
             } else if (action.type === 'close_terminal') {
                if (useStore.getState().isTerminalOpen) useStore.getState().toggleTerminal();
             } else if (action.type === 'open_workflow') {
                if (!useStore.getState().isWorkflowOpen) useStore.getState().toggleWorkflow();
             } else if (action.type === 'close_workflow') {
                if (useStore.getState().isWorkflowOpen) useStore.getState().toggleWorkflow();
             }
             
             currentScriptCode = currentScriptCode.replace(match[0], '\n> *[Action executed successfully by Orqion]*\n');
             updateAgentScript(agent, currentScriptCode);
          }
        } catch (e) { }
      }
      
      } // end else for single agent processing

      try {
        const fullAgentResponse = currentScriptCode.split(`**${agent}:**\n\n`)[1] || '';
        await fetch('http://localhost:8555/api/sync/conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            convo_id: Date.now().toString(),
            agent: agent,
            title: queryToUse.substring(0, 50),
            content: fullAgentResponse.trim(),
            timestamp: new Date().toISOString()
          })
        });
      } catch (logErr) {
        console.error("Failed to log chat:", logErr);
      }

      addTerminalLog(`> Status: <span class="text-accent-green">${agent.toUpperCase()} TASK COMPLETED & GROUNDED</span>`);
    } catch (error: any) {
      addTerminalLog(`> <span class="text-accent-red">Error (${agent}):</span> ${error.message}`);
    } finally {
      setAgentRunning(agent, false);
    }
  };

  const [showSavePopup, setShowSavePopup] = useState<string | null>(null);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (selectedFolderId) {
      const selectedNode = findNode(fileSystem, selectedFolderId);
      if (selectedNode && selectedNode.type === 'file') {
        updateNodeContent(selectedFolderId, code, agent);
        addTerminalLog(`> <span class="text-accent-green">Success:</span> Saved script to file "${selectedNode.name}".`);

        setShowSavePopup(`Saved in file "${selectedNode.name}"`);
        setTimeout(() => setShowSavePopup(null), 3000);

        try {
          await fetch('http://localhost:8555/api/sync/file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              node_id: selectedNode.id,
              parent_id: findParentFolder(fileSystem, selectedFolderId),
              name: selectedNode.name,
              type: 'file',
              content: code,
              agent_name: agent,
              agent_contents: { [agent]: code }
            })
          });
        } catch (apiErr) {
          console.error("Failed to call save API:", apiErr);
        }

        return;
      }
    }

    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: `${agent.replace(' ', '_').toLowerCase()}_output.md`,
        types: [{
          description: 'Markdown Files',
          accept: { 'text/markdown': ['.md'] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(code);
      await writable.close();
      
      createFile(selectedFolderId || null, handle.name, code, agent);
      
      addTerminalLog(`> <span class="text-accent-green">Success:</span> Saved ${agent} response to local file system.`);

      setShowSavePopup(`Saved to local file system`);
      setTimeout(() => setShowSavePopup(null), 3000);

      try {
        await fetch('http://localhost:8555/api/sync/file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              node_id: Date.now().toString(),
              parent_id: selectedFolderId,
              name: handle.name,
              type: 'file',
              content: code,
              agent_name: agent,
              agent_contents: { [agent]: code }
          })
        });
      } catch (apiErr) {
        console.error("Failed to call save API:", apiErr);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        addTerminalLog(`> <span class="text-accent-red">Error:</span> Failed to save file: ${err.message}`);
      }
    }
  };

  const isActive = activeAgent === agent;

  return (
    <div
      className={`relative flex flex-1 flex-col rounded-2xl border bg-[#0a0a0f]/95 backdrop-blur-2xl overflow-hidden shadow-2xl mx-1 min-w-[300px] transition-all duration-300 ${
        isActive 
          ? 'border-brand-500/40 ring-1 ring-brand-500/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]' 
          : 'border-white/[0.07] opacity-95 hover:border-white/15'
      }`}
      onClick={() => setActiveAgent(agent)}
    >
      {/* Ambient Top Glow */}
      <div 
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[520px] h-64 rounded-full blur-[110px] opacity-25"
        style={{ background: meta.glowColor }}
      />

      {/* Agent Chat Header */}
      <div className="flex items-center justify-between bg-black/40 backdrop-blur-xl px-4 py-3 border-b border-white/[0.07] relative z-20">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/15 flex items-center justify-center shadow-inner">
            <meta.Icon size={16} className={meta.textColor} />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#0a0a0f]" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[13.5px] text-white tracking-tight">
                {agent === 'Orqion' ? 'Orqion' : agent}
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono tracking-wider">MARE</span>
              </span>
            </div>
            <span className="text-[10px] text-gray-400 tracking-wide font-mono">
              {meta.category}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-gray-400">
          <button
            onClick={handleSave}
            className="p-2 rounded-lg hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer border border-transparent hover:border-white/10"
            title="Save to File System"
          >
            <Save size={15} />
          </button>

          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              if (hasMessages) {
                savePastConversation(agent, code);
                updateAgentScript(agent, `# ${agent} Script\n\n# Write your ${agent.toLowerCase()} prompt here...\n`);
              }
            }}
            className="p-2 rounded-lg hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer border border-transparent hover:border-white/10"
            title="New Conversation"
          >
            <Plus size={16} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); setShowHistoryModal(true); }}
            className="p-2 rounded-lg hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer border border-transparent hover:border-white/10"
            title="Past Conversations"
          >
            <History size={15} />
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              if (agent === 'Orqion') {
                toggleRightSidebar();
              } else {
                removeOpenAgent(agent); 
              }
            }}
            className="p-2 rounded-lg hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/20 transition-all cursor-pointer border border-transparent"
            title="Close"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Chat History / Initial State Area */}
        <div
          ref={scrollRef}
          onScroll={handleChatScroll}
          className="w-full flex-1 p-3 text-gray-300 font-sans text-sm whitespace-pre-wrap break-words custom-scrollbar flex flex-col overflow-y-auto"
          style={{ fontFamily: "Inter, sans-serif", lineHeight: 1.6 }}
        >
          {!hasMessages ? (
            agent === 'Orqion' ? (
              <div className="flex flex-col items-center justify-center max-w-md mx-auto w-full relative z-10 animate-in fade-in duration-300 my-auto py-12 px-4 text-center select-none">
                {/* Minimalist Glowing Orqion Emblem */}
                <div className="relative flex flex-col items-center justify-center mb-6 group">
                  <div 
                    className="absolute -inset-6 rounded-full blur-3xl opacity-40 group-hover:opacity-75 transition-opacity duration-700 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.45) 0%, rgba(59, 130, 246, 0.25) 50%, transparent 75%)' }}
                  />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 via-[#161724] to-[#0c0d16] border border-violet-500/30 backdrop-blur-2xl flex items-center justify-center shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.2)] group-hover:scale-105 transition-all duration-300">
                    <Orbit size={32} className="text-violet-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0a0a0f] flex items-center justify-center shadow-[0_0_8px_#34d399]">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    </div>
                  </div>
                </div>

                {/* Clean, Elegant Greeting */}
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-2.5">
                  What would you like to build?
                </h1>
                
                <p className="text-gray-400 text-[13px] leading-relaxed max-w-xs mb-2">
                  Ask Orqion to create files, coordinate agents, write code, or architect workflows in your workspace.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center max-w-xl mx-auto w-full relative z-10 animate-in fade-in duration-300 my-auto py-4 px-3">
                {/* Emblem Badge */}
                <div className="relative flex items-center justify-center mb-3 group">
                  <div 
                    className="absolute -inset-3 rounded-3xl blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-700 animate-pulse pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${meta.glowColor} 0%, transparent 70%)` }}
                  />
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-b from-white/10 to-white/[0.02] border border-white/20 backdrop-blur-xl flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.3)] group-hover:scale-105 transition-transform duration-300">
                    <meta.Icon size={26} className={meta.textColor} />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0a0a0f] flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    </div>
                  </div>
                </div>

                {/* Agent Title */}
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-2 bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                  {agent}
                </h1>

                {/* Description */}
                <p className="text-gray-400 text-center max-w-md mb-6 text-[13px] leading-relaxed">
                  {AGENT_CONFIGS[agent]?.description || "How can I assist you with your tasks today?"}
                </p>

                {/* Interactive Prompt Cards */}
                {AGENT_CONFIGS[agent]?.prompts && agent !== 'Multi-Agent Hub' && (
                  <div className="flex flex-col gap-2.5 w-full">
                    {AGENT_CONFIGS[agent].prompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => setLocalQuery(prompt)}
                        className="text-left px-4 py-3 rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.035] to-white/[0.01] hover:from-white/[0.07] hover:to-white/[0.02] hover:border-brand-500/40 hover:-translate-y-0.5 transition-all duration-200 text-gray-300 flex items-center justify-between gap-3 group relative overflow-hidden shadow-sm hover:shadow-[0_8px_30px_rgba(139,92,246,0.15)] cursor-pointer w-full"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-[10px] font-mono font-bold text-gray-500 group-hover:text-brand-400 uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 border border-white/5 shrink-0">
                            0{i + 1}
                          </span>
                          <span className="text-[12.5px] text-gray-200 group-hover:text-white font-medium leading-snug truncate">
                            {prompt}
                          </span>
                        </div>
                        <div className="w-6 h-6 rounded-lg bg-white/5 group-hover:bg-brand-500/20 flex items-center justify-center text-gray-400 group-hover:text-brand-300 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                          <ArrowUpRight size={13} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {agent === 'Multi-Agent Hub' && (
                  <div className="w-full mt-6 mb-4 max-w-2xl">
                    <h3 className="text-gray-300 text-sm font-medium mb-4 text-center">Select Collaborating Agents</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                      {Object.keys(AGENT_CONFIGS).filter(a => a !== 'Orqion' && a !== 'Multi-Agent Hub').map(a => (
                        <button
                          key={a}
                          onClick={() => toggleHubSelectedAgent(a as Agent)}
                          className={`px-3 py-1.5 rounded-full text-[12px] transition-all border cursor-pointer ${
                            hubSelectedAgents.includes(a as Agent)
                              ? 'bg-brand-500/20 border-brand-500/50 text-brand-400 font-medium'
                              : 'bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-gray-400 hover:border-gray-500 hover:text-gray-300'
                          }`}
                        >
                          {a.replace(' Agent', '')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            (() => {
              const renderAgentResponse = (msgId: string, text: string, msgAgentTheme: any) => {
                const parts = text.split('===DETAILS===');
                const mainText = parts[0].trim();
                const detailsText = parts.length > 1 ? parts.slice(1).join('===DETAILS===').trim() : '';
                const isExpanded = expandedSection?.msgId === msgId;

                return (
                  <div className={`relative mt-2 pl-4 py-2 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:rounded-full before:bg-gradient-to-b ${msgAgentTheme.glow} before:to-transparent animate-in fade-in slide-in-from-left-2 duration-500`}>
                    <div className={`absolute -left-1.5 top-0 w-3 h-3 rounded-full ${msgAgentTheme.iconBg} border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)]`}></div>
                    
                    <div className="text-[13.5px] text-gray-200 leading-[1.7] tracking-wide">
                      {formatMarkdown(mainText, msgAgentTheme)}
                    </div>

                    {detailsText && (
                      <div className="mt-4 max-w-full">
                        <button 
                          onClick={() => setExpandedSection(isExpanded ? null : { msgId, idx: 0 })}
                          className={`group flex items-center justify-between w-full text-[12.5px] font-medium px-4 py-2.5 rounded-xl border ${msgAgentTheme.border} bg-white/5 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm overflow-hidden relative shadow-sm hover:shadow-md cursor-pointer`}
                        >
                          <div className="flex items-center gap-2.5 relative z-10">
                            <div className={`p-1.5 rounded-md ${msgAgentTheme.bg} ${msgAgentTheme.text} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                              <FileText size={14} />
                            </div>
                            <span className="text-gray-300 group-hover:text-white transition-colors tracking-wide">
                              {isExpanded ? 'Hide Relevant Details' : 'View Relevant Details'}
                            </span>
                          </div>
                          <div className={`relative z-10 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`}>
                            <div className={`w-6 h-6 rounded-full ${msgAgentTheme.iconBg} flex items-center justify-center`}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={msgAgentTheme.text}><path d="m6 9 6 6 6-6"/></svg>
                            </div>
                          </div>
                        </button>
                        
                        <div className={`grid transition-all duration-500 ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'}`}>
                          <div className="overflow-hidden">
                            <div className={`p-5 rounded-xl border ${msgAgentTheme.border} bg-black/40 backdrop-blur-xl shadow-inner relative mt-1`}>
                              <div className="text-[13.5px] text-gray-300 leading-[1.7]">
                                {formatMarkdown(detailsText, msgAgentTheme)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              };

              const regex = new RegExp(`\\*\\*(You|[A-Za-z0-9 -]+):\\*\\*([\\s\\S]*?)(?=(?:\\*\\*(?:You|[A-Za-z0-9 -]+):\\*\\*|$))`, 'g');
              const messages: any[] = [];
              let match;
              let idCounter = 0;

              while ((match = regex.exec(displayCode)) !== null) {
                const senderName = match[1];
                const isUser = senderName === 'You';
                const text = match[2].trim();
                
                messages.push({
                  id: `msg-${idCounter++}`,
                  sender: isUser ? 'user' : 'agent',
                  senderName: senderName,
                  text: text
                });
              }

              if (messages.length === 0) {
                return displayCode;
              }

              return (
                <div className="flex flex-col gap-6 pb-2">
                  {messages.map((msg, msgIdx) => {
                    const msgAgentTheme = getAgentTheme(msg.senderName);
                    const isCollapsed = collapsedResponses[msg.id];
                    const isLong = msg.text.length > 500;
                    const headings = msg.sender !== 'user' ? extractHeadings(msg.text) : [];
                    const precedingUserQuery = messages.slice(0, msgIdx).filter(m => m.sender === 'user').pop();

                    return (
                    <div 
                      key={msg.id} 
                      id={msg.sender === 'user' ? `user-msg-${msg.id}` : `agent-msg-${msg.id}`} 
                      className={`flex flex-col scroll-mt-6 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      {msg.sender === 'user' ? (
                        <div className="bg-gradient-to-br from-[var(--color-bg-tertiary)] to-[var(--color-bg-primary)] border border-white/5 text-gray-100 px-5 py-3 rounded-2xl rounded-tr-sm max-w-[85%] text-[13.5px] shadow-md shadow-black/20 animate-in fade-in slide-in-from-right-4 duration-500 hover:shadow-lg transition-all relative overflow-hidden group">
                          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span className="relative z-10 leading-relaxed whitespace-pre-wrap">{msg.text}</span>
                        </div>
                      ) : (
                        <div className="w-full animate-in fade-in duration-300">
                          {/* Response Navigation Header */}
                          <div className="flex items-center justify-between mb-2 px-1 gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-lg ${msgAgentTheme.iconBg} border border-white/10 flex items-center justify-center shadow-sm`}>
                                <meta.Icon size={14} className={msgAgentTheme.iconText} />
                              </div>
                              <span className={`text-[11px] font-bold ${msgAgentTheme.text} uppercase tracking-wider`}>{msg.senderName}</span>

                              {/* Jump to the Question that asked for this */}
                              {precedingUserQuery && (
                                <button
                                  onClick={() => scrollToUserQuery(`user-msg-${precedingUserQuery.id}`)}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] hover:bg-brand-500/15 border border-white/[0.08] hover:border-brand-500/30 text-gray-400 hover:text-brand-300 transition-all text-[10px] cursor-pointer"
                                  title={`Jump up to Question: "${precedingUserQuery.text.slice(0, 35)}..."`}
                                >
                                  <CornerRightUp size={10} className="text-brand-400" />
                                  <span className="hidden sm:inline">To Question</span>
                                </button>
                              )}
                            </div>

                            {/* Action Tools (Collapse, Focus Reader, Copy) */}
                            <div className="flex items-center gap-1.5">
                              {/* Compact / Expand Toggle */}
                              {isLong && (
                                <button
                                  onClick={() => setCollapsedResponses(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all text-[10.5px] cursor-pointer border border-white/5"
                                  title={isCollapsed ? "Expand full message" : "Collapse to preview"}
                                >
                                  {isCollapsed ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
                                  <span>{isCollapsed ? "Expand" : "Collapse"}</span>
                                </button>
                              )}

                              {/* Focus / Reader Mode */}
                              <button
                                onClick={() => setFocusMessage({ id: msg.id, senderName: msg.senderName, text: msg.text })}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all text-[10.5px] cursor-pointer border border-white/5"
                                title="Open full reader view"
                              >
                                <Maximize2 size={11} />
                                <span className="hidden sm:inline">Focus</span>
                              </button>

                              {/* Copy Response */}
                              <button
                                onClick={() => {
                                  const cleanText = msg.text.replace(/===DETAILS===[\s\S]*$/, '').trim();
                                  navigator.clipboard.writeText(cleanText);
                                  setCopiedMsgId(msg.id);
                                  setTimeout(() => setCopiedMsgId(null), 2000);
                                }}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all text-[11px] cursor-pointer border border-white/5"
                                title="Copy response to clipboard"
                              >
                                {copiedMsgId === msg.id ? (
                                  <>
                                    <CheckCircle2 size={11} className="text-emerald-400" />
                                    <span className="text-emerald-400 text-[10.5px]">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={11} />
                                    <span className="text-[10.5px]">Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Quick Section Jump Bar (TOC) */}
                          {headings.length > 1 && (
                            <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 custom-scrollbar text-[10.5px] mb-2 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                              <span className="text-[9.5px] text-gray-500 font-mono flex items-center gap-1 shrink-0 px-1">
                                <Compass size={11} className="text-brand-400" /> Sections:
                              </span>
                              {headings.map((h, hIdx) => (
                                <button
                                  key={hIdx}
                                  onClick={() => scrollToSection(h.slug)}
                                  className="px-2 py-0.5 rounded-full bg-white/[0.04] hover:bg-brand-500/20 border border-white/[0.08] hover:border-brand-500/30 text-gray-300 hover:text-brand-300 transition-all shrink-0 cursor-pointer text-[10px] whitespace-nowrap"
                                >
                                  {h.title}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Response Body with Smooth Collapse Support */}
                          <div className={`relative ${isCollapsed ? 'max-h-56 overflow-hidden' : ''}`}>
                            {renderAgentResponse(msg.id, msg.text, msgAgentTheme)}
                            {isCollapsed && (
                              <div 
                                onClick={() => setCollapsedResponses(prev => ({ ...prev, [msg.id]: false }))}
                                className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent flex items-end justify-center pb-2 cursor-pointer group"
                              >
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-500/20 text-brand-300 border border-brand-500/30 group-hover:bg-brand-500/30 transition-all shadow-lg">
                                  <ChevronDown size={13} />
                                  <span>Show Full Response</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )})}
                  
                  {isRunning && messages[messages.length - 1]?.sender === 'user' && (
                    <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="w-full">
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <div className={`w-7 h-7 rounded-lg ${agentTheme.iconBg} border border-white/10 flex items-center justify-center shadow-sm`}>
                            <meta.Icon size={14} className={agentTheme.iconText} />
                          </div>
                          <span className={`text-[11px] font-bold ${agentTheme.text} uppercase tracking-wider`}>
                            {agent === 'Multi-Agent Hub' ? 'Agents are synthesizing...' : `${agent} is reasoning...`}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 py-3 px-4 bg-white/[0.03] border border-white/10 rounded-2xl rounded-tl-sm w-fit shadow-xl backdrop-blur-xl">
                          <div className="flex gap-1.5 items-center">
                            <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-[11px] font-mono text-gray-400">Synthesizing intelligence...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>

        {/* Chat Input Area */}
        <div className="px-4 pb-3 pt-1 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/95 to-transparent shrink-0 z-10 w-full relative">
          <div className="max-w-4xl mx-auto flex flex-col gap-1 relative">
            <div 
              className="absolute inset-0 blur-2xl rounded-full opacity-30 -z-10 transition-opacity pointer-events-none"
              style={{ background: meta.glowColor }}
            />
            
            <div className={`flex flex-col bg-[#11121d]/90 backdrop-blur-2xl rounded-2xl w-full shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)] border transition-all duration-300 overflow-hidden group p-2 ${
              agent === 'Orqion' 
                ? 'border-violet-500/25 focus-within:border-violet-500/70 focus-within:ring-2 focus-within:ring-violet-500/20' 
                : 'border-white/[0.12] focus-within:border-brand-500/60 focus-within:ring-2 focus-within:ring-brand-500/20'
            }`}>
              <textarea
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isRunning) {
                    e.preventDefault();
                    if (localQuery.trim()) handleRunAgent(e as any);
                  }
                }}
                placeholder={
                  isRunning 
                    ? "Orqion is reasoning & executing task..." 
                    : agent === 'Orqion' 
                      ? "Message Orqion..." 
                      : `Message ${agent}...`
                }
                disabled={isRunning}
                rows={1}
                className="w-full bg-transparent text-[13px] text-gray-100 outline-none placeholder-gray-500/80 disabled:opacity-50 px-2.5 py-1.5 resize-none max-h-32 min-h-[38px] custom-scrollbar"
                autoFocus
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                }}
              />

              <div className="flex items-center justify-between pt-1.5 px-1 border-t border-white/[0.04]">
                <div className="flex items-center gap-1.5 select-none">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] whitespace-nowrap ${
                    agent === 'Orqion'
                      ? 'bg-violet-500/15 border border-violet-500/30 text-violet-300'
                      : 'bg-white/[0.03] border border-white/[0.06] text-gray-400'
                  }`}>
                    <Sparkles size={10} className={agent === 'Orqion' ? 'text-violet-400 animate-pulse' : meta.textColor} />
                    <span>Autonomous</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRunAgent}
                    disabled={isRunning || !localQuery.trim()}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 cursor-pointer ${
                      isRunning
                        ? 'bg-violet-500/20 text-violet-300 cursor-wait'
                        : !localQuery.trim()
                          ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
                          : agent === 'Orqion'
                            ? 'bg-gradient-to-tr from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] active:scale-95'
                            : 'bg-gradient-to-tr from-brand-600 to-indigo-500 hover:from-brand-500 hover:to-indigo-400 text-white shadow-[0_0_15px_rgba(124,58,237,0.4)] active:scale-95'
                    }`}
                    title="Send message (Enter)"
                    aria-label="Send message"
                  >
                    {isRunning ? (
                      <Loader2 size={13} className="animate-spin text-violet-300" />
                    ) : (
                      <ArrowUp size={14} strokeWidth={2.5} />
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center text-[10px] text-gray-500 px-2 mt-0.5">
              <span>MARE can make mistakes. Verify important information.</span>
            </div>
          </div>
        </div>
      </div>

        {/* Floating Quick Navigation Dock */}
        {hasMessages && (showScrollTop || showScrollBottom) && (
          <div className="absolute right-5 bottom-20 z-30 flex items-center gap-1 bg-[#12131d]/90 backdrop-blur-xl border border-white/10 rounded-full p-1 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
            {showScrollTop && (
              <button
                onClick={scrollToTop}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                title="Jump to Top / First Question"
              >
                <ArrowUp size={12} className="text-brand-400" />
                <span className="font-mono text-[10px]">Top</span>
              </button>
            )}
            {showScrollBottom && (
              <button
                onClick={scrollToBottom}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] text-white bg-brand-600/60 hover:bg-brand-600 border border-brand-500/40 transition-all cursor-pointer shadow-[0_0_10px_rgba(139,92,246,0.3)] animate-pulse"
                title="Jump to Latest Response"
              >
                <span className="font-mono text-[10px]">Latest</span>
                <ArrowDown size={12} />
              </button>
            )}
          </div>
        )}

      {/* Reader / Focus Mode Modal */}
      {focusMessage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setFocusMessage(null)}
        >
          <div 
            className="bg-[#0e0f17] border border-white/15 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.8)] max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                  <meta.Icon size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-wide">{focusMessage.senderName} • Focus Reader</h3>
                  <p className="text-[11px] text-gray-400">Full wide reading view with no split-pane scrolling</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const cleanText = focusMessage.text.replace(/===DETAILS===[\s\S]*$/, '').trim();
                    navigator.clipboard.writeText(cleanText);
                    setCopiedMsgId('focus-modal');
                    setTimeout(() => setCopiedMsgId(null), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 hover:text-white transition-all border border-white/10 cursor-pointer"
                >
                  {copiedMsgId === 'focus-modal' ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedMsgId === 'focus-modal' ? 'Copied' : 'Copy All'}</span>
                </button>
                <button
                  onClick={() => setFocusMessage(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close Reader"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar text-[14px] leading-relaxed text-gray-200">
              {formatMarkdown(focusMessage.text.split('===DETAILS===')[0].trim(), agentTheme)}
            </div>
          </div>
        </div>
      )}

      {/* Save Popup */}
      {showSavePopup && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-brand-600 text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Save size={16} />
          <span className="text-sm font-medium">{showSavePopup}</span>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="absolute inset-0 bg-black/60 z-[100] flex items-center justify-center animate-in fade-in duration-200">
          <div 
            className="bg-[#1e1e1e] border border-[var(--color-border-primary)] rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <History size={18} className="text-brand-400" /> Past Conversations
              </h3>
              <button onClick={(e) => { e.stopPropagation(); setShowHistoryModal(false); }} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-4">
              {pastConversations.filter(c => c.agent === agent).length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No past conversations found for {agent}.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {pastConversations.filter(c => c.agent === agent).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(convo => (
                    <div key={convo.id} className="group relative flex items-center justify-between p-3 rounded-lg border border-[var(--color-border-primary)] hover:border-brand-500/50 bg-[var(--color-bg-secondary)] hover:bg-brand-500/5 cursor-pointer transition-all" onClick={() => {
                      loadPastConversation(agent, convo.id);
                      setShowHistoryModal(false);
                    }}>
                      <div className="flex flex-col flex-1 truncate pr-8">
                        <span className="text-sm font-medium text-gray-200 truncate">{convo.title}</span>
                        <span className="text-[11px] text-gray-500">{new Date(convo.timestamp).toLocaleString()}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deletePastConversation(convo.id); }}
                        className="absolute right-3 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Delete Conversation"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end pt-2 border-t border-[var(--color-border-primary)]">
              <button
                onClick={(e) => { e.stopPropagation(); setShowHistoryModal(false); }}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
