import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Lightbulb, Plus, Trash2, Edit } from "lucide-react";

interface MindMapProps {
  userId: string;
}

interface Node {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
}

interface Connection {
  from: string;
  to: string;
}

export default function MindMap({ userId }: MindMapProps) {
  const [nodes, setNodes] = useState<Node[]>([
    { id: '1', text: 'Main Topic', x: 400, y: 200, color: '#22c55e' }
  ]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [newNodeText, setNewNodeText] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const colors = ['#22c55e', '#eab308', '#ef4444', '#3b82f6', '#a855f7'];

  useEffect(() => {
    drawCanvas();
  }, [nodes, connections, selectedNode]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      if (fromNode && toNode) {
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 50, 0, 2 * Math.PI);
      ctx.fill();

      if (selectedNode === node.id) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const words = node.text.split(' ');
      let line = '';
      let y = node.y - 5;
      
      words.forEach(word => {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 80 && line !== '') {
          ctx.fillText(line, node.x, y);
          line = word + ' ';
          y += 15;
        } else {
          line = testLine;
        }
      });
      ctx.fillText(line, node.x, y);
    });
  };

  const addNode = () => {
    if (!newNodeText.trim()) return;
    
    const newNode: Node = {
      id: Date.now().toString(),
      text: newNodeText,
      x: Math.random() * 600 + 100,
      y: Math.random() * 300 + 100,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    
    setNodes([...nodes, newNode]);
    
    if (selectedNode) {
      setConnections([...connections, { from: selectedNode, to: newNode.id }]);
    }
    
    setNewNodeText("");
    setIsDialogOpen(false);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      return distance < 50;
    });
    
    setSelectedNode(clickedNode ? clickedNode.id : null);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      return distance < 50;
    });
    
    if (clickedNode) {
      setDragging(clickedNode.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setNodes(nodes.map(node => 
      node.id === dragging ? { ...node, x, y } : node
    ));
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const deleteSelected = () => {
    if (!selectedNode) return;
    setNodes(nodes.filter(n => n.id !== selectedNode));
    setConnections(connections.filter(c => c.from !== selectedNode && c.to !== selectedNode));
    setSelectedNode(null);
  };

  const clearAll = () => {
    setNodes([{ id: '1', text: 'Main Topic', x: 400, y: 200, color: '#22c55e' }]);
    setConnections([]);
    setSelectedNode(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Mind Maps</h2>
          <p className="text-sm text-muted-foreground">Visualize your ideas and connections</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-mind-map">
                <Plus className="h-4 w-4 mr-2" />
                Add Node
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Node</DialogTitle>
                <DialogDescription>
                  {selectedNode ? "This will connect to the selected node" : "Create a new node"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="node-text">Node Text</Label>
                  <Input
                    id="node-text"
                    data-testid="input-node-text"
                    value={newNodeText}
                    onChange={(e) => setNewNodeText(e.target.value)}
                    placeholder="Enter node text"
                    onKeyPress={(e) => e.key === 'Enter' && addNode()}
                  />
                </div>
                <Button onClick={addNode} className="w-full" data-testid="button-add-node">
                  Add Node
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {selectedNode && (
            <Button variant="destructive" size="icon" onClick={deleteSelected} data-testid="button-delete-node">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          
          <Button variant="outline" onClick={clearAll} data-testid="button-clear-map">
            Clear All
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Click nodes to select • Drag nodes to move • Add nodes to create connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="w-full border rounded-lg bg-background cursor-pointer"
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            data-testid="canvas-mind-map"
          />
        </CardContent>
      </Card>
    </div>
  );
}
