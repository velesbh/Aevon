"use client";

import React, { useCallback, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background, BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
} from '@xyflow/react';
import "@xyflow/react/dist/style.css";
import { Plus, Trash2 } from "lucide-react";

interface LoreDiagramEditorProps {
  initialData?: string; // JSON string of { nodes: Node[], edges: Edge[] }
  onChange: (data: string) => void;
}

export function LoreDiagramEditor({ initialData, onChange }: LoreDiagramEditorProps) {
  const initialElements = React.useMemo(() => {
    if (initialData) {
      try {
        return JSON.parse(initialData) as { nodes: Node[]; edges: Edge[] };
      } catch (e) {
        console.error("Failed to parse diagram data", e);
      }
    }
    return { nodes: [], edges: [] };
  }, [initialData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialElements.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialElements.edges);
  
  // Track selected elements to delete
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      setEdges((eds) => {
        const newEdges = addEdge(params, eds);
        notifyChange(nodes, newEdges);
        return newEdges;
      });
    },
    [setEdges, nodes]
  );

  const notifyChange = (n: Node[], e: Edge[]) => {
    onChange(JSON.stringify({ nodes: n, edges: e }));
  };

  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes);
      setNodes((nds) => {
        notifyChange(nds, edges);
        return nds;
      });
    },
    [onNodesChange, setNodes, edges]
  );

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes);
      setEdges((eds) => {
        notifyChange(nodes, eds);
        return eds;
      });
    },
    [onEdgesChange, setEdges, nodes]
  );

  const onSelectionChange = useCallback(({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) => {
    setSelectedNodes((nodes ?? []).map(n => n.id));
    setSelectedEdges((edges ?? []).map(e => e.id));
  }, []);

  const addNode = (type: string = 'default') => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type,
      position: { x: Math.random() * 200, y: Math.random() * 200 },
      data: { label: `New ${type === 'input' ? 'Source' : type === 'output' ? 'Outcome' : 'Node'}` },
    };
    setNodes((nds) => {
      const newNodes = [...nds, newNode];
      notifyChange(newNodes, edges);
      return newNodes;
    });
  };

  const deleteSelected = () => {
    setNodes((nds) => {
      const remainingNodes = nds.filter((n) => !selectedNodes.includes(n.id));
      setEdges((eds) => {
        const remainingEdges = eds.filter((e) => !selectedEdges.includes(e.id));
        notifyChange(remainingNodes, remainingEdges);
        return remainingEdges;
      });
      return remainingNodes;
    });
  };

  return (
    <div className="w-full h-[500px] border border-[var(--border-ui)] rounded-2xl overflow-hidden bg-[var(--background-app)] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        
        <Panel position="top-right" className="flex gap-2 bg-[var(--background-surface)] p-2 rounded-lg border border-[var(--border-ui)] shadow-sm">
          <button
            type="button"
            onClick={() => addNode('input')}
            className="px-3 py-1.5 text-xs font-medium bg-[var(--state-layer-primary)] text-[var(--primary)] hover:opacity-80 rounded-md border border-[var(--primary)]/20 transition-colors"
          >
            + Source
          </button>
          <button
            type="button"
            onClick={() => addNode('default')}
            className="px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
          >
            + Concept
          </button>
          <button
            type="button"
            onClick={() => addNode('output')}
            className="px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-md border border-purple-200 transition-colors"
          >
            + Outcome
          </button>
          
          <div className="w-px h-6 bg-[var(--border-ui)] mx-1 self-center" />
          
          <button
            type="button"
            onClick={deleteSelected}
            disabled={selectedNodes.length === 0 && selectedEdges.length === 0}
            className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 rounded-md border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}


