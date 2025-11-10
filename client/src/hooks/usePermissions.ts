/**
 * usePermissions hook for checking user permissions on the frontend
 * Provides permission checking utilities for conditional rendering and UI control
 */

import { useAuth } from "@/_core/hooks/useAuth";

export type UserRole = "admin" | "editor" | "viewer";

export interface PermissionCheckResult {
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  isEditor: () => boolean;
  isViewer: () => boolean;
  isEditorOrAdmin: () => boolean;
  role: UserRole | null;
}

/**
 * Permission matrix matching the backend
 */
const ROLE_PERMISSIONS: Record<string, string[]> = {
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

/**
 * Hook to check user permissions
 * Usage:
 *   const { hasPermission, isAdmin } = usePermissions();
 *   if (hasPermission("posts:create")) { ... }
 */
export function usePermissions(): PermissionCheckResult {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(permission);
  };

  const isAdmin = (): boolean => {
    return user?.role === "admin";
  };

  const isEditor = (): boolean => {
    return user?.role === "editor";
  };

  const isViewer = (): boolean => {
    return user?.role === "viewer";
  };

  const isEditorOrAdmin = (): boolean => {
    return user?.role === "admin" || user?.role === "editor";
  };

  return {
    hasPermission,
    isAdmin,
    isEditor,
    isViewer,
    isEditorOrAdmin,
    role: (user?.role as UserRole) || null,
  };
}
