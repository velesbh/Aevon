"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "@/lib/i18n";
import { useDashboardWorkspace } from "@/components/dashboard/workspace-provider";
import {
  updateWorldElement,
  getCharacterAttributes,
  createWorldElement,
  deleteWorldElement,
  createCharacterImageSignedUrl,
  getAttributeText,
} from "@/lib/workspace";
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
  BackgroundVariant,
  MiniMap,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import {
  Loader2,
  Users,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Network,
  Search,
  X,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- CUSTOM NODE COMPONENT ---
const CharacterNode = ({ data }: { data: any }) => {
  return (
    <div className="relative px-4 py-2 shadow-lg rounded-xl bg-[var(--background-surface)] border border-[var(--border-ui)] min-w-[200px] flex items-center gap-3 transition-all hover:scale-[1.03] hover:border-[var(--border-ui-hover)] hover:shadow-xl">
      <Handle type="target" position={Position.Top} className="w-3 h-3" style={{ background: 'var(--primary, #34a853)' }} />
      <div className="w-12 h-12 rounded-full bg-[var(--background-app)] flex items-center justify-center shrink-0 overflow-hidden border border-[var(--border-ui)]">
        {data.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.imageUrl} alt={data.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[var(--text-secondary)] font-bold text-lg">
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
          <span className="text-[10px] mt-1 uppercase tracking-wider text-[var(--primary)] font-semibold">
            {data.status}
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" style={{ background: 'var(--primary, #34a853)' }} />
    </div>
  );
};

const nodeTypes = {
  character: CharacterNode,
};

interface CharacterNodeData {
  characterId?: string;
  name?: string;
  role?: string;
  status?: string;
  rawImagePath?: string;
  imageUrl?: string | null;
}

// --- AUTO-LAYOUT FUNCTION ---
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

// --- MAIN PAGE COMPONENT ---
export default function RelationshipsPage() {
  const { t } = useTranslation();
  const { worldElements, activeProjectTitle, activeProjectId } = useDashboardWorkspace();

  const characters = useMemo(
    () => worldElements.filter((el) => el.type === "character"),
    [worldElements]
  );

  // Use "lore_diagram" type but filter by a category to differentiate from standard lore
  const relationshipTrees = useMemo(
    () =>
      worldElements.filter(
        (el) =>
          el.type === "lore_diagram" &&
          getAttributeText(el.attributes, "diagramType") === "relationship"
      ),
    [worldElements]
  );

  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // State for Add Character Dropdown
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState("");
  const [localTreeName, setLocalTreeName] = useState("");

  // Keep track of signed URLs for characters so we don't re-fetch unnecessarily
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const selectedTree = useMemo(
    () => relationshipTrees.find((t) => t.id === selectedTreeId) || null,
    [relationshipTrees, selectedTreeId]
  );

  useEffect(() => {
    if (selectedTree) {
      setLocalTreeName(selectedTree.name || "");
    }
  }, [selectedTree]);

  const filteredTrees = useMemo(() => {
    if (!searchQuery.trim()) return relationshipTrees;
    const query = searchQuery.toLowerCase();
    return relationshipTrees.filter((tree) => (tree.name || "").toLowerCase().includes(query));
  }, [relationshipTrees, searchQuery]);

  // Load Tree Data when selected
  useEffect(() => {
    if (!selectedTree) {
      setNodes([]);
      setEdges([]);
      return;
    }

    try {
      const diagramDataStr = getAttributeText(selectedTree.attributes, "diagram_data");
      if (diagramDataStr) {
        const parsed = JSON.parse(diagramDataStr);
        setNodes(parsed.nodes || []);
        setEdges(parsed.edges || []);
      } else {
        setNodes([]);
        setEdges([]);
      }
    } catch (e) {
      console.error("Failed to parse relationship tree data", e);
      setNodes([]);
      setEdges([]);
    }
  }, [selectedTree]);

  // Fetch signed URLs for nodes
  useEffect(() => {
    const fetchSignedUrls = async () => {
      const newUrls: Record<string, string> = { ...signedUrls };
      let changed = false;

      for (const node of nodes) {
        const d = node.data as CharacterNodeData;
        if (node.type === "character" && d?.rawImagePath) {
          const path = d.rawImagePath;
          if (!newUrls[path] && !path.startsWith("http")) {
            try {
              const url = await createCharacterImageSignedUrl(path);
              if (url) {
                newUrls[path] = url;
                changed = true;
              }
            } catch (err) {
              console.error("Failed to fetch image URL", err);
            }
          }
        }
      }

      if (changed) {
        setSignedUrls(newUrls);
      }
    };

    fetchSignedUrls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes]);

  // Update nodes with signed URLs
  const nodesWithImages = useMemo(() => {
    return nodes.map((node) => {
      const d = node.data as CharacterNodeData;
      if (node.type === "character" && d?.rawImagePath) {
        return {
          ...node,
          data: {
            ...node.data,
            imageUrl:
              d.rawImagePath.startsWith("http")
                ? d.rawImagePath
                : signedUrls[d.rawImagePath] || null,
          },
        };
      }
      return node;
    });
  }, [nodes, signedUrls]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);

  const onSelectionChange = useCallback(({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) => {
    setSelectedNodes(nodes.map((n) => n.id));
    setSelectedEdges(edges.map((e) => e.id));
  }, []);

  const deleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !selectedNodes.includes(n.id)));
    setEdges((eds) => eds.filter((e) => !selectedEdges.includes(e.id)));
    setSelectedNodes([]);
    setSelectedEdges([]);
  }, [selectedNodes, selectedEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = { ...params, animated: true, style: { stroke: "var(--text-secondary)" } };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    []
  );

  const autoLayout = useCallback(() => {
    const layouted = getLayoutedElements(nodes, edges);
    setNodes([...layouted.nodes]);
    setEdges([...layouted.edges]);
  }, [nodes, edges]);

  const handleCreateTree = async () => {
    if (!activeProjectId) return;
    const projectId = activeProjectId;
    setIsCreating(true);
    try {
      const newTree = await createWorldElement(projectId, "lore_diagram", {
        name: `Relationship Tree ${relationshipTrees.length + 1}`,
      });
      await updateWorldElement(newTree.id, {
        attributes: {
          ...(typeof newTree.attributes === "object" && newTree.attributes !== null
            ? newTree.attributes
            : {}),
          diagramType: "relationship",
          diagram_data: JSON.stringify({ nodes: [], edges: [] }),
        },
      });
      setSelectedTreeId(newTree.id);
      showStatus("Tree created");
    } catch (error) {
      console.error("Failed to create tree", error);
      showStatus("Error creating tree");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTree = async () => {
    if (!selectedTreeId) return;
    setIsDeleting(true);
    try {
      await deleteWorldElement(selectedTreeId);
      setSelectedTreeId(null);
      showStatus("Tree deleted");
    } catch (error) {
      console.error("Failed to delete tree", error);
      showStatus("Error deleting tree");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveTree = async () => {
    if (!selectedTreeId) return;
    setIsSaving(true);
    try {
      // Create a clean copy of nodes without signedUrls (so we don't save huge expiring URLs)
      const cleanNodes = nodes.map((n) => {
        const { imageUrl, ...restData } = n.data;
        return { ...n, data: restData };
      });

      const diagram_data = JSON.stringify({ nodes: cleanNodes, edges });
      await updateWorldElement(selectedTreeId, {
        attributes: {
          ...(typeof selectedTree?.attributes === "object" && selectedTree?.attributes !== null
            ? selectedTree.attributes
            : {}),
          diagramType: "relationship",
          diagram_data,
        },
      });
      showStatus("Layout saved");
    } catch (error) {
      console.error("Failed to save tree", error);
      showStatus("Error saving layout");
    } finally {
      setIsSaving(false);
    }
  };

  const showStatus = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 3000);
  };

  const addCharacterNode = (characterId: string) => {
    const char = characters.find((c) => c.id === characterId);
    if (!char) return;

    const attrs = getCharacterAttributes(char.attributes);
    const newNode: Node = {
      id: `char-${char.id}-${Date.now()}`,
      type: "character",
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: {
        characterId: char.id,
        name: char.name,
        role: attrs.role,
        status: attrs.status,
        rawImagePath: attrs.image_path, // Keep raw path for re-fetching
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setShowAddMenu(false);
    setAddSearchQuery("");
  };

  // Filter characters for Add menu
  const filteredCharacters = useMemo(() => {
    const query = addSearchQuery.toLowerCase();
    return characters.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        getAttributeText(c.attributes, "role")?.toLowerCase().includes(query)
    );
  }, [characters, addSearchQuery]);

  return (
    <div className="flex h-full min-h-0 w-full flex-row overflow-hidden bg-[var(--background-surface)]">
      {/* LEFT PANEL: Trees List */}
      <aside
        className={cn(
          "flex flex-col border-r border-[var(--border-ui)] bg-[var(--background-surface)] transition-all duration-300 ease-in-out z-20",
          isSidebarOpen ? "w-[320px] min-w-[320px]" : "w-0 min-w-0 overflow-hidden border-r-0"
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-ui)]/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-[var(--text-secondary)]" />
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Relationship Trees</h2>
          </div>
          <button
            onClick={handleCreateTree}
            disabled={isCreating}
            className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--background-app)] hover:text-[var(--primary)] transition-colors"
            title="New Tree"
          >
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>

        <div className="border-b border-[var(--border-ui)]/50 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trees..."
              className="w-full rounded-lg bg-[var(--background-app)] py-2 pl-9 pr-8 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:ring-1 focus:ring-[var(--primary)]/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredTrees.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center text-sm text-[var(--text-tertiary)]">
              <Network className="h-8 w-8 opacity-20" />
              <span>{searchQuery ? "No trees found matching your search." : "No trees yet. Create one to begin."}</span>
              {!searchQuery && (
                <button
                  onClick={handleCreateTree}
                  disabled={isCreating}
                  className="flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Create Tree
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTrees.map((element) => {
                const isActive = element.id === selectedTreeId;
                return (
                  <button
                    key={element.id}
                    onClick={() => setSelectedTreeId(element.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-all",
                      isActive
                        ? "bg-[var(--state-layer-primary)] text-[var(--primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--background-app)]"
                    )}
                  >
                    <Network
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        isActive ? "text-[var(--primary)]" : "text-[var(--text-tertiary)]"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {element.name || "Untitled Tree"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* CENTER PANEL: Canvas */}
      <main className="relative flex flex-1 flex-col overflow-hidden bg-[var(--background-app)]">
        {/* Viewport Header */}
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-4 py-4 text-white pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded-lg bg-black/40 p-2 text-white/80 backdrop-blur-md transition-colors hover:bg-black/60 hover:text-white"
              title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              <ArrowLeft className={cn("h-4 w-4 transition-transform", !isSidebarOpen && "rotate-180")} />
            </button>
            {selectedTree && (
              <div className="flex flex-col drop-shadow-md">
                <input
                  type="text"
                  value={localTreeName}
                  onChange={(e) => setLocalTreeName(e.target.value)}
                  onBlur={(e) => updateWorldElement(selectedTree.id, { name: e.target.value })}
                  className="bg-transparent text-lg font-bold leading-tight outline-none placeholder:text-white/50"
                  placeholder="Tree Name"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {selectedTree && (
              <>
                <button
                  onClick={handleDeleteTree}
                  disabled={isDeleting}
                  className="rounded-lg bg-red-500/80 p-2 text-white backdrop-blur-md transition-colors hover:bg-red-600 disabled:opacity-50"
                  title="Delete Tree"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={autoLayout}
                  className="rounded-lg bg-black/40 p-2 text-white/80 backdrop-blur-md transition-colors hover:bg-black/60 hover:text-white"
                  title="Auto Layout"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  onClick={handleSaveTree}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Layout
                </button>
              </>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative h-full w-full bg-neutral-50 dark:bg-neutral-900/50">
          {!selectedTree ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-[var(--text-tertiary)] p-6 text-center">
              <Network className="h-16 w-16 opacity-20" />
              <h3 className="text-lg font-bold text-[var(--text-primary)]">No Tree Selected</h3>
              <p className="text-sm max-w-sm">
                Select a relationship tree from the sidebar or create a new one to begin mapping connections.
              </p>
              <button
                onClick={handleCreateTree}
                disabled={isCreating}
                className="flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              >
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create New Tree
              </button>
            </div>
          ) : (
              <ReactFlow
              nodes={nodesWithImages}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onSelectionChange={onSelectionChange}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-right"
              className="bg-dot-pattern"
            >
              <Background variant={BackgroundVariant.Dots} color="var(--border-ui)" gap={20} size={2} />
              <Controls className="bg-[var(--background-surface)] border border-[var(--border-ui)] shadow-xl rounded-xl overflow-hidden" />
              <MiniMap 
                className="bg-[var(--background-surface)] border border-[var(--border-ui)] rounded-xl overflow-hidden shadow-xl"
                maskColor="var(--background-app)"
                nodeColor="var(--primary, #34a853)"
              />
              
              <Panel position="top-left" className="mt-16 ml-2">
                <div className="relative flex flex-col gap-2">
                  <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-95"
                  >
                    <Users className="h-4 w-4" />
                    Add Character
                  </button>
                  
                  {(selectedNodes.length > 0 || selectedEdges.length > 0) && (
                    <button
                      onClick={deleteSelected}
                      className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-500 shadow-sm transition-all hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Selected
                    </button>
                  )}

                  {showAddMenu && (
                    <div className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-[var(--border-ui)] bg-[var(--background-surface)] p-2 shadow-2xl animate-in fade-in slide-in-from-top-2">
                      <div className="relative mb-2">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary)]" />
                        <input
                          type="text"
                          autoFocus
                          value={addSearchQuery}
                          onChange={(e) => setAddSearchQuery(e.target.value)}
                          placeholder="Search characters..."
                          className="w-full rounded-lg bg-[var(--background-app)] py-1.5 pl-8 pr-3 text-xs text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                        {filteredCharacters.length === 0 ? (
                          <div className="py-4 text-center text-xs text-[var(--text-tertiary)]">
                            No characters found.
                          </div>
                        ) : (
                          filteredCharacters.map((char) => (
                            <button
                              key={char.id}
                              onClick={() => addCharacterNode(char.id)}
                              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-[var(--background-app)] transition-colors"
                            >
                              <span className="truncate font-medium text-[var(--text-secondary)]">
                                {char.name}
                              </span>
                              <Plus className="h-3.5 w-3.5 text-[var(--primary)] shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
            </ReactFlow>
          )}
        </div>
      </main>

      {/* Notification Toast */}
      {status && (
        <div className="absolute bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white shadow-lg animate-in fade-in slide-in-from-bottom-4">
          {status}
        </div>
      )}
    </div>
  );
}
