/**
 * ProtectedRoute component for guarding routes based on user role
 * Redirects to login or 403 page if user lacks required access
 */

import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "editor" | "viewer" | ("admin" | "editor" | "viewer")[];
  requiredPermission?: string;
  fallback?: React.ReactNode;
}

/**
 * Component that guards routes based on user authentication and role
 * Usage:
 *   <ProtectedRoute requiredRole="admin">
 *     <AdminDashboard />
 *   </ProtectedRoute>
 *
 *   <ProtectedRoute requiredPermission="posts:create">
 *     <CreatePost />
 *   </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallback,
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const { hasPermission, role } = usePermissions();
  const [, navigate] = useLocation();

  // Still loading auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    // Redirect to login (client-side) to avoid full reload loop
    const loginUrl = getLoginUrl();
    if (loginUrl.startsWith("/")) {
      navigate(loginUrl);
    } else {
      // external OAuth portal
      window.location.href = loginUrl;
    }
    return null;
  }

  // Check role requirement
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role as any)) {
      return (
        fallback || (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-destructive mb-4">403</h1>
              <p className="text-lg text-muted-foreground mb-6">
                Access Denied
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                You don't have permission to access this page. Your role is:{" "}
                <span className="font-semibold">{user.role}</span>
              </p>
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Go Home
              </button>
            </div>
          </div>
        )
      );
    }
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-destructive mb-4">403</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Access Denied
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              You don't have the required permission: {requiredPermission}
            </p>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Go Home
            </button>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
