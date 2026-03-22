"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { useDashboardWorkspace } from "@/components/dashboard/workspace-provider";
import { updateWorldElement, getCharacterAttributes } from "@/lib/workspace";
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  Handle,
  Position,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { Loader2, Users, Save, RefreshCw } from "lucide-react";

// CUSTOM NODE COMPONENT
const CharacterNode = ({ data }: { data: any }) => {
  return (
    <div className="relative px-4 py-2 shadow-xl rounded-xl bg-[var(--background-surface)] border-2 border-[var(--border-ui)] min-w-[200px] flex items-center gap-3 transition-transform hover:scale-105 hover:border-emerald-500/50">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-emerald-500" />
      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 overflow-hidden border border-emerald-500/30">
        {data.imageUrl ? (
          <img src={data.imageUrl} alt={data.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-emerald-700 dark:text-emerald-300 font-bold text-lg">
            {data.name?.charAt(0) || "?"}
          </span>
        )}
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <span className="font-bold text-sm text-[var(--text-primary)] truncate" title={data.name}>
          {data.name || "Unknown"}
        </span>
        <span className="text-xs text-[var(--text-secondary)] truncate">
          {data.role || "Character"}
        </span>
        {data.status && (
          <span className="text-[10px] mt-1 uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
            {data.status}
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-emerald-500" />
    </div>
  );
};

const nodeTypes = {
  character: CharacterNode,
};

// AUTO-LAYOUT FUNCTION
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = "TB") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 220;
  const nodeHeight = 80;

  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
};

export default function RelationshipsPage() {
  const { t } = useTranslation();
  const { worldElements } = useDashboardWorkspace();
  
  const characters = useMemo(
    () => worldElements.filter((el) => el.type === "character"),
    [worldElements]
  );

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!characters.length) {
      setNodes([]);
      setEdges([]);
      setLoading(false);
      return;
    }

    // Initialize nodes
    const initialNodes: Node[] = characters.map((char, index) => {
      const attrs = getCharacterAttributes(char.attributes);
      
      // Look for saved position
      const savedPosition = (char.attributes as any)?.nodePosition;
      
      return {
        id: char.id,
        type: "character",
        position: savedPosition || { x: (index % 3) * 250, y: Math.floor(index / 3) * 150 },
        data: {
          name: char.name,
          role: attrs.role,
          status: attrs.status,
          imageUrl: attrs.image_path ? `https://your-storage-url/${attrs.image_path}` : null, // Not doing signed URL for now to keep simple, but ideally would
        },
      };
    });

    // Extract edges from connections attribute
    const initialEdges: Edge[] = [];
    characters.forEach((char) => {
      const connections = (char.attributes as any)?.connections || [];
      connections.forEach((conn: any) => {
        if (characters.find((c) => c.id === conn.targetId)) {
          initialEdges.push({
            id: `e-${char.id}-${conn.targetId}`,
            source: char.id,
            target: conn.targetId,
            animated: true,
            label: conn.label || "",
            style: { stroke: 'var(--text-secondary)' },
          });
        }
      });
    });

    // If no positions saved and no edges, or first time load, maybe auto layout
    const hasSavedPositions = characters.some(c => (c.attributes as any)?.nodePosition);
    
    if (!hasSavedPositions && initialEdges.length > 0) {
      const layouted = getLayoutedElements(initialNodes, initialEdges);
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
    } else {
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
    
    setLoading(false);
  }, [characters]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = { ...params, animated: true, style: { stroke: 'var(--text-secondary)' } };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    []
  );

  const autoLayout = useCallback(() => {
    const layouted = getLayoutedElements(nodes, edges);
    setNodes([...layouted.nodes]);
    setEdges([...layouted.edges]);
  }, [nodes, edges]);

  const saveLayout = async () => {
    setIsSaving(true);
    try {
      // Group connections by source
      const connectionsBySource: Record<string, { targetId: string; label: string }[]> = {};
      
      characters.forEach(c => {
        connectionsBySource[c.id] = [];
      });

      edges.forEach(edge => {
        if (!connectionsBySource[edge.source]) {
          connectionsBySource[edge.source] = [];
        }
        connectionsBySource[edge.source].push({
          targetId: edge.target,
          label: (edge.label as string) || "",
        });
      });

      // Update each character
      for (const node of nodes) {
        const char = characters.find(c => c.id === node.id);
        if (char) {
          const currentAttrs = typeof char.attributes === 'object' && char.attributes !== null 
            ? char.attributes 
            : {};
            
          await updateWorldElement(char.id, {
            attributes: {
              ...currentAttrs,
              nodePosition: node.position,
              connections: connectionsBySource[char.id] || [],
            }
          });
        }
      }
    } catch (error) {
      console.error("Failed to save layout", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-[72px] items-center justify-between border-b border-[var(--border-ui)] px-6 shrink-0 bg-[var(--background-app)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Relationship Tree
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Map out character connections and dynamics
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={autoLayout}
            className="flex items-center gap-2 rounded-lg border border-[var(--border-ui)] bg-[var(--background-surface)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--border-ui)]/50 hover:text-[var(--text-primary)]"
          >
            <RefreshCw className="h-4 w-4" />
            Auto Layout
          </button>
          <button
            onClick={saveLayout}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Layout
          </button>
        </div>
      </header>

      <div className="flex-1 bg-neutral-50 dark:bg-neutral-900/50 relative">
        {characters.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center flex-col text-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-[var(--border-ui)]/50 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-[var(--text-tertiary)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">No Characters Found</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-sm">
              Add some characters in the Characters tab to start mapping their relationships here.
            </p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-right"
            className="bg-dot-pattern"
          >
            <Background color="var(--border-ui)" gap={20} size={2} />
            <Controls className="bg-[var(--background-surface)] border border-[var(--border-ui)] shadow-xl rounded-xl overflow-hidden" />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
