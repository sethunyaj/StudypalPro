import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, X, Headphones } from "lucide-react";
import type { SupportMessage } from "@shared/schema";

interface ContactAdminChatProps {
  userId: string;
  userRole: string;
  userName: string;
}

export function ContactAdminChat({ userId, userRole, userName }: ContactAdminChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: messages = [], isLoading } = useQuery<SupportMessage[]>({
    queryKey: ["/api/support/messages", userId],
    enabled: isOpen,
    refetchInterval: isOpen ? 5000 : false,
  });

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/support/unread", userId],
    refetchInterval: 15000,
  });

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      return await apiRequest("POST", "/api/support/messages", {
        userId,
        senderId: userId,
        senderRole: userRole,
        message: text,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/messages", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/support/unread", userId] });
      setMessage("");
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", "/api/support/messages/read", {
        userId,
        readerRole: userRole,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/unread", userId] });
    },
  });

  useEffect(() => {
    if (isOpen && unreadData && unreadData.count > 0) {
      markReadMutation.mutate();
    }
  }, [isOpen, unreadData?.count]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  function handleSend() {
    const trimmed = message.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const unreadCount = unreadData?.count || 0;

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-[340px] sm:w-[380px]">
          <Card className="shadow-xl border flex flex-col" style={{ height: "480px" }}>
            <CardHeader className="pb-2 border-b bg-primary/5 flex flex-row items-center justify-between gap-2 py-3 px-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Contact Admin</CardTitle>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-support-chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {isLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <Headphones className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Need help? Send a message to the admin team.
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      We'll get back to you as soon as possible.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === userId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        data-testid={`support-message-${msg.id}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            isMine
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {!isMine && (
                            <p className="text-xs font-medium mb-1 opacity-70">Admin</p>
                          )}
                          <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                          <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground/60"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  disabled={sendMutation.isPending}
                  data-testid="input-support-message"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!message.trim() || sendMutation.isPending}
                  data-testid="button-send-support-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Button
        className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg gap-2"
        size="lg"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="button-contact-admin"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            <MessageCircle className="h-5 w-5" />
            Contact Admin
          </>
        )}
        {!isOpen && unreadCount > 0 && (
          <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center text-[10px] p-0 px-1.5" data-testid="badge-unread-support">
            {unreadCount}
          </Badge>
        )}
      </Button>
    </>
  );
}
