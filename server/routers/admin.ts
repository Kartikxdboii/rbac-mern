/**
 * Admin router for user and role management
 * Restricted to admin users only
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import type { User, AuditLog } from "../../drizzle/schema";
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAuditLogs,
  getAllRolePermissions,
  logAuditEvent,
  addRolePermission,
  removeRolePermission,
  getAvailablePermissions,
  registerUser,
  createPasswordResetToken,
  verifyPasswordResetToken,
  markPasswordResetUsed,
  resetUserPassword,
  getUserSessions,
  revokeSession,
  revokeAllUserSessions,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  assignTemporaryRole,
  getActiveTemporaryRole,
  revokeTemporaryRole,
  getUserTemporaryRoles,
  getUserById,
  createNotification,
} from "../db";
import { requireAdmin, generateCorrelationId, throwPermissionDenied, updateCustomRolePermission } from "../rbac";
import { createCustomRole, deleteCustomRole, listCustomRolePermissions, listCustomRoles, addCustomRolePermission, removeCustomRolePermission, assignUserCustomRole } from "../db";

export const adminRouter = router({
  /**
   * Get all users (admin only)
   */
  users: protectedProcedure
    .use(requireAdmin())
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const users = await getAllUsers();

      const paginated = users.slice(input.offset, input.offset + input.limit);

      return {
        users: paginated,
        total: users.length,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Update a user's role (admin only)
   */
  updateUserRole: protectedProcedure
    .use(requireAdmin())
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["admin", "editor", "viewer"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const correlationId = generateCorrelationId();

      try {
        const user = await updateUserRole(input.userId, input.role);

        // Log the role change
        await logAuditEvent({
          userId: ctx.user.id,
          action: "update",
          resourceType: "user",
          resourceId: input.userId,
          allowed: true,
          denialReason: null,
          correlationId,
          metadata: null,
        });

        return user;
      } catch (error) {
        await logAuditEvent({
          userId: ctx.user.id,
          action: "update",
          resourceType: "user",
          resourceId: input.userId,
          allowed: false,
          denialReason: `Failed to update user role: ${error instanceof Error ? error.message : "Unknown error"}`,
          correlationId,
          metadata: null,
        });
        throw error;
      }
    }),

  /**
   * Get audit logs (admin only)
   */
  auditLogs: protectedProcedure
    .use(requireAdmin())
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const logs = await getAuditLogs(input.limit, input.offset);
      return logs;
    }),

  /**
   * Get all role permissions (admin only)
   */
  rolePermissions: protectedProcedure
    .use(requireAdmin())
    .query(async () => {
      return getAllRolePermissions();
    }),

  /**
   * Create a new user (admin only)
   */
  createUser: protectedProcedure
    .use(requireAdmin())
    .input(
      z.object({
        name: z.string().min(1).max(255),
        email: z.string().email(),
        role: z.enum(["admin", "editor", "viewer"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const correlationId = generateCorrelationId();

      try {
        // Generate a unique openId for the new user
        const openId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create the user
        const { upsertUser, getUserByOpenId } = await import("../db");
        await upsertUser({
          openId,
          name: input.name,
          email: input.email,
          role: input.role,
          loginMethod: "admin-created",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        });

        const newUser = await getUserByOpenId(openId);

        // Log the user creation
        await logAuditEvent({
          userId: ctx.user.id,
          action: "create",
          resourceType: "user",
          resourceId: newUser?.id || null,
          allowed: true,
          denialReason: null,
          correlationId,
          metadata: null,
        });

        return newUser;
      } catch (error) {
        await logAuditEvent({
          userId: ctx.user.id,
          action: "create",
          resourceType: "user",
          resourceId: null,
          allowed: false,
          denialReason: `Failed to create user: ${error instanceof Error ? error.message : "Unknown error"}`,
          correlationId,
          metadata: null,
        });
        throw error;
      }
    }),

  /**
   * Get dashboard stats (admin only)
   */
  stats: protectedProcedure
    .use(requireAdmin())
    .query(async () => {
      const users = (await getAllUsers()) as User[];
      const logs = (await getAuditLogs(1000, 0)) as AuditLog[]; // Get recent logs

      // Count users by role
      const roleStats = {
        admin: users.filter((u: User) => u.role === "admin").length,
        editor: users.filter((u: User) => u.role === "editor").length,
        viewer: users.filter((u: User) => u.role === "viewer").length,
      };

      // Count authorization denials
      const denialStats = {
        total: logs.filter((l: AuditLog) => !l.allowed).length,
        byAction: {} as Record<string, number>,
      };

      logs
        .filter((l: AuditLog) => !l.allowed)
        .forEach((log: AuditLog) => {
          denialStats.byAction[log.action] =
            (denialStats.byAction[log.action] || 0) + 1;
        });

      return {
        totalUsers: users.length,
        roleStats,
        recentDenials: denialStats,
        lastUpdated: new Date(),
      };
    }),

  /**
   * Get available permissions (admin only)
   */
  availablePermissions: protectedProcedure
    .use(requireAdmin())
    .query(async () => {
      return getAvailablePermissions();
    }),

  // ===== Custom Roles Management =====
  customRoles: protectedProcedure
    .use(requireAdmin())
    .query(async () => {
      const roles = await listCustomRoles();
      return roles;
    }),

  customRolePermissions: protectedProcedure
    .use(requireAdmin())
    .input(z.object({ customRoleId: z.number() }))
    .query(async ({ input }) => {
      return listCustomRolePermissions(input.customRoleId);
    }),

  createCustomRole: protectedProcedure
    .use(requireAdmin())
    .input(z.object({ name: z.string().min(2).max(64), description: z.string().max(255).optional() }))
    .mutation(async ({ ctx, input }) => {
      const correlationId = generateCorrelationId();
      const role = await createCustomRole(input.name, input.description ?? null);
      await logAuditEvent({ userId: ctx.user.id, action: 'create', resourceType: 'customRole', resourceId: role?.id ?? null, allowed: true, denialReason: null, correlationId, metadata: null });
      return role;
    }),

  deleteCustomRole: protectedProcedure
    .use(requireAdmin())
    .input(z.object({ customRoleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const correlationId = generateCorrelationId();
      await deleteCustomRole(input.customRoleId);
      await logAuditEvent({ userId: ctx.user.id, action: 'delete', resourceType: 'customRole', resourceId: input.customRoleId, allowed: true, denialReason: null, correlationId, metadata: null });
      return { success: true } as const;
    }),

  addCustomRolePermission: protectedProcedure
    .use(requireAdmin())
    .input(z.object({ customRoleId: z.number(), permission: z.string(), description: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const correlationId = generateCorrelationId();
      const perm = await addCustomRolePermission(input.customRoleId, input.permission, input.description);
      updateCustomRolePermission(input.customRoleId, input.permission, true);
      await logAuditEvent({ userId: ctx.user.id, action: 'create', resourceType: 'customRolePermission', resourceId: (perm as any)?.id ?? null, allowed: true, denialReason: null, correlationId, metadata: null });
      return perm;
    }),

  removeCustomRolePermission: protectedProcedure
    .use(requireAdmin())
    .input(z.object({ customRoleId: z.number(), permissionId: z.number(), permission: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const correlationId = generateCorrelationId();
      await removeCustomRolePermission(input.permissionId);
      updateCustomRolePermission(input.customRoleId, input.permission, false);
      await logAuditEvent({ userId: ctx.user.id, action: 'delete', resourceType: 'customRolePermission', resourceId: input.permissionId, allowed: true, denialReason: null, correlationId, metadata: null });
      return { success: true } as const;
    }),

  assignCustomRole: protectedProcedure
    .use(requireAdmin())
    .input(z.object({ userId: z.number(), customRoleId: z.number().nullable() }))
    .mutation(async ({ ctx, input }) => {
      const correlationId = generateCorrelationId();
      const user = await assignUserCustomRole(input.userId, input.customRoleId);
      await logAuditEvent({ userId: ctx.user.id, action: 'update', resourceType: 'user.customRole', resourceId: input.userId, allowed: true, denialReason: null, correlationId, metadata: null });
      return user;
    }),

  /**
   * Add a permission to a role (admin only)
   */
  addPermission: protectedProcedure
    .use(requireAdmin())
    .input(
      z.object({
        role: z.enum(["admin", "editor", "viewer"]),
        permission: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const correlationId = generateCorrelationId();

      try {
        await addRolePermission(input.role, input.permission, input.description);

        await logAuditEvent({
          userId: ctx.user.id,
          action: "create",
          resourceType: "permission",
          resourceId: null,
          allowed: true,
          denialReason: null,
          correlationId,
          metadata: null,
        });

        return { success: true };
      } catch (error) {
        await logAuditEvent({
          userId: ctx.user.id,
          action: "create",
          resourceType: "permission",
          resourceId: null,
          allowed: false,
          denialReason: `Failed to add permission: ${error instanceof Error ? error.message : "Unknown error"}`,
          correlationId,
          metadata: null,
        });
        throw error;
      }
    }),

  /**
   * Remove a permission from a role (admin only)
   */
  removePermission: protectedProcedure
    .use(requireAdmin())
    .input(
      z.object({
        permissionId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const correlationId = generateCorrelationId();

      try {
        await removeRolePermission(input.permissionId);

        await logAuditEvent({
          userId: ctx.user.id,
          action: "delete",
          resourceType: "permission",
          resourceId: input.permissionId,
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
          resourceType: "permission",
          resourceId: input.permissionId,
          allowed: false,
          denialReason: `Failed to remove permission: ${error instanceof Error ? error.message : "Unknown error"}`,
          correlationId,
          metadata: null,
        });
        throw error;
      }
    }),

  /**
   * Delete a user (admin only)
   */
  deleteUser: protectedProcedure
    .use(requireAdmin())
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const correlationId = generateCorrelationId();

      try {
        if (input.userId === ctx.user.id) {
          throw new Error("Cannot delete your own account");
        }

        await deleteUser(input.userId);

        await logAuditEvent({
          userId: ctx.user.id,
          action: "delete",
          resourceType: "user",
          resourceId: input.userId,
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
          resourceType: "user",
          resourceId: input.userId,
          allowed: false,
          denialReason: `Failed to delete user: ${error instanceof Error ? error.message : "Unknown error"}`,
          correlationId,
          metadata: null,
        });
        throw error;
      }
    }),

  /**
   * Register new user with password
   */
  registerUser: protectedProcedure
    .use(requireAdmin())
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(["admin", "editor", "viewer"]).default("viewer"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const correlationId = generateCorrelationId();
      try {
        const user = await registerUser(input);
        await logAuditEvent({
          userId: ctx.user.id,
          action: "create",
          resourceType: "user",
          resourceId: user?.id || null,
          allowed: true,
          denialReason: null,
          correlationId,
          metadata: null,
        });
        return user;
      } catch (error) {
        await logAuditEvent({
          userId: ctx.user.id,
          action: "create",
          resourceType: "user",
          resourceId: null,
          allowed: false,
          denialReason: `Failed to register user: ${error instanceof Error ? error.message : "Unknown error"}`,
          correlationId,
          metadata: null,
        });
        throw error;
      }
    }),

  /**
   * Request password reset
   */
  requestPasswordReset: protectedProcedure
    .use(requireAdmin())
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const token = await createPasswordResetToken(input.userId);
      const user = await getUserById(input.userId);
      if (user) {
        await createNotification({
          userId: input.userId,
          type: "password_reset",
          title: "Password Reset Requested",
          message: `A password reset was requested for your account. Token: ${token}`,
        });
      }
      return { token };
    }),

  /**
   * Reset password with token
   */
  resetPassword: protectedProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      const reset = await verifyPasswordResetToken(input.token);
      if (!reset) throw new Error("Invalid or expired token");
      
      await resetUserPassword(reset.userId, input.newPassword);
      await markPasswordResetUsed(input.token);
      
      return { success: true };
    }),

  /**
   * Get user sessions
   */
  userSessions: protectedProcedure
    .use(requireAdmin())
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return getUserSessions(input.userId);
    }),

  /**
   * Revoke session
   */
  revokeSession: protectedProcedure
    .use(requireAdmin())
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const correlationId = generateCorrelationId();
      await revokeSession(input.sessionId);
      await logAuditEvent({
        userId: ctx.user.id,
        action: "delete",
        resourceType: "session",
        resourceId: input.sessionId,
        allowed: true,
        denialReason: null,
        correlationId,
        metadata: null,
      });
      return { success: true };
    }),

  /**
   * Revoke all user sessions
   */
  revokeAllSessions: protectedProcedure
    .use(requireAdmin())
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const correlationId = generateCorrelationId();
      await revokeAllUserSessions(input.userId);
      await logAuditEvent({
        userId: ctx.user.id,
        action: "delete",
        resourceType: "sessions",
        resourceId: input.userId,
        allowed: true,
        denialReason: null,
        correlationId,
        metadata: null,
      });
      return { success: true };
    }),

  /**
   * Assign temporary role
   */
  assignTemporaryRole: protectedProcedure
    .use(requireAdmin())
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["admin", "editor", "viewer"]),
        durationHours: z.number().min(1).max(720),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const expiresAt = new Date(Date.now() + input.durationHours * 3600000);
      await assignTemporaryRole(input.userId, input.role, expiresAt, ctx.user.id, input.reason);
      
      const user = await getUserById(input.userId);
      if (user) {
        await createNotification({
          userId: input.userId,
          type: "role_assignment",
          title: "Temporary Role Assigned",
          message: `You have been temporarily assigned the ${input.role} role until ${expiresAt.toLocaleString()}`,
        });
      }
      
      return { success: true };
    }),

  /**
   * Get user temporary roles
   */
  temporaryRoles: protectedProcedure
    .use(requireAdmin())
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return getUserTemporaryRoles(input.userId);
    }),

  /**
   * Revoke temporary role
   */
  revokeTemporaryRole: protectedProcedure
    .use(requireAdmin())
    .input(z.object({ assignmentId: z.number() }))
    .mutation(async ({ input }) => {
      return revokeTemporaryRole(input.assignmentId);
    }),
});
