import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Plus,
  Newspaper,
  Video,
  Calendar,
  Clock,
  Send,
  Trash2,
  Edit2,
  ExternalLink,
  Download,
  User as UserIcon,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import logoPath from "@assets/Hibiscus StudyPal logo_1762337029890.png";
import type { NewsPost, NewsComment } from "@shared/schema";

type NewsPostWithMeta = NewsPost & {
  likeCount: number;
  commentCount: number;
  isLikedByUser: boolean;
};

function extractVideoId(url: string): { provider: string; id: string } | null {
  const youtubeRegex =
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;

  const ytMatch = url.match(youtubeRegex);
  if (ytMatch) return { provider: "youtube", id: ytMatch[1] };

  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) return { provider: "vimeo", id: vimeoMatch[1] };

  return null;
}

function VideoEmbed({ url }: { url: string }) {
  const info = extractVideoId(url);
  if (!info) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline flex items-center gap-1"
        data-testid="link-video-external"
      >
        <ExternalLink className="h-4 w-4" />
        Watch Video
      </a>
    );
  }

  const embedUrl =
    info.provider === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${info.id}`
      : `https://player.vimeo.com/video/${info.id}`;

  return (
    <div className="relative w-full pt-[56.25%] rounded-md overflow-hidden bg-muted" data-testid="video-embed">
      <iframe
        className="absolute inset-0 w-full h-full"
        src={embedUrl}
        title="Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function CommentSection({
  postId,
  user,
}: {
  postId: string;
  user: any;
}) {
  const [newComment, setNewComment] = useState("");

  const { data: comments = [], isLoading } = useQuery<NewsComment[]>({
    queryKey: ["/api/news", postId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/news/${postId}/comments`);
      return res.json();
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/news/${postId}/comments`, {
        userId: user.id,
        userName: user.name,
        content,
      });
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/news", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
    },
    onError: (error: any) => {
      console.error("Failed to add comment:", error);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return await apiRequest(
        "DELETE",
        `/api/news/${postId}/comments/${commentId}?userId=${user.id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
    },
  });

  return (
    <div className="space-y-3 pt-3 border-t" data-testid={`comments-section-${postId}`}>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newComment.trim()) {
              addCommentMutation.mutate(newComment.trim());
            }
          }}
          className="flex-1"
          data-testid={`input-comment-${postId}`}
        />
        <Button
          size="icon"
          onClick={() => {
            if (newComment.trim()) addCommentMutation.mutate(newComment.trim());
          }}
          disabled={!newComment.trim() || addCommentMutation.isPending}
          data-testid={`button-submit-comment-${postId}`}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading comments...</p>
      )}

      {comments.map((comment) => (
        <div
          key={comment.id}
          className="flex items-start gap-2 group"
          data-testid={`comment-${comment.id}`}
        >
          <div className="flex-shrink-0 h-7 w-7 rounded-full bg-muted flex items-center justify-center">
            <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium" data-testid={`text-comment-author-${comment.id}`}>
                {comment.userName}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground" data-testid={`text-comment-content-${comment.id}`}>
              {comment.content}
            </p>
          </div>
          {(user.role === "admin" || user.id === comment.userId) && (
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ visibility: "visible" }}
              onClick={() => deleteCommentMutation.mutate(comment.id)}
              data-testid={`button-delete-comment-${comment.id}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

function PostCard({
  post,
  user,
  onEdit,
}: {
  post: NewsPostWithMeta;
  user: any;
  onEdit: (post: NewsPostWithMeta) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const { toast } = useToast();

  const likeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/news/${post.id}/like`, {
        userId: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(
        "DELETE",
        `/api/news/${post.id}?userId=${user.id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({ title: "Post deleted" });
    },
  });

  const isScheduled =
    post.status === "scheduled" &&
    post.scheduledAt &&
    new Date(post.scheduledAt) > new Date();

  return (
    <Card data-testid={`card-post-${post.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant={post.type === "video" ? "default" : "secondary"}
              data-testid={`badge-post-type-${post.id}`}
            >
              {post.type === "video" ? (
                <Video className="h-3 w-3 mr-1" />
              ) : (
                <Newspaper className="h-3 w-3 mr-1" />
              )}
              {post.type === "video" ? "Video" : "Newsletter"}
            </Badge>
            {isScheduled && (
              <Badge variant="outline" data-testid={`badge-scheduled-${post.id}`}>
                <Clock className="h-3 w-3 mr-1" />
                Scheduled{" "}
                {post.scheduledAt &&
                  format(new Date(post.scheduledAt), "MMM d, yyyy h:mm a")}
              </Badge>
            )}
            {post.status === "draft" && (
              <Badge variant="outline" data-testid={`badge-draft-${post.id}`}>
                Draft
              </Badge>
            )}
          </div>
          {user.role === "admin" && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(post)}
                data-testid={`button-edit-post-${post.id}`}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteMutation.mutate()}
                data-testid={`button-delete-post-${post.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <CardTitle className="text-lg" data-testid={`text-post-title-${post.id}`}>
          {post.title}
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <span data-testid={`text-post-author-${post.id}`}>
            {post.authorName}, {post.authorRole}
          </span>
          <span>
            {formatDistanceToNow(new Date(post.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {post.type === "video" && post.videoUrl && (
          <VideoEmbed url={post.videoUrl} />
        )}

        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full max-h-80 object-cover rounded-md"
            data-testid={`img-post-${post.id}`}
          />
        )}

        {post.body && (
          <p
            className="text-sm text-muted-foreground whitespace-pre-wrap"
            data-testid={`text-post-body-${post.id}`}
          >
            {post.body}
          </p>
        )}

        {post.attachmentUrl && (
          <a
            href={post.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            data-testid={`link-attachment-${post.id}`}
          >
            <Download className="h-4 w-4" />
            {post.attachmentName || "Download Attachment"}
          </a>
        )}

        <div className="flex items-center gap-4 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => likeMutation.mutate()}
            className={post.isLikedByUser ? "text-red-500" : ""}
            data-testid={`button-like-${post.id}`}
          >
            <Heart
              className={`h-4 w-4 mr-1 ${post.isLikedByUser ? "fill-current" : ""}`}
            />
            <span data-testid={`text-like-count-${post.id}`}>{post.likeCount}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            data-testid={`button-toggle-comments-${post.id}`}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            <span data-testid={`text-comment-count-${post.id}`}>{post.commentCount}</span>
          </Button>
        </div>

        {showComments && <CommentSection postId={post.id} user={user} />}
      </CardContent>
    </Card>
  );
}

function CreateEditPostDialog({
  open,
  onOpenChange,
  user,
  editingPost,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  editingPost: NewsPostWithMeta | null;
}) {
  const { toast } = useToast();
  const [postType, setPostType] = useState<"newsletter" | "video">("newsletter");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [authorName, setAuthorName] = useState(user?.name || "");
  const [authorRole, setAuthorRole] = useState("CEO");
  const [publishMode, setPublishMode] = useState<"now" | "scheduled">("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  useEffect(() => {
    if (editingPost) {
      setPostType(editingPost.type as "newsletter" | "video");
      setTitle(editingPost.title);
      setBody(editingPost.body || "");
      setImageUrl(editingPost.imageUrl || "");
      setAttachmentUrl(editingPost.attachmentUrl || "");
      setAttachmentName(editingPost.attachmentName || "");
      setVideoUrl(editingPost.videoUrl || "");
      setAuthorName(editingPost.authorName);
      setAuthorRole(editingPost.authorRole);
      if (editingPost.status === "scheduled" && editingPost.scheduledAt) {
        setPublishMode("scheduled");
        const d = new Date(editingPost.scheduledAt);
        setScheduledDate(format(d, "yyyy-MM-dd"));
        setScheduledTime(format(d, "HH:mm"));
      } else {
        setPublishMode("now");
        setScheduledDate("");
        setScheduledTime("");
      }
    } else {
      setPostType("newsletter");
      setTitle("");
      setBody("");
      setImageUrl("");
      setAttachmentUrl("");
      setAttachmentName("");
      setVideoUrl("");
      setAuthorName(user?.name || "");
      setAuthorRole("CEO");
      setPublishMode("now");
      setScheduledDate("");
      setScheduledTime("");
    }
  }, [editingPost, user, open]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/news", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      onOpenChange(false);
      toast({ title: "Post created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create post", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/news/${editingPost!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      onOpenChange(false);
      toast({ title: "Post updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update post", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    let scheduledAt: Date | null = null;
    let status = "published";

    if (publishMode === "scheduled" && scheduledDate && scheduledTime) {
      scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
      status = "scheduled";
    }

    const data: any = {
      type: postType,
      title: title.trim(),
      body: body.trim() || null,
      imageUrl: imageUrl.trim() || null,
      attachmentUrl: attachmentUrl.trim() || null,
      attachmentName: attachmentName.trim() || null,
      videoUrl: postType === "video" ? videoUrl.trim() || null : null,
      videoProvider: postType === "video" && videoUrl ? (extractVideoId(videoUrl)?.provider || null) : null,
      authorName: authorName.trim(),
      authorRole: authorRole.trim(),
      authorId: user.id,
      status,
      scheduledAt,
    };

    if (editingPost) {
      updateMutation.mutate({ ...data, userId: user.id });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            {editingPost ? "Edit Post" : "Create New Post"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Post Type</Label>
            <Select value={postType} onValueChange={(v) => setPostType(v as "newsletter" | "video")}>
              <SelectTrigger data-testid="select-post-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newsletter">Newsletter</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title"
              data-testid="input-post-title"
            />
          </div>

          <div>
            <Label>{postType === "video" ? "Description" : "Body"}</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={postType === "video" ? "Short description..." : "Newsletter content..."}
              rows={postType === "video" ? 3 : 6}
              data-testid="input-post-body"
            />
          </div>

          {postType === "video" && (
            <div>
              <Label>Video URL (YouTube or Vimeo)</Label>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                data-testid="input-video-url"
              />
              {videoUrl && extractVideoId(videoUrl) && (
                <div className="mt-2">
                  <VideoEmbed url={videoUrl} />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Author Name</Label>
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="John Smith"
                data-testid="input-author-name"
              />
            </div>
            <div>
              <Label>Author Role</Label>
              <Input
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                placeholder="CEO"
                data-testid="input-author-role"
              />
            </div>
          </div>

          {postType === "newsletter" && (
            <>
              <div>
                <Label>Image URL (optional)</Label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  data-testid="input-image-url"
                />
              </div>

              <div>
                <Label>Attachment URL (optional, e.g., PDF link)</Label>
                <Input
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="https://example.com/document.pdf"
                  data-testid="input-attachment-url"
                />
              </div>

              {attachmentUrl && (
                <div>
                  <Label>Attachment Label</Label>
                  <Input
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    placeholder="Monthly Newsletter.pdf"
                    data-testid="input-attachment-name"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <Label>Publishing</Label>
            <Select value={publishMode} onValueChange={(v) => setPublishMode(v as "now" | "scheduled")}>
              <SelectTrigger data-testid="select-publish-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="now">Publish Now</SelectItem>
                <SelectItem value="scheduled">Schedule for Later</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {publishMode === "scheduled" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  data-testid="input-scheduled-date"
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  data-testid="input-scheduled-time"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-post">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
            data-testid="button-submit-post"
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Saving..."
              : editingPost
              ? "Update Post"
              : "Create Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function NewsPage() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<NewsPostWithMeta | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setLocation("/");
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [setLocation]);

  const { data: posts = [], isLoading } = useQuery<NewsPostWithMeta[]>({
    queryKey: ["/api/news"],
    queryFn: async () => {
      const res = await fetch(`/api/news?userId=${user?.id || ""}`);
      return res.json();
    },
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        <Card className="shadow-lg border overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-chart-2/10 to-chart-3/10 border-b pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLocation(user.role === "admin" ? "/admin" : "/dashboard")}
                  data-testid="button-back-dashboard"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <img
                  src={logoPath}
                  alt="Hibiscus StudyPal"
                  className="h-10 w-auto"
                />
                <div>
                  <h1 className="text-xl font-bold" data-testid="text-page-title">
                    News & Updates
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Stay up to date with the latest announcements
                  </p>
                </div>
              </div>
              {user.role === "admin" && (
                <Button
                  onClick={() => {
                    setEditingPost(null);
                    setShowCreateDialog(true);
                  }}
                  data-testid="button-create-post"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-4 md:p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-1/4" />
                      <div className="h-6 bg-muted rounded w-3/4 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium" data-testid="text-empty-state">
                  No posts yet
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {user.role === "admin"
                    ? "Create your first newsletter or video post to get started."
                    : "Check back later for updates and announcements."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    user={user}
                    onEdit={(p) => {
                      setEditingPost(p);
                      setShowCreateDialog(true);
                    }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateEditPostDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        user={user}
        editingPost={editingPost}
      />
    </div>
  );
}
