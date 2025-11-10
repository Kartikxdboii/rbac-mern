/**
 * RBAC (Role-Based Access Control) utilities
 * Provides permission checking, role-based procedure wrappers, and authorization helpers
 */

import { TRPCError } from "@trpc/server";
import { User } from "../drizzle/schema";
import { getRolePermissions } from "./db";

/**
 * Permission matrix defining capabilities for each role
 * Format: resource:action (e.g., posts:create, users:manage)
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    // Post management
    "posts:create",
    "posts:read",
    "posts:update",
    "posts:delete",
    // User management
    "users:read",
    "users:create",
    "users:update",
    "users:delete",
    "users:manage",
    // Role management
    "roles:manage",
    "permissions:manage",
    // Audit
    "audit:read",
  ],
  editor: [
    // Post management (own posts only, enforced at query level)
    "posts:create",
    "posts:read",
    "posts:update_own",
    "posts:delete_own",
  ],
  viewer: [
    // Read-only access to published public posts
    "posts:read",
  ],
};

/**
 * Check if a user has a specific permission
 * @param user The authenticated user
 * @param permission The permission to check (e.g., "posts:create")
 * @returns true if user has the permission, false otherwise
 */
// In-memory cache for custom role permissions (roleId -> Set of permissions)
const customRolePermsCache: Map<number, Set<string>> = new Map();

export function primeCustomRolePermissions(roleId: number, perms: string[]) {
  customRolePermsCache.set(roleId, new Set(perms));
}

export function updateCustomRolePermission(roleId: number, permission: string, add: boolean) {
  const set = customRolePermsCache.get(roleId) ?? new Set<string>();
  if (add) set.add(permission); else set.delete(permission);
  customRolePermsCache.set(roleId, set);
}

export function getCustomRolePermissions(roleId: number | null | undefined): Set<string> {
  if (!roleId) return new Set();
  return customRolePermsCache.get(roleId) ?? new Set();
}

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  // Admins are superusers
  if (user.role === "admin") return true;
  const base = ROLE_PERMISSIONS[user.role] || [];
  const custom = getCustomRolePermissions((user as any).customRoleId);
  return base.includes(permission) || custom.has(permission);
}

/**
 * Check if a user can perform an action on a resource
 * Supports ownership checks for row-level access control
 * @param user The authenticated user
 * @param permission The permission to check
 * @param ownershipCheck Optional callback to verify ownership
 * @returns true if user has permission and passes ownership check
 */
export function can(
  user: User | null,
  permission: string,
  ownershipCheck?: () => boolean
): boolean {
  if (!user) return false;

  // Check basic permission
  if (!hasPermission(user, permission)) {
    return false;
  }

  // If ownership check is provided, verify it
  if (ownershipCheck && !ownershipCheck()) {
    return false;
  }

  return true;
}

/**
 * Verify user ownership of a resource
 * @param user The authenticated user
 * @param ownerId The ID of the resource owner
 * @returns true if user is the owner or is an admin
 */
export function isOwner(user: User | null, ownerId: number): boolean {
  if (!user) return false;
  return user.id === ownerId || user.role === "admin";
}

/**
 * Check if user is an admin
 */
export function isAdmin(user: User | null): boolean {
  return user?.role === "admin";
}

/**
 * Check if user is an editor or admin
 */
export function isEditorOrAdmin(user: User | null): boolean {
  return user?.role === "admin" || user?.role === "editor";
}

/**
 * Throw a TRPC error for permission denied
 */
export function throwPermissionDenied(message: string = "Permission denied") {
  throw new TRPCError({
    code: "FORBIDDEN",
    message,
  });
}

/**
 * Throw a TRPC error for unauthenticated access
 */
export function throwUnauthorized(message: string = "Unauthorized") {
  throw new TRPCError({
    code: "UNAUTHORIZED",
    message,
  });
}

/**
 * Middleware to check if user has a specific permission
 * Usage: protectedProcedure.use(requirePermission("posts:create"))
 */
export function requirePermission(permission: string) {
  return ({ ctx, next }: any) => {
    if (!ctx.user) {
      throwUnauthorized();
    }

    if (!hasPermission(ctx.user, permission)) {
      throwPermissionDenied(`Missing permission: ${permission}`);
    }

    return next({ ctx });
  };
}

/**
 * Middleware to require admin role
 * Usage: protectedProcedure.use(requireAdmin())
 */
export function requireAdmin() {
  return ({ ctx, next }: any) => {
    if (!ctx.user) {
      throwUnauthorized();
    }

    if (!isAdmin(ctx.user)) {
      throwPermissionDenied("Admin access required");
    }

    return next({ ctx });
  };
}

/**
 * Middleware to require editor or admin role
 * Usage: protectedProcedure.use(requireEditorOrAdmin())
 */
export function requireEditorOrAdmin() {
  return ({ ctx, next }: any) => {
    if (!ctx.user) {
      throwUnauthorized();
    }

    if (!isEditorOrAdmin(ctx.user)) {
      throwPermissionDenied("Editor or Admin access required");
    }

    return next({ ctx });
  };
}

/**
 * Generate correlation ID for audit logging
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log authorization event for audit trail
 */
export async function logAuthorizationEvent(
  userId: number,
  action: string,
  resourceType: string,
  resourceId: number | null,
  allowed: boolean,
  denialReason?: string,
  correlationId?: string
) {
  try {
    const { logAuditEvent } = await import("./db");
    await logAuditEvent({
      userId,
      action,
      resourceType,
      resourceId,
      allowed,
      denialReason: denialReason || null,
      correlationId: correlationId || null,
      metadata: null,
    });
  } catch (error) {
    console.error("[Audit] Failed to log authorization event:", error);
  }
}
