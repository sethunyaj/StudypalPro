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
import { Users, Plus, UserPlus, Crown } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface StudyGroupsProps {
  userId: string;
}

export default function StudyGroups({ userId }: StudyGroupsProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");

  const { data: groups } = useQuery({
    queryKey: ['/api/study-groups', userId],
  });

  const { data: allGroups } = useQuery({
    queryKey: ['/api/study-groups/all'],
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
    },
  });

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

  const myGroupIds = new Set(groups?.map((g: any) => g.id) || []);
  const availableGroups = allGroups?.filter((g: any) => !myGroupIds.has(g.id)) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Study Groups</h2>
          <p className="text-sm text-muted-foreground">Learn together, achieve more</p>
        </div>
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

      {/* My Groups */}
      {groups && groups.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">My Groups</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group: any) => (
              <Card key={group.id} className="hover-elevate" data-testid={`my-group-${group.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">{group.name}</CardTitle>
                    {group.creatorId === userId && (
                      <Crown className="h-4 w-4 text-chart-2 flex-shrink-0" />
                    )}
                  </div>
                  <Badge variant="secondary" className="w-fit">{group.subject}</Badge>
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
                      onClick={() => leaveMutation.mutate(group.id)}
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
