import { TRPCError } from "@trpc/server";
import { User } from "../drizzle/schema";
import { getRolePermissions } from "./db";
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    "posts:create",
    "posts:read",
    "posts:update",
    "posts:delete",
    "users:read",
    "users:create",
    "users:update",
    "users:delete",
    "users:manage",
    "roles:manage",
    "permissions:manage",
    "audit:read",
  ],
  editor: [
    "posts:create",
    "posts:read",
    "posts:update_own",
    "posts:delete_own",
  ],
  viewer: [
    "posts:read",
  ],
};
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
  if (user.role === "admin") return true;
  const base = ROLE_PERMISSIONS[user.role] || [];
  const custom = getCustomRolePermissions((user as any).customRoleId);
  return base.includes(permission) || custom.has(permission);
}
export function can(
  user: User | null,
  permission: string,
  ownershipCheck?: () => boolean
): boolean {
  if (!user) return false;
  if (!hasPermission(user, permission)) {
    return false;
  }
  if (ownershipCheck && !ownershipCheck()) {
    return false;
  }
  return true;
}
export function isOwner(user: User | null, ownerId: number): boolean {
  if (!user) return false;
  return user.id === ownerId || user.role === "admin";
}
export function isAdmin(user: User | null): boolean {
  return user?.role === "admin";
}
export function isEditorOrAdmin(user: User | null): boolean {
  return user?.role === "admin" || user?.role === "editor";
}
export function throwPermissionDenied(message: string = "Permission denied") {
  throw new TRPCError({
    code: "FORBIDDEN",
    message,
  });
}
export function throwUnauthorized(message: string = "Unauthorized") {
  throw new TRPCError({
    code: "UNAUTHORIZED",
    message,
  });
}
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
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
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

