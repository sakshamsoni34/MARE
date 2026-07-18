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
import { Settings } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function WorkflowVisualizer() {
  const { workflowNodes, setWorkflowNodes, workflowEdges, setWorkflowEdges } = useStore();

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

  return (
    <div className="flex flex-1 flex-col rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-panel)] overflow-hidden shadow-lg">
      <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 py-3">
        <span className="text-sm font-medium text-text-secondary">Multi-Agent Workflow Configuration</span>
        <Settings size={16} className="text-text-tertiary cursor-pointer hover:text-white" />
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
        >
          <Background color="#3c3c3c" gap={16} />
          <Controls className="bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)] fill-white text-white" />
        </ReactFlow>
      </div>
    </div>
  );
}
