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
import { Loader2, Plus, Edit2, Trash2 } from "lucide-react";
export default function Posts() {
  const { user } = useAuth();
  const { hasPermission, isAdmin, isEditor } = usePermissions();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<number | null>(null);
  const { data: postsData, isLoading, refetch } = trpc.posts.list.useQuery({
    limit: 20,
    offset: 0,
  });
  const createPostMutation = trpc.posts.create.useMutation({
    onSuccess: () => {
      setIsCreateOpen(false);
      refetch();
    },
  });
  const updatePostMutation = trpc.posts.update.useMutation({
    onSuccess: () => {
      setEditingPost(null);
      refetch();
    },
  });
  const deletePostMutation = trpc.posts.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });
  const handleCreatePost = (formData: any) => {
    createPostMutation.mutate(formData);
  };
  const handleUpdatePost = (postId: number, formData: any) => {
    updatePostMutation.mutate({ id: postId, ...formData });
  };
  const handleDeletePost = (postId: number) => {
    if (confirm("Are you sure you want to delete this post?")) {
      deletePostMutation.mutate({ id: postId });
    }
  };
  const canEditPost = (authorId: number) => {
    return isAdmin() || (isEditor() && user?.id === authorId);
  };
  const canDeletePost = (authorId: number) => {
    return isAdmin() || (isEditor() && user?.id === authorId);
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  return (
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
                <DialogDescription>
                  Add a new post to share with others
                </DialogDescription>
              </DialogHeader>
              <CreatePostForm onSubmit={handleCreatePost} isLoading={createPostMutation.isPending} />
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
                    <Badge variant={post.status === "published" ? "default" : "secondary"}>
                      {post.status}
                    </Badge>
                    <Badge variant="outline">{post.visibility}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{post.content}</p>
                <div className="flex gap-2">
                  {canEditPost(post.authorId) && (
                    <PermissionGateWrapper
                      permission={isAdmin() ? "posts:update" : "posts:update_own"}
                      tooltipText="You don't have permission to edit this post"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingPost(post.id)}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </PermissionGateWrapper>
                  )}
                  {canDeletePost(post.authorId) && (
                    <PermissionGateWrapper
                      permission={isAdmin() ? "posts:delete" : "posts:delete_own"}
                      tooltipText="You don't have permission to delete this post"
                    >
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                        disabled={deletePostMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </PermissionGateWrapper>
                  )}
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
              <DialogDescription>
                Update your post details
              </DialogDescription>
            </DialogHeader>
            <EditPostForm
              postId={editingPost}
              post={postsData?.posts.find((p: any) => p.id === editingPost)}
              onSubmit={(data) => handleUpdatePost(editingPost, data)}
              isLoading={updatePostMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
function CreatePostForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    status: "draft",
    visibility: "private",
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Title</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Post title"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Content</label>
        <Textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Post content"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Status</label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Visibility</label>
          <Select value={formData.visibility} onValueChange={(value) => setFormData({ ...formData, visibility: value as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
              <SelectItem value="public">Public</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Create Post
      </Button>
    </form>
  );
}
function EditPostForm({ postId, post, onSubmit, isLoading }: { postId: number; post: any; onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    title: post?.title || "",
    content: post?.content || "",
    status: post?.status || "draft",
    visibility: post?.visibility || "private",
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Title</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Post title"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Content</label>
        <Textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Post content"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Status</label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Visibility</label>
          <Select value={formData.visibility} onValueChange={(value) => setFormData({ ...formData, visibility: value as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
              <SelectItem value="public">Public</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Update Post
      </Button>
    </form>
  );
}

