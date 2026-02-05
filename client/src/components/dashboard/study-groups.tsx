import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Plus, UserPlus, Crown, Copy, Check, ArrowLeft, MessageCircle, FileText, Megaphone, Trophy, Send, Trash2, Pin, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface StudyGroupsProps {
  userId: string;
  userName?: string;
}

export default function StudyGroups({ userId, userName = "Student" }: StudyGroupsProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  
  // Chat state
  const [message, setMessage] = useState("");
  
  // Notes state
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  
  // Announcement state
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);

  const { data: groups } = useQuery<any[]>({
    queryKey: ['/api/study-groups', userId],
  });

  const { data: allGroups } = useQuery<any[]>({
    queryKey: ['/api/study-groups/all'],
  });
  
  // Group messages
  const { data: messages } = useQuery<any[]>({
    queryKey: ['/api/study-groups', selectedGroup?.id, 'messages'],
    enabled: !!selectedGroup,
  });
  
  // Group notes
  const { data: groupNotes } = useQuery<any[]>({
    queryKey: ['/api/study-groups', selectedGroup?.id, 'notes'],
    enabled: !!selectedGroup,
  });
  
  // Group announcements
  const { data: announcements } = useQuery<any[]>({
    queryKey: ['/api/study-groups', selectedGroup?.id, 'announcements'],
    enabled: !!selectedGroup,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/study-groups", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/study-groups', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/study-groups/all'] });
      toast({ title: "Study group created!" });
      resetForm();
      setIsDialogOpen(false);
    },
  });

  const joinMutation = useMutation({
    mutationFn: (groupId: string) => apiRequest("POST", `/api/study-groups/${groupId}/join`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/study-groups', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/study-groups/all'] });
      toast({ title: "Joined group!" });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: (groupId: string) => apiRequest("POST", `/api/study-groups/${groupId}/leave`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/study-groups', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/study-groups/all'] });
      toast({ title: "Left group" });
      setSelectedGroup(null);
    },
  });

  const joinByCodeMutation = useMutation({
    mutationFn: (code: string) => apiRequest("POST", "/api/study-groups/join-by-code", { code, userId }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/study-groups', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/study-groups/all'] });
      toast({ title: "Joined group!", description: `Welcome to ${data.name}` });
      setJoinCode("");
      setIsJoinDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
  
  // Message mutations
  const sendMessageMutation = useMutation({
    mutationFn: (data: { groupId: string; content: string }) => 
      apiRequest("POST", `/api/study-groups/${data.groupId}/messages`, { userId, userName, content: data.content }),
    onSuccess: () => {
      if (selectedGroup) {
        queryClient.invalidateQueries({ queryKey: ['/api/study-groups', selectedGroup.id, 'messages'] });
      }
      setMessage("");
    },
  });
  
  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => apiRequest("DELETE", `/api/group-messages/${messageId}`),
    onSuccess: () => {
      if (selectedGroup) {
        queryClient.invalidateQueries({ queryKey: ['/api/study-groups', selectedGroup.id, 'messages'] });
      }
    },
  });
  
  // Note mutations
  const createNoteMutation = useMutation({
    mutationFn: (data: { groupId: string; title: string; content: string }) =>
      apiRequest("POST", `/api/study-groups/${data.groupId}/notes`, { userId, userName, title: data.title, content: data.content }),
    onSuccess: () => {
      if (selectedGroup) {
        queryClient.invalidateQueries({ queryKey: ['/api/study-groups', selectedGroup.id, 'notes'] });
      }
      setNoteTitle("");
      setNoteContent("");
      setIsNoteDialogOpen(false);
      toast({ title: "Note shared with group!" });
    },
  });
  
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => apiRequest("DELETE", `/api/group-notes/${noteId}`),
    onSuccess: () => {
      if (selectedGroup) {
        queryClient.invalidateQueries({ queryKey: ['/api/study-groups', selectedGroup.id, 'notes'] });
      }
      toast({ title: "Note deleted" });
    },
  });
  
  // Announcement mutations
  const createAnnouncementMutation = useMutation({
    mutationFn: (data: { groupId: string; title: string; content: string }) =>
      apiRequest("POST", `/api/study-groups/${data.groupId}/announcements`, { userId, userName, title: data.title, content: data.content }),
    onSuccess: () => {
      if (selectedGroup) {
        queryClient.invalidateQueries({ queryKey: ['/api/study-groups', selectedGroup.id, 'announcements'] });
      }
      setAnnouncementTitle("");
      setAnnouncementContent("");
      setIsAnnouncementDialogOpen(false);
      toast({ title: "Announcement posted!" });
    },
  });
  
  const deleteAnnouncementMutation = useMutation({
    mutationFn: (announcementId: string) => apiRequest("DELETE", `/api/group-announcements/${announcementId}`),
    onSuccess: () => {
      if (selectedGroup) {
        queryClient.invalidateQueries({ queryKey: ['/api/study-groups', selectedGroup.id, 'announcements'] });
      }
      toast({ title: "Announcement deleted" });
    },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({ title: "Code copied!", description: "Share this code with friends to invite them" });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setSubject("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      description,
      subject,
      creatorId: userId,
      memberIds: [userId],
    });
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && selectedGroup) {
      sendMessageMutation.mutate({ groupId: selectedGroup.id, content: message.trim() });
    }
  };
  
  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (noteTitle.trim() && noteContent.trim() && selectedGroup) {
      createNoteMutation.mutate({ groupId: selectedGroup.id, title: noteTitle.trim(), content: noteContent.trim() });
    }
  };
  
  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (announcementTitle.trim() && announcementContent.trim() && selectedGroup) {
      createAnnouncementMutation.mutate({ groupId: selectedGroup.id, title: announcementTitle.trim(), content: announcementContent.trim() });
    }
  };
  
  const formatTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const myGroupIds = new Set(groups?.map((g: any) => g.id) || []);
  const availableGroups = allGroups?.filter((g: any) => !myGroupIds.has(g.id)) || [];
  
  const isCreator = selectedGroup?.creatorId === userId;
  
  // Calculate leaderboard (simple version based on member activity - could be expanded)
  const leaderboard = selectedGroup?.memberIds?.map((memberId: string, idx: number) => ({
    id: memberId,
    name: memberId === userId ? userName : `Member ${idx + 1}`,
    xp: Math.floor(Math.random() * 500 + 100), // Placeholder - would come from real data
    position: idx + 1,
  })).sort((a: any, b: any) => b.xp - a.xp) || [];
  
  // Group Detail View
  if (selectedGroup) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedGroup(null)} data-testid="button-back-to-groups">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{selectedGroup.name}</h2>
              {isCreator && <Crown className="h-5 w-5 text-chart-2" />}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{selectedGroup.subject}</Badge>
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 font-mono text-xs"
                onClick={() => copyCode(selectedGroup.code)}
                data-testid="button-copy-group-code"
              >
                {copiedCode === selectedGroup.code ? (
                  <Check className="h-3 w-3 mr-1 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                {selectedGroup.code}
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedGroup.memberIds?.length || 0} members
              </span>
            </div>
          </div>
          <Button variant="outline" onClick={() => leaveMutation.mutate(selectedGroup.id)} data-testid="button-leave-group">
            Leave Group
          </Button>
        </div>
        
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="chat" data-testid="tab-chat">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="notes" data-testid="tab-notes">
              <FileText className="h-4 w-4 mr-2" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="announcements" data-testid="tab-announcements">
              <Megaphone className="h-4 w-4 mr-2" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="members" data-testid="tab-members">
              <Users className="h-4 w-4 mr-2" />
              Members
            </TabsTrigger>
            <TabsTrigger value="leaderboard" data-testid="tab-leaderboard">
              <Trophy className="h-4 w-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>
          
          {/* Chat Tab */}
          <TabsContent value="chat" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px] p-4">
                  {messages && messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((msg: any) => (
                        <div 
                          key={msg.id} 
                          className={`flex gap-3 ${msg.userId === userId ? 'flex-row-reverse' : ''}`}
                          data-testid={`message-${msg.id}`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {msg.userName?.substring(0, 2).toUpperCase() || 'US'}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`max-w-[70%] ${msg.userId === userId ? 'text-right' : ''}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{msg.userName}</span>
                              <span className="text-xs text-muted-foreground">{formatTime(msg.createdAt)}</span>
                            </div>
                            <div className={`p-3 rounded-lg ${msg.userId === userId ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                              <p className="text-sm">{msg.content}</p>
                            </div>
                            {msg.userId === userId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-1 h-6 text-xs text-muted-foreground"
                                onClick={() => deleteMessageMutation.mutate(msg.id)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mb-2" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  )}
                </ScrollArea>
                <form onSubmit={handleSendMessage} className="flex gap-2 p-4 border-t">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    data-testid="input-chat-message"
                  />
                  <Button type="submit" disabled={sendMessageMutation.isPending || !message.trim()} data-testid="button-send-message">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Notes Tab */}
          <TabsContent value="notes" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Shared Notes</h3>
              <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-note">
                    <Plus className="h-4 w-4 mr-2" />
                    Share Note
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share a Note</DialogTitle>
                    <DialogDescription>Share study notes with your group</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateNote} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="noteTitle">Title</Label>
                      <Input
                        id="noteTitle"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        placeholder="Note title"
                        data-testid="input-note-title"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="noteContent">Content</Label>
                      <Textarea
                        id="noteContent"
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Write your note content..."
                        rows={6}
                        data-testid="textarea-note-content"
                        required
                      />
                    </div>
                    <Button type="submit" disabled={createNoteMutation.isPending} data-testid="button-save-note">
                      {createNoteMutation.isPending ? "Sharing..." : "Share Note"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            {groupNotes && groupNotes.length > 0 ? (
              <div className="grid gap-4">
                {groupNotes.map((note: any) => (
                  <Card key={note.id} data-testid={`note-${note.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{note.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <span>by {note.userName}</span>
                            <span className="text-xs">• {formatDate(note.createdAt)}</span>
                          </CardDescription>
                        </div>
                        {note.userId === userId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNoteMutation.mutate(note.id)}
                            data-testid={`button-delete-note-${note.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No shared notes yet</h3>
                <p className="text-sm text-muted-foreground">Be the first to share study notes with your group!</p>
              </Card>
            )}
          </TabsContent>
          
          {/* Announcements Tab */}
          <TabsContent value="announcements" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Announcements</h3>
              {isCreator && (
                <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-announcement">
                      <Plus className="h-4 w-4 mr-2" />
                      Post Announcement
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Post Announcement</DialogTitle>
                      <DialogDescription>Share an important update with your group</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="announcementTitle">Title</Label>
                        <Input
                          id="announcementTitle"
                          value={announcementTitle}
                          onChange={(e) => setAnnouncementTitle(e.target.value)}
                          placeholder="Announcement title"
                          data-testid="input-announcement-title"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="announcementContent">Content</Label>
                        <Textarea
                          id="announcementContent"
                          value={announcementContent}
                          onChange={(e) => setAnnouncementContent(e.target.value)}
                          placeholder="Write your announcement..."
                          rows={4}
                          data-testid="textarea-announcement-content"
                          required
                        />
                      </div>
                      <Button type="submit" disabled={createAnnouncementMutation.isPending} data-testid="button-save-announcement">
                        {createAnnouncementMutation.isPending ? "Posting..." : "Post Announcement"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            
            {announcements && announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((announcement: any) => (
                  <Card key={announcement.id} className={announcement.pinned ? 'border-chart-2' : ''} data-testid={`announcement-${announcement.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {announcement.pinned && <Pin className="h-4 w-4 text-chart-2" />}
                          <CardTitle className="text-base">{announcement.title}</CardTitle>
                        </div>
                        {announcement.userId === userId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                            data-testid={`button-delete-announcement-${announcement.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <Megaphone className="h-3 w-3" />
                        <span>by {announcement.userName}</span>
                        <span className="text-xs">• {formatDate(announcement.createdAt)}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No announcements yet</h3>
                <p className="text-sm text-muted-foreground">
                  {isCreator ? "Post an announcement to keep your group informed!" : "Group announcements will appear here"}
                </p>
              </Card>
            )}
          </TabsContent>
          
          {/* Members Tab */}
          <TabsContent value="members" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Group Members ({selectedGroup.memberIds?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedGroup.memberIds?.map((memberId: string, idx: number) => (
                    <div key={memberId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50" data-testid={`member-${memberId}`}>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {memberId === userId ? userName.substring(0, 2).toUpperCase() : memberId.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {memberId === userId ? `${userName} (You)` : `Member ${idx + 1}`}
                        </p>
                        {memberId === selectedGroup.creatorId && (
                          <div className="flex items-center gap-1 text-xs text-chart-2">
                            <Crown className="h-3 w-3" />
                            <span>Group Creator</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="h-5 w-5 text-chart-2" />
                  Group Leaderboard
                </CardTitle>
                <CardDescription>Top contributors this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.map((member: any, idx: number) => (
                    <div 
                      key={member.id} 
                      className={`flex items-center gap-3 p-3 rounded-lg ${idx === 0 ? 'bg-chart-2/10 border border-chart-2/30' : 'hover:bg-muted/50'}`}
                      data-testid={`leaderboard-${member.id}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        idx === 0 ? 'bg-chart-2 text-white' : 
                        idx === 1 ? 'bg-gray-300 text-gray-700' : 
                        idx === 2 ? 'bg-orange-300 text-orange-700' : 
                        'bg-muted text-muted-foreground'
                      }`}>
                        {idx + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {member.id === userId ? userName.substring(0, 2).toUpperCase() : member.id.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {member.id === userId ? `${userName} (You)` : member.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-chart-2">{member.xp} XP</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Study Groups</h2>
          <p className="text-sm text-muted-foreground">Learn together, achieve more</p>
        </div>
        <div className="flex gap-2">
          {/* Join by Code Dialog */}
          <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-join-by-code">
                <UserPlus className="h-4 w-4 mr-2" />
                Join by Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join Study Group</DialogTitle>
                <DialogDescription>Enter the group code shared by your friend</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); joinByCodeMutation.mutate(joinCode); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="joinCode">Group Code</Label>
                  <Input
                    id="joinCode"
                    data-testid="input-join-code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-character code"
                    maxLength={6}
                    className="text-center text-lg font-mono tracking-widest uppercase"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  data-testid="button-submit-join-code" 
                  disabled={joinByCodeMutation.isPending || joinCode.length !== 6}
                  className="w-full"
                >
                  {joinByCodeMutation.isPending ? "Joining..." : "Join Group"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          
          {/* Create Group Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-group">
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Study Group</DialogTitle>
              <DialogDescription>Start a new group for collaborative learning</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  data-testid="input-group-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., AP Chemistry Study Squad"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  data-testid="input-group-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Chemistry"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  data-testid="textarea-group-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this group about?"
                  rows={3}
                />
              </div>
              <Button type="submit" data-testid="button-save-group" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Group"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* My Groups */}
      {groups && groups.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">My Groups</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group: any) => (
              <Card 
                key={group.id} 
                className="hover-elevate cursor-pointer" 
                data-testid={`my-group-${group.id}`}
                onClick={() => setSelectedGroup(group)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">{group.name}</CardTitle>
                    {group.creatorId === userId && (
                      <Crown className="h-4 w-4 text-chart-2 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{group.subject}</Badge>
                    {group.code && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 font-mono text-xs"
                        onClick={(e) => { e.stopPropagation(); copyCode(group.code); }}
                        data-testid={`button-copy-code-${group.id}`}
                      >
                        {copiedCode === group.code ? (
                          <Check className="h-3 w-3 mr-1 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3 mr-1" />
                        )}
                        {group.code}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {group.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {group.memberIds?.slice(0, 3).map((memberId: string, idx: number) => (
                        <Avatar key={idx} className="h-8 w-8 border-2 border-card">
                          <AvatarFallback className="text-xs">
                            {memberId.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {group.memberIds && group.memberIds.length > 3 && (
                        <div className="h-8 w-8 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                          <span className="text-xs">+{group.memberIds.length - 3}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); leaveMutation.mutate(group.id); }}
                      disabled={leaveMutation.isPending}
                      data-testid={`button-leave-${group.id}`}
                    >
                      Leave
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Groups */}
      {availableGroups.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Discover Groups</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableGroups.map((group: any) => (
              <Card key={group.id} className="hover-elevate" data-testid={`available-group-${group.id}`}>
                <CardHeader>
                  <CardTitle className="text-base line-clamp-2">{group.name}</CardTitle>
                  <Badge variant="secondary" className="w-fit">{group.subject}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {group.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{group.memberIds?.length || 0} members</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => joinMutation.mutate(group.id)}
                      disabled={joinMutation.isPending}
                      data-testid={`button-join-${group.id}`}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Join
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!groups || groups.length === 0) && availableGroups.length === 0 && (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No study groups yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create or join a group to collaborate with other students
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Group
          </Button>
        </Card>
      )}
    </div>
  );
}
