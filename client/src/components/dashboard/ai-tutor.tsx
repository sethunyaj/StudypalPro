import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Brain, Send, Loader2, Plus, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AITutorProps {
  userId: string;
}

export default function AITutor({ userId }: AITutorProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations } = useQuery({
    queryKey: ['/api/tutor-conversations', userId],
  });

  const sendMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/tutor/chat", data),
    onSuccess: (response) => {
      setActiveConversation(response.conversation);
      queryClient.invalidateQueries({ queryKey: ['/api/tutor-conversations', userId] });
      setMessage("");
    },
  });

  const newConversationMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/tutor-conversations", { userId }),
    onSuccess: (conversation) => {
      setActiveConversation(conversation);
      queryClient.invalidateQueries({ queryKey: ['/api/tutor-conversations', userId] });
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/tutor-conversations/${id}`, {}),
    onSuccess: () => {
      if (activeConversation && deleteConversationMutation.variables === activeConversation.id) {
        setActiveConversation(null);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/tutor-conversations', userId] });
      toast({ title: "Conversation deleted" });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (!activeConversation) {
      newConversationMutation.mutate();
    }

    sendMutation.mutate({
      conversationId: activeConversation?.id,
      userId,
      message: message.trim(),
    });
  };

  const handleNewChat = () => {
    newConversationMutation.mutate();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-300px)]">
      {/* Conversations Sidebar */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Chats</CardTitle>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleNewChat}
              data-testid="button-new-chat"
              disabled={newConversationMutation.isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="space-y-2 p-4">
              {conversations && conversations.length > 0 ? (
                conversations.map((conv: any) => (
                  <div
                    key={conv.id}
                    className={`group p-3 rounded-lg cursor-pointer hover-elevate ${
                      activeConversation?.id === conv.id ? 'bg-primary/10 border border-primary/20' : 'bg-card border'
                    }`}
                    onClick={() => setActiveConversation(conv)}
                    data-testid={`conversation-${conv.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {conv.subject || 'New Conversation'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.messages?.[0]?.content?.substring(0, 50) || 'Start chatting...'}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversationMutation.mutate(conv.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No conversations yet
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="lg:col-span-3 flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">AI Tutor</CardTitle>
              <CardDescription>Ask me anything about your studies</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            {activeConversation?.messages && activeConversation.messages.length > 0 ? (
              <div className="space-y-4">
                {activeConversation.messages.map((msg: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    data-testid={`message-${idx}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {sendMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <p className="text-sm">Thinking...</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md">
                  <Brain className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Welcome to AI Tutor!</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      I can help you with homework, explain concepts, solve problems, and answer questions about any subject.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="secondary">Math Help</Badge>
                    <Badge variant="secondary">Science Explanations</Badge>
                    <Badge variant="secondary">Essay Writing</Badge>
                    <Badge variant="secondary">Study Tips</Badge>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          <div className="border-t p-4">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input
                placeholder="Ask me anything..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={sendMutation.isPending}
                data-testid="input-message"
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={sendMutation.isPending || !message.trim()}
                data-testid="button-send"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
