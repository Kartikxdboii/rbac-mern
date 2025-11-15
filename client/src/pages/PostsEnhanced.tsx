import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGate, PermissionGateWrapper } from "@/components/PermissionGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Edit2, Trash2, MessageSquare, Share2, Tag, Send } from "lucide-react";
import { NavBar } from "@/components/NavBar";
export default function PostsEnhanced() {
  const { user } = useAuth();
  const { hasPermission, isAdmin, isEditor } = usePermissions();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<number | null>(null);
  const [viewingComments, setViewingComments] = useState<number | null>(null);
  const [sharingPost, setSharingPost] = useState<number | null>(null);
  const { data: postsData, isLoading, refetch } = trpc.posts.list.useQuery({ limit: 20, offset: 0 });
  const createPostMutation = trpc.posts.create.useMutation({
    onSuccess: () => {
      setIsCreateOpen(false);
      refetch();
      toast.success("Post created");
    },
  });
  const updatePostMutation = trpc.posts.update.useMutation({
    onSuccess: () => {
      setEditingPost(null);
      refetch();
      toast.success("Post updated");
    },
  });
  const deletePostMutation = trpc.posts.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Post deleted");
    },
  });
  const canEditPost = (authorId: number) => isAdmin() || isEditor();
  const canDeletePost = (authorId: number) => isAdmin() || isEditor();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  return (
    <>
      <NavBar />
      <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Posts</h1>
          <p className="text-muted-foreground mt-2">
            {user?.role === "admin" && "View and manage all posts"}
            {user?.role === "editor" && "Create and manage your posts"}
            {user?.role === "viewer" && "Read published posts"}
          </p>
        </div>
        <PermissionGate permission="posts:create">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
                <DialogDescription>Add a new post to share with others</DialogDescription>
              </DialogHeader>
              <PostForm onSubmit={(data) => createPostMutation.mutate(data)} isLoading={createPostMutation.isPending} />
            </DialogContent>
          </Dialog>
        </PermissionGate>
      </div>
      {postsData?.posts && postsData.posts.length > 0 ? (
        <div className="grid gap-4">
          {postsData.posts.map((post: any) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle>{post.title}</CardTitle>
                    <CardDescription>
                      By {post.authorId === user?.id ? "You" : `User ${post.authorId}`} •{" "}
                      {new Date(post.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={post.status === "published" ? "default" : "secondary"}>{post.status}</Badge>
                    <Badge variant="outline">{post.visibility}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{post.content}</p>
                {post.tags && (
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {post.tags.split(',').map((tag: string, i: number) => (
                      <Badge key={i} variant="outline">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  {canEditPost(post.authorId) && (
                    <Button variant="outline" size="sm" onClick={() => setEditingPost(post.id)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {canDeletePost(post.authorId) && (
                    <Button variant="destructive" size="sm" onClick={() => {
                      if (confirm("Delete this post?")) deletePostMutation.mutate({ id: post.id });
                    }}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setViewingComments(post.id)}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Comments
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSharingPost(post.id)}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No posts available</p>
          </CardContent>
        </Card>
      )}
      {editingPost && (
        <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
            </DialogHeader>
            <PostForm
              post={postsData?.posts.find((p: any) => p.id === editingPost)}
              onSubmit={(data) => updatePostMutation.mutate({ id: editingPost, ...data })}
              isLoading={updatePostMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
      {viewingComments && <CommentsDialog postId={viewingComments} onClose={() => setViewingComments(null)} />}
      {sharingPost && <ShareDialog postId={sharingPost} onClose={() => setSharingPost(null)} />}
      </div>
    </>
  );
}
function PostForm({ post, onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    title: post?.title || "",
    content: post?.content || "",
    status: post?.status || "draft",
    visibility: post?.visibility || "private",
    tags: post?.tags || "",
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
      </div>
      <div>
        <Label>Content</Label>
        <Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} required />
      </div>
      <div>
        <Label>Tags (comma-separated)</Label>
        <Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="react, typescript" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Visibility</Label>
          <Select value={formData.visibility} onValueChange={(value) => setFormData({ ...formData, visibility: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
              <SelectItem value="public">Public</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {post ? "Update" : "Create"} Post
      </Button>
    </form>
  );
}
function CommentsDialog({ postId, onClose }: { postId: number; onClose: () => void }) {
  const [comment, setComment] = useState("");
  const utils = trpc.useUtils();
  const { data: comments } = trpc.posts.comments.useQuery({ postId });
  const addCommentMutation = trpc.posts.addComment.useMutation({
    onSuccess: () => {
      setComment("");
      utils.posts.comments.invalidate();
      toast.success("Comment added");
    },
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          {comments?.map((c: any) => (
            <div key={c.id} className="mb-4 p-3 border rounded">
              <p className="text-sm">{c.content}</p>
              <p className="text-xs text-muted-foreground mt-2">
                User {c.userId} • {new Date(c.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </ScrollArea>
        <div className="flex gap-2">
          <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment..." />
          <Button onClick={() => addCommentMutation.mutate({ postId, content: comment })} disabled={!comment}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function ShareDialog({ postId, onClose }: { postId: number; onClose: () => void }) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const { data: allUsers, isLoading } = trpc.posts.allUsers.useQuery();
  const sharePostMutation = trpc.posts.sharePost.useMutation({
    onSuccess: () => {
      toast.success("Post shared successfully! User will be notified.");
      setSelectedUserId("");
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to share post");
    },
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Post</DialogTitle>
          <DialogDescription>Select a user to share this post with. They will receive a notification.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Select User</Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : !allUsers || allUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No users available</p>
            ) : (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map((u: any) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.name || u.email || `User ${u.id}`} - {u.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <Button 
            onClick={() => sharePostMutation.mutate({ postId, userId: parseInt(selectedUserId), canEdit: false })} 
            disabled={!selectedUserId || sharePostMutation.isPending || isLoading} 
            className="w-full"
          >
            {sharePostMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Share Post
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

