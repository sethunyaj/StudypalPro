import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, ArrowLeft, Inbox, MessageCircle, User, GraduationCap } from "lucide-react";
import type { SupportMessage } from "@shared/schema";

interface Conversation {
  userId: string;
  userName: string;
  userRole: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function SupportInbox({ adminUserId }: { adminUserId: string }) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: conversations = [], isLoading: convsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/support/conversations"],
    refetchInterval: 10000,
  });

  const { data: messages = [], isLoading: msgsLoading } = useQuery<SupportMessage[]>({
    queryKey: ["/api/support/messages", selectedConversation?.userId],
    enabled: !!selectedConversation,
    refetchInterval: selectedConversation ? 5000 : false,
  });

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!selectedConversation) return;
      return await apiRequest("POST", "/api/support/messages", {
        userId: selectedConversation.userId,
        senderId: adminUserId,
        senderRole: "admin",
        message: text,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/messages", selectedConversation?.userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/support/conversations"] });
      setReplyMessage("");
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("PATCH", "/api/support/messages/read", {
        userId,
        readerRole: "admin",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/conversations"] });
    },
  });

  useEffect(() => {
    if (selectedConversation && selectedConversation.unreadCount > 0) {
      markReadMutation.mutate(selectedConversation.userId);
    }
  }, [selectedConversation?.userId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (selectedConversation && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedConversation]);

  function handleSend() {
    const trimmed = replyMessage.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function selectConversation(conv: Conversation) {
    setSelectedConversation(conv);
    setReplyMessage("");
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  if (selectedConversation) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedConversation(null)}
            data-testid="button-back-conversations"
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {selectedConversation.userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm" data-testid="text-conversation-user">{selectedConversation.userName}</p>
              <Badge variant="secondary" className="text-[10px]">
                {selectedConversation.userRole === "teacher" ? (
                  <><GraduationCap className="h-3 w-3 mr-1" /> Teacher</>
                ) : (
                  <><User className="h-3 w-3 mr-1" /> Student</>
                )}
              </Badge>
            </div>
          </div>
        </div>

        <Card className="flex flex-col" style={{ height: "500px" }}>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {msgsLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No messages yet</p>
              ) : (
                messages.map((msg) => {
                  const isAdmin = msg.senderRole === "admin";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                      data-testid={`admin-support-message-${msg.id}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          isAdmin
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {!isAdmin && (
                          <p className="text-xs font-medium mb-1 opacity-70">{selectedConversation.userName}</p>
                        )}
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        <p className={`text-[10px] mt-1 ${isAdmin ? "text-primary-foreground/60" : "text-muted-foreground/60"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {" "}
                          {new Date(msg.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="border-t p-3 flex items-center gap-2 flex-shrink-0">
              <Input
                ref={inputRef}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your reply..."
                disabled={sendMutation.isPending}
                data-testid="input-admin-reply"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!replyMessage.trim() || sendMutation.isPending}
                data-testid="button-send-admin-reply"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold" data-testid="text-support-title">Support Inbox</h2>
          <p className="text-sm text-muted-foreground">
            {totalUnread > 0
              ? `${totalUnread} unread message${totalUnread > 1 ? "s" : ""}`
              : "Respond to teacher and student messages"}
          </p>
        </div>
      </div>

      {convsLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading conversations...</p>
      ) : conversations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No support messages yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              When teachers or students send messages, they'll appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Card
              key={conv.userId}
              className="hover-elevate cursor-pointer"
              onClick={() => selectConversation(conv)}
              data-testid={`conversation-card-${conv.userId}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback>
                      {conv.userName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-sm truncate" data-testid={`text-conv-name-${conv.userId}`}>{conv.userName}</span>
                        <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                          {conv.userRole === "teacher" ? "Teacher" : "Student"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {conv.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-[10px]" data-testid={`badge-unread-${conv.userId}`}>
                            {conv.unreadCount}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(conv.lastMessageAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5" data-testid={`text-conv-preview-${conv.userId}`}>
                      {conv.lastMessage}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
