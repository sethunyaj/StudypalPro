import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Plus, Trash2, ZoomIn, ZoomOut, Maximize,
  Palette, GripVertical, Link2, Unlink, Save,
  ArrowLeft, FileText, Clock
} from "lucide-react";

interface MindMapProps {
  userId: string;
}

interface MindNode {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  parentId: string | null;
  width: number;
  height: number;
}

interface Edge {
  id: string;
  from: string;
  to: string;
}

const NODE_COLORS = [
  { name: "Green", value: "#22c55e", bg: "#dcfce7", border: "#86efac", text: "#14532d" },
  { name: "Blue", value: "#3b82f6", bg: "#dbeafe", border: "#93c5fd", text: "#1e3a5f" },
  { name: "Purple", value: "#a855f7", bg: "#f3e8ff", border: "#c4b5fd", text: "#3b0764" },
  { name: "Red", value: "#ef4444", bg: "#fee2e2", border: "#fca5a5", text: "#7f1d1d" },
  { name: "Yellow", value: "#eab308", bg: "#fef9c3", border: "#fde047", text: "#713f12" },
  { name: "Pink", value: "#ec4899", bg: "#fce7f3", border: "#f9a8d4", text: "#831843" },
  { name: "Teal", value: "#14b8a6", bg: "#ccfbf1", border: "#5eead4", text: "#134e4a" },
  { name: "Orange", value: "#f97316", bg: "#ffedd5", border: "#fdba74", text: "#7c2d12" },
];

const ROOT_COLOR = { value: "#1e293b", bg: "#1e293b", border: "#334155", text: "#ffffff" };

const DEFAULT_NODES: MindNode[] = [
  { id: "root", text: "Main Topic", x: 0, y: 0, color: ROOT_COLOR.value, parentId: null, width: 180, height: 56 }
];

function getColorScheme(color: string) {
  return NODE_COLORS.find(c => c.value === color) || NODE_COLORS[0];
}

function cubicBezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const tension = 0.4;

  if (Math.abs(dx) > Math.abs(dy)) {
    const cx1 = x1 + dx * tension;
    const cy1 = y1;
    const cx2 = x2 - dx * tension;
    const cy2 = y2;
    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  } else {
    const cx1 = x1;
    const cy1 = y1 + dy * tension;
    const cx2 = x2;
    const cy2 = y2 - dy * tension;
    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  }
}

export default function MindMap({ userId }: MindMapProps) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"list" | "editor">("list");
  const [activeMapId, setActiveMapId] = useState<string | null>(null);
  const [mapTitle, setMapTitle] = useState("Untitled Mind Map");
  const [mapSubject, setMapSubject] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<MindNode[]>([...DEFAULT_NODES]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dragInfo, setDragInfo] = useState<{ nodeId: string; startX: number; startY: number; nodeStartX: number; nodeStartY: number } | null>(null);
  const [connectMode, setConnectMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { data: savedMaps, isLoading: mapsLoading } = useQuery<any[]>({
    queryKey: ['/api/mind-maps', userId],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/mind-maps", data),
    onSuccess: async (res) => {
      const map = await res.json();
      queryClient.invalidateQueries({ queryKey: ['/api/mind-maps', userId] });
      setActiveMapId(map.id);
      setViewMode("editor");
      setHasUnsavedChanges(false);
      toast({ title: "Mind map created!" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PUT", `/api/mind-map/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mind-maps', userId] });
      setHasUnsavedChanges(false);
      toast({ title: "Mind map saved!" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/mind-map/${id}`),
    onSuccess: (_res, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/mind-maps', userId] });
      if (activeMapId === deletedId) {
        setActiveMapId(null);
        setViewMode("list");
        resetCanvas();
      }
      toast({ title: "Mind map deleted" });
    },
  });

  const resetCanvas = () => {
    setNodes([...DEFAULT_NODES]);
    setEdges([]);
    setSelectedId(null);
    setEditingId(null);
    setShowColorPicker(null);
    setConnectMode(false);
    setHasUnsavedChanges(false);
    setMapTitle("Untitled Mind Map");
    setMapSubject("");
  };

  const loadMap = (map: any) => {
    const data = map.nodes as any;
    const loadedNodes = Array.isArray(data?.nodes) && data.nodes.length > 0 ? data.nodes : [...DEFAULT_NODES];
    const loadedEdges = Array.isArray(data?.edges) ? data.edges : [];
    setActiveMapId(map.id);
    setMapTitle(map.title);
    setMapSubject(map.subject || "");
    setNodes(loadedNodes);
    setEdges(loadedEdges);
    setSelectedId(null);
    setEditingId(null);
    setShowColorPicker(null);
    setConnectMode(false);
    setHasUnsavedChanges(false);
    setViewMode("editor");
    setTimeout(() => centerViewport(), 100);
  };

  const saveMap = () => {
    const mapData = { nodes, edges };
    if (activeMapId) {
      updateMutation.mutate({
        id: activeMapId,
        data: { title: mapTitle, subject: mapSubject || null, nodes: mapData, updatedAt: new Date().toISOString() },
      });
    } else {
      createMutation.mutate({
        userId,
        title: mapTitle,
        subject: mapSubject || null,
        nodes: mapData,
      });
    }
  };

  const createNewMap = () => {
    resetCanvas();
    setActiveMapId(null);
    setMapTitle(newTitle || "Untitled Mind Map");
    setMapSubject(newSubject);
    setNewTitle("");
    setNewSubject("");
    setShowNewDialog(false);
    setViewMode("editor");
    setTimeout(() => centerViewport(), 100);
  };

  const goBackToList = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm("You have unsaved changes. Are you sure you want to go back?");
      if (!confirmed) return;
    }
    setActiveMapId(null);
    setViewMode("list");
    resetCanvas();
  };

  const centerViewport = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setViewport({ x: rect.width / 2, y: rect.height / 2, scale: 1 });
  }, []);

  useEffect(() => {
    if (!activeMapId) return;
    centerViewport();
  }, [activeMapId, centerViewport]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (editingId) return;
        if (selectedId && selectedId !== "root") {
          deleteNode(selectedId);
        }
      }
      if (e.key === "Escape") {
        setSelectedId(null);
        setEditingId(null);
        setShowColorPicker(null);
        setConnectMode(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveMap();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, editingId, nodes, edges, activeMapId, mapTitle, mapSubject]);

  const markChanged = () => setHasUnsavedChanges(true);

  const addChildNode = (parentId: string) => {
    const parent = nodes.find(n => n.id === parentId);
    if (!parent) return;

    const siblings = edges.filter(e => e.from === parentId);
    const angle = siblings.length * (Math.PI / 4) - Math.PI / 4;
    const distance = 220;

    const newId = `node_${Date.now()}`;
    const colorIndex = nodes.length % NODE_COLORS.length;
    const newNode: MindNode = {
      id: newId,
      text: "New Idea",
      x: parent.x + Math.cos(angle) * distance,
      y: parent.y + Math.sin(angle) * distance,
      color: NODE_COLORS[colorIndex].value,
      parentId,
      width: 140,
      height: 44,
    };

    setNodes(prev => [...prev, newNode]);
    setEdges(prev => [...prev, { id: `edge_${Date.now()}`, from: parentId, to: newId }]);
    setSelectedId(newId);
    setEditingId(newId);
    setEditText("New Idea");
    markChanged();
  };

  const deleteNode = (nodeId: string) => {
    if (nodeId === "root") return;

    const toDelete = new Set<string>();
    const collectChildren = (id: string) => {
      toDelete.add(id);
      edges.filter(e => e.from === id).forEach(e => collectChildren(e.to));
    };
    collectChildren(nodeId);

    setNodes(prev => prev.filter(n => !toDelete.has(n.id)));
    setEdges(prev => prev.filter(e => !toDelete.has(e.from) && !toDelete.has(e.to)));
    setSelectedId(null);
    markChanged();
  };

  const updateNodeText = (nodeId: string, text: string) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, text: text || "Untitled" } : n));
    setEditingId(null);
    markChanged();
  };

  const updateNodeColor = (nodeId: string, color: string) => {
    if (nodeId === "root") return;
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, color } : n));
    setShowColorPicker(null);
    markChanged();
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === "svg" || (e.target as HTMLElement).tagName === "path") {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      setSelectedId(null);
      setShowColorPicker(null);
      setConnectMode(false);
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setViewport(prev => ({ ...prev, x: e.clientX - panStart.x, y: e.clientY - panStart.y }));
    }
    if (dragInfo) {
      const dx = (e.clientX - dragInfo.startX) / viewport.scale;
      const dy = (e.clientY - dragInfo.startY) / viewport.scale;
      setNodes(prev => prev.map(n =>
        n.id === dragInfo.nodeId ? { ...n, x: dragInfo.nodeStartX + dx, y: dragInfo.nodeStartY + dy } : n
      ));
    }
  };

  const handleContainerMouseUp = () => {
    if (dragInfo) markChanged();
    setIsPanning(false);
    setDragInfo(null);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (connectMode && selectedId && selectedId !== nodeId) {
      const alreadyConnected = edges.some(
        e => (e.from === selectedId && e.to === nodeId) || (e.from === nodeId && e.to === selectedId)
      );
      if (!alreadyConnected) {
        setEdges(prev => [...prev, { id: `edge_${Date.now()}`, from: selectedId, to: nodeId }]);
        markChanged();
      }
      setConnectMode(false);
      return;
    }

    setSelectedId(nodeId);
    setShowColorPicker(null);
    setDragInfo({
      nodeId,
      startX: e.clientX,
      startY: e.clientY,
      nodeStartX: node.x,
      nodeStartY: node.y,
    });
  };

  const handleNodeDoubleClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setEditingId(nodeId);
      setEditText(node.text);
    }
  };

  const zoom = (direction: number) => {
    setViewport(prev => ({
      ...prev,
      scale: Math.max(0.3, Math.min(2, prev.scale + direction * 0.15)),
    }));
  };

  // ===================== LIST VIEW =====================
  if (viewMode === "list") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold" data-testid="text-mind-map-title">Mind Maps</h2>
            <p className="text-sm text-muted-foreground">Visualize your ideas and connections</p>
          </div>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-mind-map">
                <Plus className="h-4 w-4 mr-2" />
                New Mind Map
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Mind Map</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="map-title">Title</Label>
                  <Input
                    id="map-title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Biology Chapter 5"
                    data-testid="input-map-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="map-subject">Subject (optional)</Label>
                  <Input
                    id="map-subject"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g., Biology"
                    data-testid="input-map-subject"
                  />
                </div>
                <Button onClick={createNewMap} className="w-full" data-testid="button-create-map">
                  Create Mind Map
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {mapsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : savedMaps && savedMaps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedMaps.map((map: any) => {
              const nodeCount = (map.nodes?.nodes || []).length;
              const edgeCount = (map.nodes?.edges || []).length;
              return (
                <Card
                  key={map.id}
                  className="cursor-pointer hover-elevate transition-shadow"
                  onClick={() => loadMap(map)}
                  data-testid={`card-mind-map-${map.id}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base truncate">{map.title}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(map.id);
                        }}
                        data-testid={`button-delete-map-${map.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {map.subject && <Badge variant="secondary">{map.subject}</Badge>}
                      <Badge variant="outline">{nodeCount} nodes</Badge>
                      <Badge variant="outline">{edgeCount} connections</Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(map.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No mind maps yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Create your first mind map to start visualizing your ideas</p>
              <Button onClick={() => setShowNewDialog(true)} data-testid="button-create-first-map">
                <Plus className="h-4 w-4 mr-2" />
                Create Mind Map
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ===================== EDITOR VIEW =====================
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBackToList}
            data-testid="button-back-to-list"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Input
                value={mapTitle}
                onChange={(e) => { setMapTitle(e.target.value); markChanged(); }}
                className="text-lg font-bold border-0 p-0 h-auto shadow-none focus-visible:ring-0 bg-transparent"
                data-testid="input-map-title-edit"
              />
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-xs">Unsaved</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {nodes.length} nodes · {edges.length} connections
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={saveMap}
            disabled={createMutation.isPending || updateMutation.isPending}
            data-testid="button-save-map"
          >
            <Save className="h-4 w-4 mr-2" />
            {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
          </Button>
          <Button
            onClick={() => selectedId ? addChildNode(selectedId) : addChildNode("root")}
            variant="outline"
            data-testid="button-add-node"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Node
          </Button>
          {selectedId && selectedId !== "root" && (
            <>
              <Button
                variant="outline"
                onClick={() => setConnectMode(!connectMode)}
                data-testid="button-connect-node"
              >
                {connectMode ? <Unlink className="h-4 w-4 mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
                {connectMode ? "Cancel" : "Connect"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowColorPicker(showColorPicker === selectedId ? null : selectedId)}
                data-testid="button-color-picker"
              >
                <Palette className="h-4 w-4 mr-2" />
                Color
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => deleteNode(selectedId)}
                data-testid="button-delete-node"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          <div className="flex gap-1 ml-2">
            <Button variant="outline" size="icon" onClick={() => zoom(1)} data-testid="button-zoom-in">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => zoom(-1)} data-testid="button-zoom-out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={centerViewport} data-testid="button-reset-view">
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {showColorPicker && (
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-muted-foreground mr-2">Pick a color:</span>
              {NODE_COLORS.map(c => {
                const isActive = nodes.find(n => n.id === showColorPicker)?.color === c.value;
                return (
                  <Button
                    key={c.value}
                    size="icon"
                    variant="outline"
                    className="rounded-full"
                    style={{
                      backgroundColor: c.value,
                      borderColor: isActive ? "#fff" : c.border,
                      boxShadow: isActive ? `0 0 0 2px ${c.value}` : "none",
                    }}
                    onClick={() => updateNodeColor(showColorPicker, c.value)}
                    data-testid={`button-color-${c.name.toLowerCase()}`}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="relative">
        <CardContent className="p-0">
          <div className="absolute top-3 left-3 z-10 text-xs text-muted-foreground select-none pointer-events-none" data-testid="text-canvas-instructions">
            {connectMode
              ? "Click another node to connect"
              : "Drag background to pan \u00b7 Drag nodes to move \u00b7 Double-click to edit"}
          </div>
          <div
            ref={containerRef}
            className="w-full h-[600px] overflow-hidden cursor-grab active:cursor-grabbing select-none rounded-md"
            style={{ background: "linear-gradient(135deg, hsl(var(--background)), hsl(var(--muted)))" }}
            onMouseDown={handleContainerMouseDown}
            onMouseMove={handleContainerMouseMove}
            onMouseUp={handleContainerMouseUp}
            onMouseLeave={handleContainerMouseUp}
            data-testid="canvas-mind-map"
          >
            <div
              style={{
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
                transformOrigin: "0 0",
                position: "relative",
                width: 0,
                height: 0,
              }}
            >
              <svg
                className="absolute pointer-events-none"
                style={{
                  left: -3000,
                  top: -3000,
                  width: 6000,
                  height: 6000,
                  overflow: "visible",
                }}
              >
                {edges.map(edge => {
                  const fromNode = nodes.find(n => n.id === edge.from);
                  const toNode = nodes.find(n => n.id === edge.to);
                  if (!fromNode || !toNode) return null;

                  const fromColor = edge.from === "root"
                    ? ROOT_COLOR.value
                    : getColorScheme(fromNode.color).value;

                  const toColor = edge.to === "root"
                    ? ROOT_COLOR.value
                    : getColorScheme(toNode.color).value;

                  const x1 = fromNode.x + 3000;
                  const y1 = fromNode.y + 3000;
                  const x2 = toNode.x + 3000;
                  const y2 = toNode.y + 3000;

                  const gradId = `grad_${edge.id}`;

                  return (
                    <g key={edge.id}>
                      <defs>
                        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor={fromColor} stopOpacity="0.6" />
                          <stop offset="100%" stopColor={toColor} stopOpacity="0.6" />
                        </linearGradient>
                      </defs>
                      <path
                        d={cubicBezierPath(x1, y1, x2, y2)}
                        stroke={`url(#${gradId})`}
                        strokeWidth={3}
                        fill="none"
                        strokeLinecap="round"
                      />
                    </g>
                  );
                })}
              </svg>

              {nodes.map(node => {
                const isRoot = node.id === "root";
                const isSelected = node.id === selectedId;
                const isEditing = node.id === editingId;
                const colorScheme = isRoot ? ROOT_COLOR : getColorScheme(node.color);

                return (
                  <div
                    key={node.id}
                    className="absolute"
                    style={{
                      left: node.x,
                      top: node.y,
                      transform: "translate(-50%, -50%)",
                      zIndex: isSelected ? 20 : isRoot ? 10 : 5,
                    }}
                  >
                    <div
                      className={`
                        rounded-xl cursor-pointer transition-shadow duration-200
                        ${isRoot ? "px-6 py-3.5" : "px-4 py-2.5"}
                        ${isSelected ? "ring-2 ring-offset-2 ring-offset-background" : ""}
                        ${connectMode && selectedId !== node.id ? "ring-2 ring-dashed ring-blue-400 animate-pulse" : ""}
                      `}
                      style={{
                        backgroundColor: colorScheme.bg,
                        borderWidth: 2,
                        borderStyle: "solid",
                        borderColor: isSelected ? colorScheme.value : colorScheme.border,
                        color: colorScheme.text,
                        boxShadow: isSelected
                          ? `0 8px 25px -5px ${colorScheme.value}40, 0 4px 10px -6px ${colorScheme.value}30`
                          : `0 2px 8px -2px rgba(0,0,0,0.1), 0 1px 3px -1px rgba(0,0,0,0.08)`,
                        minWidth: isRoot ? 160 : 100,
                        maxWidth: 260,
                      } as React.CSSProperties}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      onDoubleClick={(e) => handleNodeDoubleClick(e, node.id)}
                      data-testid={`node-${node.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-3 w-3 opacity-30 flex-shrink-0" />
                        {isEditing ? (
                          <Input
                            autoFocus
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onBlur={() => updateNodeText(node.id, editText)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") updateNodeText(node.id, editText);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="h-7 text-sm border-0 p-0 bg-transparent shadow-none focus-visible:ring-0"
                            style={{ color: colorScheme.text }}
                            data-testid={`input-edit-node-${node.id}`}
                          />
                        ) : (
                          <span
                            className={`
                              ${isRoot ? "text-sm font-bold" : "text-sm font-medium"}
                              leading-snug select-none truncate
                            `}
                            data-testid={`text-node-${node.id}`}
                          >
                            {node.text}
                          </span>
                        )}
                      </div>

                      {isSelected && !isEditing && (
                        <div
                          className="absolute -right-2 -bottom-2"
                          style={{ visibility: "visible" }}
                        >
                          <Button
                            size="icon"
                            className="rounded-full shadow-md"
                            style={{ backgroundColor: colorScheme.value, color: "#fff" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              addChildNode(node.id);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            data-testid={`button-add-child-${node.id}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">Click</kbd> Select
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">Double-click</kbd> Edit
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">Drag</kbd> Move
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">Del</kbd> Delete
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">Ctrl+S</kbd> Save
        </span>
        <span className="ml-auto opacity-70">Zoom: {Math.round(viewport.scale * 100)}%</span>
      </div>
    </div>
  );
}
