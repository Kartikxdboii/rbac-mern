/**
 * User router for user-specific features
 * Profile management, notifications, sessions
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUserSessions,
  revokeSession,
  resetUserPassword,
  getUserById,
  updateUserRole,
} from "../db";
import { hashPassword } from "../_core/localAuth";

export const userRouter = router({
  /**
   * Get current user profile
   */
  profile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  /**
   * Update user profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { upsertUser } = await import("../db");
      await upsertUser({
        openId: ctx.user.openId,
        name: input.name || ctx.user.name,
        email: input.email || ctx.user.email,
      });
      return getUserById(ctx.user.id);
    }),

  /**
   * Change password
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { getUserWithPassword } = await import("../db");
      const { verifyPassword } = await import("../_core/localAuth");
      
      const user = await getUserWithPassword(ctx.user.openId);
      if (!user || !user.passwordHash) {
        throw new Error("User not found or no password set");
      }

      const valid = await verifyPassword(input.currentPassword, user.passwordHash);
      if (!valid) {
        throw new Error("Current password is incorrect");
      }

      await resetUserPassword(ctx.user.id, input.newPassword);
      return { success: true };
    }),

  /**
   * Get user notifications
   */
  notifications: protectedProcedure
    .input(
      z.object({
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      return getUserNotifications(ctx.user.id, input.unreadOnly);
    }),

  /**
   * Mark notification as read
   */
  markNotificationRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input }) => {
      return markNotificationRead(input.notificationId);
    }),

  /**
   * Mark all notifications as read
   */
  markAllNotificationsRead: protectedProcedure.mutation(async ({ ctx }) => {
    return markAllNotificationsRead(ctx.user.id);
  }),

  /**
   * Get user's active sessions
   */
  sessions: protectedProcedure.query(async ({ ctx }) => {
    return getUserSessions(ctx.user.id);
  }),

  /**
   * Revoke a session
   */
  revokeSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input }) => {
      return revokeSession(input.sessionId);
    }),
});
