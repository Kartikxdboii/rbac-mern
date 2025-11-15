import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getPostsForUser,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  logAuditEvent,
  createPostVersion,
  getPostVersions,
  createComment,
  getPostComments,
  updateComment,
  deleteComment,
  sharePost,
  getPostShares,
  getSharedWithMePosts,
  revokePostShare,
  createCategory,
  getAllCategories,
  addPostToCategory,
  removePostFromCategory,
  getPostCategories,
  createNotification,
  getUserById,
} from "../db";
import {
  hasPermission,
  isOwner,
  throwPermissionDenied,
  generateCorrelationId,
} from "../rbac";
export const postsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const posts = await getPostsForUser(ctx.user.id, ctx.user.role);
      const paginated = posts.slice(input.offset, input.offset + input.limit);
      return {
        posts: paginated,
        total: posts.length,
        limit: input.limit,
        offset: input.offset,
      };
    }),
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const post = await getPostById(input.id);
      if (!post) {
        throw new Error("Post not found");
      }
      const canView =
        ctx.user.role === "admin" || 
        isOwner(ctx.user, post.authorId) || 
        (post.status === "published" &&
          (post.visibility === "public" ||
            (post.visibility === "internal" &&
              ctx.user.role !== "viewer"))); 
      if (!canView) {
        const correlationId = generateCorrelationId();
        await logAuditEvent({
          userId: ctx.user.id,
          action: "read",
          resourceType: "post",
          resourceId: input.id,
          allowed: false,
          denialReason: "Insufficient permissions to view post",
          correlationId,
          metadata: null,
        });
        throwPermissionDenied("You do not have permission to view this post");
      }
      return post;
    }),
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        content: z.string().min(1),
        status: z.enum(["draft", "published"]).default("draft"),
        visibility: z.enum(["private", "internal", "public"]).default("private"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!hasPermission(ctx.user, "posts:create")) {
        const correlationId = generateCorrelationId();
        await logAuditEvent({
          userId: ctx.user.id,
          action: "create",
          resourceType: "post",
          resourceId: null,
          allowed: false,
          denialReason: "User role does not have post creation permission",
          correlationId,
          metadata: null,
        });
        throwPermissionDenied("You do not have permission to create posts");
      }
      const correlationId = generateCorrelationId();
      try {
        const post = await createPost({
          title: input.title,
          content: input.content,
          authorId: ctx.user.id,
          status: input.status,
          visibility: input.visibility,
        });
        await logAuditEvent({
          userId: ctx.user.id,
          action: "create",
          resourceType: "post",
          resourceId: post?.id || null,
          allowed: true,
          denialReason: null,
          correlationId,
          metadata: null,
        });
        return post;
      } catch (error) {
        await logAuditEvent({
          userId: ctx.user.id,
          action: "create",
          resourceType: "post",
          resourceId: null,
          allowed: false,
          denialReason: `Creation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          correlationId,
          metadata: null,
        });
        throw error;
      }
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        content: z.string().min(1).optional(),
        status: z.enum(["draft", "published"]).optional(),
        visibility: z.enum(["private", "internal", "public"]).optional(),
        tags: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const post = await getPostById(input.id);
      if (!post) {
        throw new Error("Post not found");
      }
      const correlationId = generateCorrelationId();
      const canUpdate =
        ctx.user.role === "admin" ||
        ctx.user.role === "editor";
      if (!canUpdate) {
        await logAuditEvent({
          userId: ctx.user.id,
          action: "update",
          resourceType: "post",
          resourceId: input.id,
          allowed: false,
          denialReason: "User does not have permission to update this post",
          correlationId,
          metadata: null,
        });
        throwPermissionDenied(
          "You do not have permission to update this post"
        );
      }
      try {
        const currentPost = await getPostById(input.id);
        if (currentPost) {
          await createPostVersion(
            currentPost.id,
            currentPost.title,
            currentPost.content,
            ctx.user.id,
            currentPost.version || 1
          );
        }
        const updated = await updatePost(input.id, {
          title: input.title,
          content: input.content,
          status: input.status,
          visibility: input.visibility,
          tags: input.tags,
        } as any);
        if (updated) {
          await updatePost(input.id, { version: (currentPost?.version || 1) + 1 } as any);
        }
        await logAuditEvent({
          userId: ctx.user.id,
          action: "update",
          resourceType: "post",
          resourceId: input.id,
          allowed: true,
          denialReason: null,
          correlationId,
          metadata: null,
        });
        return updated;
      } catch (error) {
        await logAuditEvent({
          userId: ctx.user.id,
          action: "update",
          resourceType: "post",
          resourceId: input.id,
          allowed: false,
          denialReason: `Update failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          correlationId,
          metadata: null,
        });
        throw error;
      }
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const post = await getPostById(input.id);
      if (!post) {
        throw new Error("Post not found");
      }
      const correlationId = generateCorrelationId();
      const canDelete =
        ctx.user.role === "admin" ||
        ctx.user.role === "editor";
      if (!canDelete) {
        await logAuditEvent({
          userId: ctx.user.id,
          action: "delete",
          resourceType: "post",
          resourceId: input.id,
          allowed: false,
          denialReason: "User does not have permission to delete this post",
          correlationId,
          metadata: null,
        });
        throwPermissionDenied(
          "You do not have permission to delete this post"
        );
      }
      try {
        await deletePost(input.id);
        await logAuditEvent({
          userId: ctx.user.id,
          action: "delete",
          resourceType: "post",
          resourceId: input.id,
          allowed: true,
          denialReason: null,
          correlationId,
          metadata: null,
        });
        return { success: true };
      } catch (error) {
        await logAuditEvent({
          userId: ctx.user.id,
          action: "delete",
          resourceType: "post",
          resourceId: input.id,
          allowed: false,
          denialReason: `Deletion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          correlationId,
          metadata: null,
        });
        throw error;
      }
    }),
  versions: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ ctx, input }) => {
      const post = await getPostById(input.postId);
      if (!post) throw new Error("Post not found");
      const canView = ctx.user.role === "admin" || isOwner(ctx.user, post.authorId);
      if (!canView) throwPermissionDenied("Cannot view post versions");
      return getPostVersions(input.postId);
    }),
  comments: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ input }) => {
      return getPostComments(input.postId);
    }),
  addComment: protectedProcedure
    .input(z.object({ postId: z.number(), content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const post = await getPostById(input.postId);
      if (!post) throw new Error("Post not found");
      const comment = await createComment(input.postId, ctx.user.id, input.content);
      if (post.authorId !== ctx.user.id) {
        await createNotification({
          userId: post.authorId,
          type: "comment",
          title: "New comment on your post",
          message: `${ctx.user.name} commented on "${post.title}"`,
          relatedResourceType: "post",
          relatedResourceId: post.id,
        });
      }
      return comment;
    }),
  updateComment: protectedProcedure
    .input(z.object({ commentId: z.number(), content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return updateComment(input.commentId, input.content);
    }),
  deleteComment: protectedProcedure
    .input(z.object({ commentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return deleteComment(input.commentId);
    }),
  sharePost: protectedProcedure
    .input(z.object({ postId: z.number(), userId: z.number(), canEdit: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      const post = await getPostById(input.postId);
      if (!post) throw new Error("Post not found");
      const canShare = ctx.user.role === "admin" || isOwner(ctx.user, post.authorId);
      if (!canShare) throwPermissionDenied("Cannot share this post");
      await sharePost(input.postId, input.userId, ctx.user.id, input.canEdit);
      const sharedUser = await getUserById(input.userId);
      if (sharedUser) {
        await createNotification({
          userId: input.userId,
          type: "share",
          title: "Post shared with you",
          message: `${ctx.user.name} shared "${post.title}" with you`,
          relatedResourceType: "post",
          relatedResourceId: post.id,
        });
      }
      return { success: true };
    }),
  shares: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ ctx, input }) => {
      const post = await getPostById(input.postId);
      if (!post) throw new Error("Post not found");
      const canView = ctx.user.role === "admin" || isOwner(ctx.user, post.authorId);
      if (!canView) throwPermissionDenied("Cannot view post shares");
      return getPostShares(input.postId);
    }),
  sharedWithMe: protectedProcedure
    .query(async ({ ctx }) => {
      return getSharedWithMePosts(ctx.user.id);
    }),
  allUsers: protectedProcedure
    .query(async () => {
      return getAllUsers();
    }),
  revokeShare: protectedProcedure
    .input(z.object({ shareId: z.number() }))
    .mutation(async ({ input }) => {
      return revokePostShare(input.shareId);
    }),
  categories: protectedProcedure
    .query(async () => {
      return getAllCategories();
    }),
  createCategory: protectedProcedure
    .input(z.object({ name: z.string().min(1), description: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throwPermissionDenied("Only admins can create categories");
      return createCategory(input.name, input.description);
    }),
  addToCategory: protectedProcedure
    .input(z.object({ postId: z.number(), categoryId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const post = await getPostById(input.postId);
      if (!post) throw new Error("Post not found");
      const canEdit = ctx.user.role === "admin" || isOwner(ctx.user, post.authorId);
      if (!canEdit) throwPermissionDenied("Cannot edit this post");
      return addPostToCategory(input.postId, input.categoryId);
    }),
  removeFromCategory: protectedProcedure
    .input(z.object({ postId: z.number(), categoryId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const post = await getPostById(input.postId);
      if (!post) throw new Error("Post not found");
      const canEdit = ctx.user.role === "admin" || isOwner(ctx.user, post.authorId);
      if (!canEdit) throwPermissionDenied("Cannot edit this post");
      return removePostFromCategory(input.postId, input.categoryId);
    }),
  postCategories: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ input }) => {
      return getPostCategories(input.postId);
    }),
});

