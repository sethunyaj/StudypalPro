import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Plus, Edit, Trash2, Search, BookOpen,
  Sparkles, FileText, Headphones, Image,
  Brain, Layers, Loader2, Play, Pause,
  Volume2
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NotesProps {
  userId: string;
  onNavigateToQuiz?: (noteId: string) => void;
  onNavigateToFlashcards?: () => void;
}

type AIResultType = "summary" | "study-guide" | "podcast" | "illustration" | null;

interface AIResult {
  type: AIResultType;
  content: string;
  noteTitle: string;
  audio?: string;
  illustrationPrompt?: string;
  illustrationUrl?: string;
}

export default function Notes({ userId, onNavigateToQuiz, onNavigateToFlashcards }: NotesProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiResultOpen, setAiResultOpen] = useState(false);
  const [activeAiAction, setActiveAiAction] = useState<{ noteId: string; action: string } | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [tags, setTags] = useState("");

  const { data: notes, isLoading } = useQuery({
    queryKey: ['/api/notes', userId],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/notes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes', userId] });
      toast({ title: "Note created successfully!" });
      resetForm();
      setIsDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PUT", `/api/notes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes', userId] });
      toast({ title: "Note updated successfully!" });
      resetForm();
      setIsDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/notes/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes', userId] });
      toast({ title: "Note deleted" });
    },
  });

  const summarizeMutation = useMutation({
    mutationFn: async (noteId: string) => {
      setActiveAiAction({ noteId, action: "summarize" });
      const res = await apiRequest("POST", `/api/notes/${noteId}/summarize`, {});
      return res.json();
    },
    onSuccess: (data, noteId) => {
      const note = notes?.find((n: any) => n.id === noteId);
      setAiResult({ type: "summary", content: data.summary, noteTitle: note?.title || "Note" });
      setAiResultOpen(true);
      setActiveAiAction(null);
    },
    onError: (err: any) => {
      toast({ title: "Failed to summarize", description: err.message, variant: "destructive" });
      setActiveAiAction(null);
    },
  });

  const studyGuideMutation = useMutation({
    mutationFn: async (noteId: string) => {
      setActiveAiAction({ noteId, action: "study-guide" });
      const res = await apiRequest("POST", `/api/notes/${noteId}/study-guide`, {});
      return res.json();
    },
    onSuccess: (data, noteId) => {
      const note = notes?.find((n: any) => n.id === noteId);
      setAiResult({ type: "study-guide", content: data.guide, noteTitle: note?.title || "Note" });
      setAiResultOpen(true);
      setActiveAiAction(null);
    },
    onError: (err: any) => {
      toast({ title: "Failed to generate study guide", description: err.message, variant: "destructive" });
      setActiveAiAction(null);
    },
  });

  const flashcardMutation = useMutation({
    mutationFn: async (noteId: string) => {
      setActiveAiAction({ noteId, action: "flashcards" });
      const res = await apiRequest("POST", `/api/notes/${noteId}/generate-flashcards`, {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards'] });
      toast({
        title: `${data.count} flashcards created!`,
        description: "Check your Flashcards tab to review them.",
      });
      setActiveAiAction(null);
      if (onNavigateToFlashcards) {
        setTimeout(() => onNavigateToFlashcards(), 1500);
      }
    },
    onError: (err: any) => {
      toast({ title: "Failed to generate flashcards", description: err.message, variant: "destructive" });
      setActiveAiAction(null);
    },
  });

  const podcastMutation = useMutation({
    mutationFn: async (noteId: string) => {
      setActiveAiAction({ noteId, action: "podcast" });
      const res = await apiRequest("POST", `/api/notes/${noteId}/generate-podcast`, {});
      return res.json();
    },
    onSuccess: (data, noteId) => {
      const note = notes?.find((n: any) => n.id === noteId);
      setAiResult({
        type: "podcast",
        content: data.script,
        noteTitle: note?.title || "Note",
        audio: data.audio,
      });
      setAiResultOpen(true);
      setActiveAiAction(null);
    },
    onError: (err: any) => {
      toast({ title: "Failed to generate podcast", description: err.message, variant: "destructive" });
      setActiveAiAction(null);
    },
  });

  const illustrationMutation = useMutation({
    mutationFn: async (noteId: string) => {
      setActiveAiAction({ noteId, action: "illustration" });
      const res = await apiRequest("POST", `/api/notes/${noteId}/generate-illustration`, {});
      return res.json();
    },
    onSuccess: (data, noteId) => {
      const note = notes?.find((n: any) => n.id === noteId);
      setAiResult({
        type: "illustration",
        content: data.prompt,
        noteTitle: data.noteTitle || note?.title || "Note",
        illustrationPrompt: data.prompt,
      });
      setAiResultOpen(true);
      setActiveAiAction(null);
    },
    onError: (err: any) => {
      toast({ title: "Failed to generate illustration", description: err.message, variant: "destructive" });
      setActiveAiAction(null);
    },
  });

  const resetForm = () => {
    setTitle("");
    setContent("");
    setSubject("");
    setTags("");
    setEditingNote(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const noteData = {
      userId,
      title,
      content,
      subject,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
    };

    if (editingNote) {
      updateMutation.mutate({ id: editingNote.id, ...noteData });
    } else {
      createMutation.mutate(noteData);
    }
  };

  const handleEdit = (note: any) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setSubject(note.subject || "");
    setTags(note.tags?.join(", ") || "");
    setIsDialogOpen(true);
  };

  const isAiLoading = (noteId: string, action: string) =>
    activeAiAction?.noteId === noteId && activeAiAction?.action === action;

  const isAnyAiLoading = (noteId: string) =>
    activeAiAction?.noteId === noteId;

  const playAudio = (base64Audio: string) => {
    if (audioElement) {
      audioElement.pause();
      setAudioPlaying(false);
    }
    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
    audio.onended = () => setAudioPlaying(false);
    audio.play();
    setAudioElement(audio);
    setAudioPlaying(true);
  };

  const toggleAudio = () => {
    if (!audioElement) return;
    if (audioPlaying) {
      audioElement.pause();
      setAudioPlaying(false);
    } else {
      audioElement.play();
      setAudioPlaying(true);
    }
  };

  const filteredNotes = notes?.filter((note: any) => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === "all" || note.subject === filterSubject;
    return matchesSearch && matchesSubject;
  }) || [];

  const subjects = Array.from(new Set(notes?.map((n: any) => n.subject).filter(Boolean))) as string[];

  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i} className="text-base font-semibold mt-4 mb-1">{line.slice(4)}</h3>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mt-5 mb-2">{line.slice(3)}</h2>;
      if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-6 mb-2">{line.slice(2)}</h1>;
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={i} className="ml-4 text-sm text-muted-foreground">{renderInlineFormatting(line.slice(2))}</li>;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="text-sm text-muted-foreground">{renderInlineFormatting(line)}</p>;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">My Notes</h2>
          <p className="text-sm text-muted-foreground">Organize your study materials and use AI tools to study smarter</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-note">
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingNote ? "Edit Note" : "Create New Note"}</DialogTitle>
              <DialogDescription>
                {editingNote ? "Update your note" : "Add a new note to your collection"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  data-testid="input-note-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  data-testid="input-note-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Mathematics, Science"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  data-testid="textarea-note-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your notes here..."
                  rows={10}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  data-testid="input-note-tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="chapter1, important, exam"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" data-testid="button-save-note" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save Note"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            data-testid="input-search-notes"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-filter-subject">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-48 animate-pulse bg-muted" />
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchTerm || filterSubject !== "all" ? "No notes match your filters" : "Create your first note to get started"}
          </p>
          {!searchTerm && filterSubject === "all" && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Note
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note: any) => (
            <Card key={note.id} className="group flex flex-col" data-testid={`note-card-${note.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-2">{note.title}</CardTitle>
                  <div className="flex gap-1 invisible group-hover:visible">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(note)}
                      data-testid={`button-edit-note-${note.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => deleteMutation.mutate(note.id)}
                      data-testid={`button-delete-note-${note.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {note.subject && (
                  <Badge variant="secondary" className="w-fit">{note.subject}</Badge>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground line-clamp-4 flex-1">{note.content}</p>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {note.tags.map((tag: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {isAnyAiLoading(note.id) && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                      {activeAiAction?.action === "summarize" && "Summarizing..."}
                      {activeAiAction?.action === "study-guide" && "Creating study guide..."}
                      {activeAiAction?.action === "flashcards" && "Generating flashcards..."}
                      {activeAiAction?.action === "podcast" && "Creating podcast..."}
                      {activeAiAction?.action === "illustration" && "Generating illustration prompt..."}
                    </span>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI Study Tools
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isAnyAiLoading(note.id)}
                      onClick={() => summarizeMutation.mutate(note.id)}
                      data-testid={`button-summarize-${note.id}`}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Summarize
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isAnyAiLoading(note.id)}
                      onClick={() => studyGuideMutation.mutate(note.id)}
                      data-testid={`button-study-guide-${note.id}`}
                    >
                      <BookOpen className="h-3 w-3 mr-1" />
                      Study Guide
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isAnyAiLoading(note.id)}
                      onClick={() => flashcardMutation.mutate(note.id)}
                      data-testid={`button-gen-flashcards-${note.id}`}
                    >
                      <Layers className="h-3 w-3 mr-1" />
                      Flashcards
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isAnyAiLoading(note.id)}
                      onClick={() => {
                        if (onNavigateToQuiz) {
                          onNavigateToQuiz(note.id);
                        } else {
                          toast({ title: "Navigate to the Quiz tab to generate a quiz from this note" });
                        }
                      }}
                      data-testid={`button-gen-quiz-${note.id}`}
                    >
                      <Brain className="h-3 w-3 mr-1" />
                      Quiz
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isAnyAiLoading(note.id)}
                      onClick={() => podcastMutation.mutate(note.id)}
                      data-testid={`button-gen-podcast-${note.id}`}
                    >
                      <Headphones className="h-3 w-3 mr-1" />
                      Podcast
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isAnyAiLoading(note.id)}
                      onClick={() => illustrationMutation.mutate(note.id)}
                      data-testid={`button-gen-illustration-${note.id}`}
                    >
                      <Image className="h-3 w-3 mr-1" />
                      Illustrate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={aiResultOpen} onOpenChange={(open) => {
        setAiResultOpen(open);
        if (!open) {
          if (audioElement) {
            audioElement.pause();
            setAudioPlaying(false);
          }
          setAiResult(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {aiResult && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {aiResult.type === "summary" && <><FileText className="h-5 w-5 text-primary" /> Summary</>}
                  {aiResult.type === "study-guide" && <><BookOpen className="h-5 w-5 text-primary" /> Study Guide</>}
                  {aiResult.type === "podcast" && <><Headphones className="h-5 w-5 text-primary" /> Podcast</>}
                  {aiResult.type === "illustration" && <><Image className="h-5 w-5 text-primary" /> Illustration Prompt</>}
                </DialogTitle>
                <DialogDescription>
                  Generated from: {aiResult.noteTitle}
                </DialogDescription>
              </DialogHeader>

              {aiResult.type === "podcast" && aiResult.audio && (
                <Card className="bg-gradient-to-r from-primary/5 to-chart-2/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Button
                        size="icon"
                        variant="default"
                        onClick={() => audioPlaying ? toggleAudio() : playAudio(aiResult.audio!)}
                        data-testid="button-play-podcast"
                      >
                        {audioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Audio Podcast</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Volume2 className="h-3 w-3" />
                          {audioPlaying ? "Playing..." : "Click play to listen"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {aiResult.type === "illustration" && (
                <Card className="bg-gradient-to-r from-chart-3/5 to-primary/5">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-2">Generated Image Prompt</p>
                    <p className="text-xs text-muted-foreground">
                      You can use this prompt with any AI image generator to create a visual study aid.
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="prose prose-sm max-w-none">
                {renderMarkdown(aiResult.content)}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
