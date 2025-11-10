/**
 * Home page with RBAC information and navigation
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";
import { LogOut, Shield, Users, FileText, BarChart3, Eye, PlusCircle, Settings, Check } from "lucide-react";
import { NavBar } from "@/components/NavBar";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { hasPermission, isAdmin, isEditor, isViewer, role } = usePermissions();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1">
          <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="bg-white rounded-2xl shadow-sm p-8 border">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold">Fine-Grained RBAC Application</h1>
                  <p className="text-gray-500 mt-2">A modern, secure RBAC demo with Admin, Editor, and Viewer roles.</p>
                </div>
                <Button size="lg" onClick={() => (window.location.href = getLoginUrl())} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow">
                  Sign In
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <Card className="hover:shadow-lg transition-shadow rounded-2xl">
                <CardHeader>
                  <Shield className="w-8 h-8 mb-2 text-indigo-600" />
                  <CardTitle>Role-Based Access</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Three distinct roles with granular permission controls
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow rounded-2xl">
                <CardHeader>
                  <FileText className="w-8 h-8 mb-2 text-indigo-600" />
                  <CardTitle>Content Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Create, edit, and delete posts with ownership checks
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow rounded-2xl">
                <CardHeader>
                  <BarChart3 className="w-8 h-8 mb-2 text-indigo-600" />
                  <CardTitle>Audit Logging</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Full audit trail of actions and permission decisions
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-sm p-8 border">
            <h1 className="text-3xl font-bold">Welcome back, <span className="text-indigo-600">{user.name} 👋</span></h1>
            <p className="text-gray-500 mt-2">You are logged in as</p>
            <div className="mt-3">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">{role?.toUpperCase()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Your Role</CardTitle>
                <CardDescription>Current access level and permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-gray-500">Role</span>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">{role?.toUpperCase()}</span>
                  <ul className="mt-3 space-y-2 text-gray-700">
                    {role === 'admin' && (
                      <>
                        <li className="flex items-center gap-2"><Check className="text-green-500 w-4 h-4"/> Manage users and roles</li>
                        <li className="flex items-center gap-2"><Check className="text-green-500 w-4 h-4"/> Create and edit any post</li>
                        <li className="flex items-center gap-2"><Check className="text-green-500 w-4 h-4"/> View audit logs</li>
                      </>
                    )}
                    {role === 'editor' && (
                      <>
                        <li className="flex items-center gap-2"><Check className="text-green-500 w-4 h-4"/> Create posts</li>
                        <li className="flex items-center gap-2"><Check className="text-green-500 w-4 h-4"/> Edit own posts</li>
                        <li className="flex items-center gap-2"><Check className="text-green-500 w-4 h-4"/> Read published posts</li>
                      </>
                    )}
                    {role === 'viewer' && (
                      <>
                        <li className="flex items-center gap-2"><Check className="text-green-500 w-4 h-4"/> Read published public posts</li>
                      </>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Shortcuts to key features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/posts" className="block">
                  <button className="w-full flex items-center gap-2 p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition">
                    <Eye className="text-indigo-600"/> View Posts
                  </button>
                </Link>
                {hasPermission('posts:create') && (
                  <Link href="/posts" className="block">
                    <button className="w-full flex items-center gap-2 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition">
                      <PlusCircle className="text-green-600"/> Create Post
                    </button>
                  </Link>
                )}
                {isAdmin() && (
                  <Link href="/admin" className="block">
                    <button className="w-full flex items-center gap-2 p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition">
                      <Settings className="text-yellow-600"/> Admin Dashboard
                    </button>
                  </Link>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>System Stats</CardTitle>
                <CardDescription>Overview at a glance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Coming soon…</p>
              </CardContent>
            </Card>
          </div>

          <section className="bg-gray-50 p-6 rounded-2xl mt-10 border">
            <h2 className="text-lg font-semibold mb-3">About This Application</h2>
            <p className="text-gray-600 mb-4">
              This demo shows fine-grained Role-Based Access Control in a MERN app.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 bg-white rounded-xl shadow-sm border">
                <Shield className="text-indigo-500 mb-2"/>
                <h3 className="font-semibold">Admin</h3>
                <p className="text-sm text-gray-500">Full access to all features.</p>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm border">
                <Users className="text-green-500 mb-2"/>
                <h3 className="font-semibold">Editor</h3>
                <p className="text-sm text-gray-500">Can create and manage content.</p>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm border">
                <Eye className="text-blue-500 mb-2"/>
                <h3 className="font-semibold">Viewer</h3>
                <p className="text-sm text-gray-500">Read-only access.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
