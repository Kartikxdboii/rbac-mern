import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Check, Eye, PlusCircle, Settings, Shield, Users, FileSearch } from "lucide-react";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Link } from "wouter";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/_core/hooks/useAuth";
export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <AdminDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
function StatBlock({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="flex flex-col items-start">
      <div className="text-4xl font-bold tracking-tight">{value ?? 0}</div>
      <div className="text-xs uppercase text-gray-500 mt-1 font-medium">{label}</div>
    </div>
  );
}
function AdminDashboard() {
  const { user } = useAuth();
  const statsQuery = trpc.admin.stats.useQuery();
  const recentLogsQuery = trpc.admin.auditLogs.useQuery({ limit: 10, offset: 0 });
  const { hasPermission, role, isAdmin } = usePermissions();
  return (
  <div className="space-y-8 max-w-full overflow-x-hidden">
    <div className="bg-white rounded-2xl shadow p-8">
        <h1 className="text-3xl font-semibold">Welcome, <span className="text-indigo-600">{user?.name || 'Admin'} 👋</span></h1>
        <p className="text-gray-500 mt-2">High-level overview of system activity and access.</p>
      </div>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full overflow-hidden">
    <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">Your Role</h2>
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">{role?.toUpperCase()}</span>
          <ul className="mt-4 space-y-2 text-sm text-gray-700">
            {role === 'admin' && (
              <>
                <li className="flex items-center gap-2"><Check className="text-green-500 w-4 h-4"/> Manage users & roles</li>
                <li className="flex items-center gap-2"><Check className="text-green-500 w-4 h-4"/> Full post control</li>
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
              <li className="flex items-center gap-2"><Check className="text-green-500 w-4 h-4"/> Read published public posts</li>
            )}
          </ul>
        </div>
  <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/posts" className="block">
              <button className="w-full flex items-center justify-between p-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition shadow">
                <span className="flex items-center gap-2"><Eye className="w-4 h-4"/> View Posts</span> <span>&gt;</span>
              </button>
            </Link>
            {hasPermission('posts:create') && (
              <Link href="/posts" className="block">
                <button className="w-full flex items-center justify-between p-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition shadow">
                  <span className="flex items-center gap-2"><PlusCircle className="w-4 h-4"/> Create Post</span> <span>&gt;</span>
                </button>
              </Link>
            )}
            {isAdmin() && (
              <>
                <Link href="/admin/register" className="block">
                  <button className="w-full flex items-center justify-between p-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition shadow">
                    <span className="flex items-center gap-2"><Users className="w-4 h-4"/> Register User</span> <span>&gt;</span>
                  </button>
                </Link>
                <Link href="/admin/users" className="block">
                  <button className="w-full flex items-center justify-between p-3 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition shadow">
                    <span className="flex items-center gap-2"><Settings className="w-4 h-4"/> Manage Users</span> <span>&gt;</span>
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
  <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">System Stats</h2>
          <div className="grid grid-cols-2 gap-6">
            <StatBlock label="Users" value={statsQuery.data?.totalUsers} />
            <StatBlock label="Admins" value={statsQuery.data?.roleStats.admin} />
            <StatBlock label="Editors" value={statsQuery.data?.roleStats.editor} />
            <StatBlock label="Viewers" value={statsQuery.data?.roleStats.viewer} />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {recentLogsQuery.isLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : recentLogsQuery.data && recentLogsQuery.data.length > 0 ? (
          <div className="space-y-3">
            {recentLogsQuery.data.slice(0, 10).map((log: any) => (
              <div key={log.id} className="flex items-start justify-between bg-white/70 backdrop-blur rounded-lg p-3 shadow-sm border">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{log.action} {log.resourceType}</span>
                  <span className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${log.allowed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{log.allowed ? 'Allowed' : 'Denied'}</span>
              </div>
            ))}
            <Link href="/admin/audit" className="inline-block mt-2 text-indigo-600 text-sm hover:underline">View All →</Link>
          </div>
        ) : (
          <Empty className="border border-dashed py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileSearch className="h-6 w-6 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>No Recent Activity</EmptyTitle>
              <EmptyDescription>
                System events will show up here as they occur. Try performing an action to generate activity.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="p-4 bg-white rounded-xl shadow-sm border">
          <Shield className="text-indigo-600 mb-2" />
          <h3 className="font-semibold">Admin</h3>
          <p className="text-xs text-gray-500">Full access to all features.</p>
        </div>
        <div className="p-4 bg-white rounded-xl shadow-sm border">
          <Settings className="text-green-600 mb-2" />
          <h3 className="font-semibold">Editor</h3>
          <p className="text-xs text-gray-500">Create & edit own content.</p>
        </div>
        <div className="p-4 bg-white rounded-xl shadow-sm border">
          <Eye className="text-blue-600 mb-2" />
          <h3 className="font-semibold">Viewer</h3>
          <p className="text-xs text-gray-500">Read-only visibility.</p>
        </div>
      </section>
    </div>
  );
}

