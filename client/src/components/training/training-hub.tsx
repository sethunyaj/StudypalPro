import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Plus,
  BookOpen,
  Brain,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  FolderOpen,
  Paperclip,
  GraduationCap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { TrainingTopic, TrainingItem } from "@shared/schema";

interface TrainingHubProps {
  userId: string;
}

const TYPE_ICONS: Record<string, typeof BookOpen> = {
  module: BookOpen,
  quiz: Brain,
  assignment: ClipboardList,
};

const TYPE_COLORS: Record<string, string> = {
  module: "text-chart-2",
  quiz: "text-chart-3",
  assignment: "text-primary",
};

const TYPE_LABELS: Record<string, string> = {
  module: "Module",
  quiz: "Quiz",
  assignment: "Assignment",
};

export function TrainingHub({ userId }: TrainingHubProps) {
  const { toast } = useToast();
  const [collapsedTopics, setCollapsedTopics] = useState<Set<string>>(new Set());
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showTopicDialog, setShowTopicDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<TrainingItem | null>(null);
  const [editingTopic, setEditingTopic] = useState<TrainingTopic | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "item" | "topic"; id: string; title: string } | null>(null);
  const [newItemType, setNewItemType] = useState<string>("module");

  const [itemForm, setItemForm] = useState({
    title: "",
    description: "",
    content: "",
    topicId: "__none__",
    status: "draft",
    attachmentUrl: "",
    attachmentName: "",
  });

  const [topicForm, setTopicForm] = useState({
    title: "",
    position: 0,
  });

  const { data: topics = [], isLoading: topicsLoading } = useQuery<TrainingTopic[]>({
    queryKey: ["/api/training/topics"],
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery<TrainingItem[]>({
    queryKey: ["/api/training/items"],
  });

  const createTopicMutation = useMutation({
    mutationFn: async (data: { title: string; position: number }) => {
      return await apiRequest("POST", "/api/training/topics", {
        ...data,
        createdBy: userId,
      });
    },
    onSuccess: () => {
      toast({ title: "Topic created" });
      queryClient.invalidateQueries({ queryKey: ["/api/training/topics"] });
      setShowTopicDialog(false);
      resetTopicForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateTopicMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; title: string; position: number }) => {
      return await apiRequest("PATCH", `/api/training/topics/${id}`, {
        ...data,
        userId,
      });
    },
    onSuccess: () => {
      toast({ title: "Topic updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/training/topics"] });
      setShowTopicDialog(false);
      setEditingTopic(null);
      resetTopicForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteTopicMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/training/topics/${id}?userId=${userId}`);
    },
    onSuccess: () => {
      toast({ title: "Topic deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/training/topics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training/items"] });
      setShowDeleteDialog(false);
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/training/items", {
        ...data,
        createdBy: userId,
      });
    },
    onSuccess: () => {
      toast({ title: "Item created" });
      queryClient.invalidateQueries({ queryKey: ["/api/training/items"] });
      setShowItemDialog(false);
      resetItemForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return await apiRequest("PATCH", `/api/training/items/${id}`, {
        ...data,
        userId,
      });
    },
    onSuccess: () => {
      toast({ title: "Item updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/training/items"] });
      setShowItemDialog(false);
      setEditingItem(null);
      resetItemForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/training/items/${id}?userId=${userId}`);
    },
    onSuccess: () => {
      toast({ title: "Item deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/training/items"] });
      setShowDeleteDialog(false);
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  function resetItemForm() {
    setItemForm({
      title: "",
      description: "",
      content: "",
      topicId: "__none__",
      status: "draft",
      attachmentUrl: "",
      attachmentName: "",
    });
    setNewItemType("module");
  }

  function resetTopicForm() {
    setTopicForm({ title: "", position: 0 });
  }

  function openCreateItem(type: string) {
    setEditingItem(null);
    resetItemForm();
    setNewItemType(type);
    setShowItemDialog(true);
    setShowCreateMenu(false);
  }

  function openCreateTopic() {
    setEditingTopic(null);
    resetTopicForm();
    setShowTopicDialog(true);
    setShowCreateMenu(false);
  }

  function openEditItem(item: TrainingItem) {
    setEditingItem(item);
    setNewItemType(item.type);
    setItemForm({
      title: item.title,
      description: item.description || "",
      content: item.content || "",
      topicId: item.topicId || "__none__",
      status: item.status,
      attachmentUrl: item.attachmentUrl || "",
      attachmentName: item.attachmentName || "",
    });
    setShowItemDialog(true);
  }

  function openEditTopic(topic: TrainingTopic) {
    setEditingTopic(topic);
    setTopicForm({ title: topic.title, position: topic.position });
    setShowTopicDialog(true);
  }

  function handleSaveItem() {
    const payload: any = {
      type: newItemType,
      title: itemForm.title,
      description: itemForm.description || null,
      content: itemForm.content || null,
      topicId: itemForm.topicId === "__none__" ? null : itemForm.topicId,
      status: itemForm.status,
      attachmentUrl: itemForm.attachmentUrl || null,
      attachmentName: itemForm.attachmentName || null,
    };

    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, ...payload });
    } else {
      createItemMutation.mutate(payload);
    }
  }

  function handleSaveTopic() {
    if (editingTopic) {
      updateTopicMutation.mutate({ id: editingTopic.id, ...topicForm });
    } else {
      createTopicMutation.mutate(topicForm);
    }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === "topic") {
      deleteTopicMutation.mutate(deleteTarget.id);
    } else {
      deleteItemMutation.mutate(deleteTarget.id);
    }
  }

  function toggleTopic(topicId: string) {
    setCollapsedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  }

  const itemsByTopic = topics.map((topic) => ({
    topic,
    items: items.filter((item) => item.topicId === topic.id),
  }));

  const ungroupedItems = items.filter((item) => !item.topicId);

  const isLoading = topicsLoading || itemsLoading;

  if (isLoading) {
    return (
      <Card className="border">
        <CardContent className="p-8">
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold" data-testid="text-training-hub-title">Training Hub</h2>
        </div>

        <DropdownMenu open={showCreateMenu} onOpenChange={setShowCreateMenu}>
          <DropdownMenuTrigger asChild>
            <Button data-testid="button-create-training">
              <Plus className="h-4 w-4 mr-1" />
              Create
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openCreateItem("module")} data-testid="menu-create-module">
              <BookOpen className="h-4 w-4 mr-2 text-chart-2" />
              Module
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openCreateItem("quiz")} data-testid="menu-create-quiz">
              <Brain className="h-4 w-4 mr-2 text-chart-3" />
              Quiz
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openCreateItem("assignment")} data-testid="menu-create-assignment">
              <ClipboardList className="h-4 w-4 mr-2 text-primary" />
              Assignment
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={openCreateTopic} data-testid="menu-create-topic">
              <FolderOpen className="h-4 w-4 mr-2" />
              Topic
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {items.length === 0 && topics.length === 0 ? (
        <Card className="border">
          <CardContent className="p-8 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Training Content Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create modules, quizzes, and assignments to build your training hub.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {itemsByTopic.map(({ topic, items: topicItems }) => (
            <TopicSection
              key={topic.id}
              topic={topic}
              items={topicItems}
              collapsed={collapsedTopics.has(topic.id)}
              onToggle={() => toggleTopic(topic.id)}
              onEditTopic={() => openEditTopic(topic)}
              onDeleteTopic={() => {
                setDeleteTarget({ type: "topic", id: topic.id, title: topic.title });
                setShowDeleteDialog(true);
              }}
              onEditItem={openEditItem}
              onDeleteItem={(item) => {
                setDeleteTarget({ type: "item", id: item.id, title: item.title });
                setShowDeleteDialog(true);
              }}
            />
          ))}

          {ungroupedItems.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 px-2 py-1">
                <span className="text-sm font-medium text-muted-foreground">No topic</span>
              </div>
              {ungroupedItems.map((item) => (
                <TrainingItemRow
                  key={item.id}
                  item={item}
                  onEdit={() => openEditItem(item)}
                  onDelete={() => {
                    setDeleteTarget({ type: "item", id: item.id, title: item.title });
                    setShowDeleteDialog(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit" : "Create"} {TYPE_LABELS[newItemType]}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? `Update this ${TYPE_LABELS[newItemType].toLowerCase()}`
                : `Add a new ${TYPE_LABELS[newItemType].toLowerCase()} to your training hub`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="item-title">Title</Label>
              <Input
                id="item-title"
                placeholder={`${TYPE_LABELS[newItemType]} title`}
                value={itemForm.title}
                onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                data-testid="input-item-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-description">Description</Label>
              <Textarea
                id="item-description"
                placeholder="Brief description..."
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                className="resize-none"
                rows={2}
                data-testid="input-item-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-content">Content</Label>
              <Textarea
                id="item-content"
                placeholder="Detailed content..."
                value={itemForm.content}
                onChange={(e) => setItemForm({ ...itemForm, content: e.target.value })}
                className="resize-none"
                rows={4}
                data-testid="input-item-content"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Topic</Label>
                <Select
                  value={itemForm.topicId}
                  onValueChange={(val) => setItemForm({ ...itemForm, topicId: val })}
                >
                  <SelectTrigger data-testid="select-item-topic">
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No topic</SelectItem>
                    {topics.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={itemForm.status}
                  onValueChange={(val) => setItemForm({ ...itemForm, status: val })}
                >
                  <SelectTrigger data-testid="select-item-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="posted">Posted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-attachment-url">Attachment URL</Label>
              <Input
                id="item-attachment-url"
                placeholder="https://..."
                value={itemForm.attachmentUrl}
                onChange={(e) => setItemForm({ ...itemForm, attachmentUrl: e.target.value })}
                data-testid="input-item-attachment-url"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-attachment-name">Attachment Name</Label>
              <Input
                id="item-attachment-name"
                placeholder="Document.pdf"
                value={itemForm.attachmentName}
                onChange={(e) => setItemForm({ ...itemForm, attachmentName: e.target.value })}
                data-testid="input-item-attachment-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemDialog(false)} data-testid="button-cancel-item">
              Cancel
            </Button>
            <Button
              onClick={handleSaveItem}
              disabled={!itemForm.title.trim() || createItemMutation.isPending || updateItemMutation.isPending}
              data-testid="button-save-item"
            >
              {createItemMutation.isPending || updateItemMutation.isPending
                ? "Saving..."
                : editingItem
                  ? "Save Changes"
                  : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTopicDialog} onOpenChange={setShowTopicDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingTopic ? "Edit Topic" : "Create Topic"}</DialogTitle>
            <DialogDescription>
              {editingTopic ? "Update topic details" : "Create a new topic to organize training content"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="topic-title">Topic Title</Label>
              <Input
                id="topic-title"
                placeholder="e.g., Getting Started"
                value={topicForm.title}
                onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                data-testid="input-topic-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic-position">Position (order)</Label>
              <Input
                id="topic-position"
                type="number"
                value={topicForm.position}
                onChange={(e) => setTopicForm({ ...topicForm, position: parseInt(e.target.value) || 0 })}
                data-testid="input-topic-position"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTopicDialog(false)} data-testid="button-cancel-topic">
              Cancel
            </Button>
            <Button
              onClick={handleSaveTopic}
              disabled={!topicForm.title.trim() || createTopicMutation.isPending || updateTopicMutation.isPending}
              data-testid="button-save-topic"
            >
              {createTopicMutation.isPending || updateTopicMutation.isPending
                ? "Saving..."
                : editingTopic
                  ? "Save Changes"
                  : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type === "topic" ? "Topic" : "Item"}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"?
              {deleteTarget?.type === "topic" && " Items in this topic will be moved to 'No topic'."}
              {" "}This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete"
            >
              {deleteTopicMutation.isPending || deleteItemMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TopicSection({
  topic,
  items,
  collapsed,
  onToggle,
  onEditTopic,
  onDeleteTopic,
  onEditItem,
  onDeleteItem,
}: {
  topic: TrainingTopic;
  items: TrainingItem[];
  collapsed: boolean;
  onToggle: () => void;
  onEditTopic: () => void;
  onDeleteTopic: () => void;
  onEditItem: (item: TrainingItem) => void;
  onDeleteItem: (item: TrainingItem) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 group">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 flex-1 text-left px-2 py-2 rounded-md hover-elevate"
          data-testid={`button-toggle-topic-${topic.id}`}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium text-sm">{topic.title}</span>
          <Badge variant="secondary" className="ml-1">{items.length}</Badge>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ visibility: "visible" }} data-testid={`button-topic-menu-${topic.id}`}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEditTopic} data-testid={`menu-edit-topic-${topic.id}`}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Topic
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDeleteTopic} className="text-destructive" data-testid={`menu-delete-topic-${topic.id}`}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Topic
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {!collapsed && (
        <div className="ml-4 space-y-1">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground px-2 py-2">No items in this topic</p>
          ) : (
            items.map((item) => (
              <TrainingItemRow
                key={item.id}
                item={item}
                onEdit={() => onEditItem(item)}
                onDelete={() => onDeleteItem(item)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function TrainingItemRow({
  item,
  onEdit,
  onDelete,
}: {
  item: TrainingItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = TYPE_ICONS[item.type] || BookOpen;
  const iconColor = TYPE_COLORS[item.type] || "text-muted-foreground";

  return (
    <Card className="border hover-elevate" data-testid={`card-training-item-${item.id}`}>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`shrink-0 ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">{item.title}</span>
            <Badge
              variant={item.status === "posted" ? "default" : "secondary"}
              className="text-xs"
              data-testid={`badge-status-${item.id}`}
            >
              {item.status === "posted" ? (
                <><Eye className="h-3 w-3 mr-1" /> Posted</>
              ) : (
                <><EyeOff className="h-3 w-3 mr-1" /> Draft</>
              )}
            </Badge>
            {item.attachmentUrl && (
              <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
            )}
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {TYPE_LABELS[item.type]}
            {item.updatedAt && ` · Edited ${formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}`}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" data-testid={`button-item-menu-${item.id}`}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit} data-testid={`menu-edit-item-${item.id}`}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive" data-testid={`menu-delete-item-${item.id}`}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}
