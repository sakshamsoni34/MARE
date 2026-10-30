import React, { useCallback, useState } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  addEdge,
  Connection,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { X, FilePlus, Save, Play } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { syncWorkflowApi, executeWorkflowApi } from '@/lib/api';

export default function WorkflowVisualizer() {
  const { 
    workflowNodes, 
    setWorkflowNodes, 
    workflowEdges, 
    setWorkflowEdges, 
    toggleWorkflow, 
    addTerminalLog, 
    selectedFolderId, 
    createFile,
    activeProject 
  } = useStore();
  
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    defaultValue: string;
    onConfirm: (val: string) => void;
  } | null>(null);
  const [modalInputValue, setModalInputValue] = useState('');

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setWorkflowNodes(applyNodeChanges(changes, workflowNodes)),
    [setWorkflowNodes, workflowNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setWorkflowEdges(applyEdgeChanges(changes, workflowEdges)),
    [setWorkflowEdges, workflowEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => setWorkflowEdges(addEdge(connection, workflowEdges)),
    [setWorkflowEdges, workflowEdges]
  );

  const handleCreateNew = () => {
    setWorkflowNodes([{
      id: 'start-node-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      type: 'default',
      position: { x: 250, y: 150 },
      data: { label: 'Start Node' },
      style: { border: '1px solid #6366f1', borderRadius: '8px' }
    }]);
    setWorkflowEdges([]);
    addTerminalLog('> <span class="text-brand-400">Created new clean workflow template.</span>');
  };

  const handleExecuteWorkflow = async () => {
    if (workflowNodes.length === 0) {
      addTerminalLog('> <span class="text-yellow-400">Workflow Warning:</span> No nodes in workflow to execute.');
      return;
    }

    if (!useStore.getState().isTerminalOpen) {
      useStore.getState().toggleTerminal();
    }

    setIsExecuting(true);
    addTerminalLog(`> <span class="text-brand-400">Executing Multi-Agent Workflow DAG (${workflowNodes.length} nodes)...</span>`);

    try {
      const activeProj = activeProject || 'default';
      const res = await executeWorkflowApi({
        project_name: activeProj,
        nodes: workflowNodes,
        edges: workflowEdges
      });

      if (res.status === 'success') {
        for (let i = 0; i < res.steps.length; i++) {
          const step = res.steps[i];
          // Highlight node in visualizer
          const currentNodes = useStore.getState().workflowNodes;
          const updatedNodes = currentNodes.map(n => 
            n.id === step.node_id 
              ? { ...n, style: { ...n.style, border: '2px solid #10b981', background: '#064e3b' } }
              : n
          );
          setWorkflowNodes(updatedNodes);
          addTerminalLog(`> <span class="text-emerald-400">✓ Step [${step.label}]:</span> ${step.output} <span class="text-gray-400">(${step.duration_ms}ms)</span>`);
          await new Promise(r => setTimeout(r, 150));
        }
        addTerminalLog(`> <span class="text-accent-green">Workflow Completed:</span> ${res.executed_nodes_count} steps executed in ${res.total_duration_ms}ms.`);
      } else {
        addTerminalLog(`> <span class="text-accent-red">Workflow execution failed.</span>`);
      }
    } catch (err: any) {
      addTerminalLog(`> <span class="text-accent-red">Workflow execution error:</span> ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSave = async () => {
    const workflowData = JSON.stringify({
      workflow: {
        nodes: workflowNodes,
        edges: workflowEdges
      }
    }, null, 2);

    const activeProj = activeProject || 'default';

    // 1. Persist directly to backend database
    try {
      await syncWorkflowApi({
        project_name: activeProj,
        nodes: workflowNodes,
        edges: workflowEdges
      });
      addTerminalLog(`> <span class="text-accent-green">Saved workflow to database for project '${activeProj}'.</span>`);
    } catch (err) {
      console.error('Failed to sync workflow to database:', err);
    }

    // 2. Register into virtual workspace Explorer
    createFile(selectedFolderId || null, 'workflow.json', workflowData);

    // 3. Fallback client-side file save/download (cross-browser compatible)
    try {
      if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: 'workflow.json',
          types: [{
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(workflowData);
        await writable.close();
      } else {
        const blob = new Blob([workflowData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'workflow.json';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (pickerErr: any) {
      if (pickerErr.name !== 'AbortError') {
        console.warn('Native picker not used or aborted, database save succeeded.');
      }
    }
  };

  return (
    <div className="flex flex-1 flex-col rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-panel)] overflow-hidden shadow-lg">
      <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 py-3">
        <span className="text-sm font-medium text-text-secondary">Multi-Agent Workflow Configuration</span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExecuteWorkflow}
            disabled={isExecuting}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all border ${
              isExecuting 
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 cursor-wait' 
                : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30 cursor-pointer'
            }`}
            title="Execute Workflow DAG"
          >
            <Play size={13} fill={isExecuting ? 'currentColor' : 'none'} />
            <span>{isExecuting ? 'Executing...' : 'Run Workflow'}</span>
          </button>

          <div className="flex items-center justify-center p-1.5 cursor-pointer hover:text-accent-blue transition-colors text-text-tertiary" title="Create New Workflow" onClick={handleCreateNew}>
            <FilePlus size={16} />
          </div>

          <div className="flex items-center justify-center p-1.5 cursor-pointer hover:text-accent-green transition-colors text-text-tertiary" title="Save Workflow" onClick={handleSave}>
            <Save size={16} />
          </div>

          <div className="w-px h-4 bg-white/10 mx-1" />

          <div className="flex items-center justify-center p-1.5 cursor-pointer hover:text-red-400 transition-colors text-text-tertiary" title="Close Workflow" onClick={toggleWorkflow}>
            <X size={16} />
          </div>
        </div>
      </div>
      <div className="flex-1 w-full h-full relative" style={{ backgroundColor: '#1e1e1e' }}>
        <ReactFlow
          nodes={workflowNodes}
          edges={workflowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          colorMode="dark"
          panActivationKeyCode={null}
          onInit={setReactFlowInstance}
          onPaneClick={(event) => {
            if (!reactFlowInstance) return;
            const position = reactFlowInstance.screenToFlowPosition({
              x: event.clientX,
              y: event.clientY,
            });

            setModalConfig({
              isOpen: true,
              title: 'Create New Workflow Node',
              defaultValue: 'New Agent Task',
              onConfirm: (label) => {
                const newNode = {
                  id: 'node-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                  type: 'default',
                  position,
                  data: { label },
                  style: { border: '1px solid #3b82f6', borderRadius: '8px' }
                };
                setWorkflowNodes([...workflowNodes, newNode]);
              }
            });
            setModalInputValue('New Agent Task');
          }}
          onNodeDoubleClick={(_, node) => {
            setModalConfig({
              isOpen: true,
              title: 'Rename Node',
              defaultValue: String(node.data?.label || ''),
              onConfirm: (newLabel) => {
                setWorkflowNodes(workflowNodes.map(n => 
                  n.id === node.id ? { ...n, data: { ...n.data, label: newLabel } } : n
                ));
              }
            });
            setModalInputValue(String(node.data?.label || ''));
          }}
          onEdgeDoubleClick={(_, edge) => {
            setWorkflowEdges(workflowEdges.filter(e => e.id !== edge.id));
          }}
        >
          <Background color="#333" gap={16} />
          <Controls />
        </ReactFlow>

        {/* Modal for node creation / rename */}
        {modalConfig?.isOpen && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-[#252526] border border-[#3e3e42] p-4 rounded-lg shadow-xl w-80 text-white">
              <h3 className="text-sm font-semibold mb-3">{modalConfig.title}</h3>
              <input 
                type="text" 
                autoFocus
                value={modalInputValue}
                onChange={(e) => setModalInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (modalInputValue.trim()) modalConfig.onConfirm(modalInputValue.trim());
                    setModalConfig(null);
                  } else if (e.key === 'Escape') {
                    setModalConfig(null);
                  }
                }}
                className="w-full bg-[#1e1e1e] border border-[#3e3e42] text-sm px-2 py-1.5 rounded outline-none focus:border-brand-500 mb-3"
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setModalConfig(null)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/15 text-xs rounded transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (modalInputValue.trim()) modalConfig.onConfirm(modalInputValue.trim());
                    setModalConfig(null);
                  }}
                  className="px-3 py-1 bg-brand-500 hover:bg-brand-600 text-xs rounded transition-colors font-medium"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
