import React, { useCallback } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Connection,
  Edge,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { X, FilePlus, Save } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function WorkflowVisualizer() {
  const { workflowNodes, setWorkflowNodes, workflowEdges, setWorkflowEdges, toggleWorkflow, addTerminalLog, selectedFolderId, createFile } = useStore();
  const [reactFlowInstance, setReactFlowInstance] = React.useState<any>(null);
  const [modalConfig, setModalConfig] = React.useState<{
    isOpen: boolean;
    title: string;
    defaultValue: string;
    onConfirm: (val: string) => void;
  } | null>(null);
  const [modalInputValue, setModalInputValue] = React.useState('');

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
      data: { label: 'Start Node' }
    }]);
    setWorkflowEdges([]);
  };

  const handleSave = async () => {
    try {
      const workflowData = JSON.stringify({
        workflow: {
          nodes: workflowNodes,
          edges: workflowEdges
        }
      }, null, 2);

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
      
      createFile(selectedFolderId || null, handle.name, workflowData);
      
      
      addTerminalLog(`> <span class="text-accent-green">Success:</span> Saved workflow to local file system.`);

      try {
        const logResponse = await fetch('http://localhost:8555/api/workflow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            fileName: handle.name, 
            nodesCount: workflowNodes.length,
            edgesCount: workflowEdges.length
          })
        });
        if (logResponse.ok) {
          const logJson = await logResponse.json();
          const formattedLog = JSON.stringify(logJson, null, 2).replace(/\n/g, '<br>').replace(/ /g, '&nbsp;');
          addTerminalLog(`> <span class="text-blue-400">Workflow Save API Response:</span> <br><pre class="text-xs text-gray-300 mt-1">${formattedLog}</pre>`);
        }
      } catch (apiErr) {
        console.error("Failed to call workflow save API:", apiErr);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        addTerminalLog(`> <span class="text-accent-red">Error:</span> Failed to save workflow: ${err.message}`);
        console.error('Failed to save workflow:', err.message);
      }
    }
  };

  return (
    <div className="flex flex-1 flex-col rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-panel)] overflow-hidden shadow-lg">
      <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 py-3">
        <span className="text-sm font-medium text-text-secondary">Multi-Agent Workflow Configuration</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center p-0.5 cursor-pointer hover:text-accent-blue transition-colors text-text-tertiary" title="Create New Workflow" onClick={handleCreateNew}>
            <FilePlus size={16} />
          </div>
          <div className="flex items-center justify-center p-0.5 cursor-pointer hover:text-accent-green transition-colors text-text-tertiary" title="Save Workflow" onClick={handleSave}>
            <Save size={16} />
          </div>
          <div className="flex items-center justify-center p-0.5 cursor-pointer hover:text-red-400 transition-colors text-text-tertiary" title="Close Workflow" onClick={toggleWorkflow}>
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
            
            setModalInputValue('New Node');
            setModalConfig({
              isOpen: true,
              title: 'Enter new node label:',
              defaultValue: 'New Node',
              onConfirm: (label) => {
                if (label) {
                  const newNode = {
                    id: 'node-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                    position,
                    data: { label },
                    type: 'default',
                  };
                  setWorkflowNodes([...workflowNodes, newNode]);
                }
                setModalConfig(null);
              }
            });
          }}
          onNodeDoubleClick={(event, node) => {
            setModalInputValue(node.data.label as string);
            setModalConfig({
              isOpen: true,
              title: 'Edit node label:',
              defaultValue: node.data.label as string,
              onConfirm: (newLabel) => {
                if (newLabel !== null && newLabel.trim() !== '') {
                  setWorkflowNodes(workflowNodes.map(n => 
                    n.id === node.id ? { ...n, data: { ...n.data, label: newLabel } } : n
                  ));
                }
                setModalConfig(null);
              }
            });
          }}
        >
          <Background color="#3c3c3c" gap={16} />
          <Controls className="bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)] fill-white text-white" />
        </ReactFlow>
        
        {modalConfig && modalConfig.isOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[var(--color-bg-panel)] border border-[var(--color-border-primary)] rounded-xl shadow-2xl w-80 overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="px-4 py-3 border-b border-[var(--color-border-primary)] bg-[#1e1e1e]">
                <h3 className="text-sm font-medium text-white">{modalConfig.title}</h3>
              </div>
              <div className="p-4">
                <input
                  type="text"
                  autoFocus
                  className="w-full bg-black/40 border border-[var(--color-border-primary)] rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-tertiary focus:outline-none focus:border-brand-400 transition-colors"
                  value={modalInputValue}
                  onChange={(e) => setModalInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      modalConfig.onConfirm(modalInputValue);
                    } else if (e.key === 'Escape') {
                      setModalConfig(null);
                    }
                  }}
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-white hover:bg-white/5 rounded-md transition-colors"
                    onClick={() => setModalConfig(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-3 py-1.5 text-xs font-medium bg-brand-500 hover:bg-brand-400 text-white rounded-md transition-colors shadow-sm"
                    onClick={() => modalConfig.onConfirm(modalInputValue)}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
