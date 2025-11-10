/**
 * Admin dashboard for user and role management
 * Restricted to admin users only
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Loader2, Users, BarChart3, AlertCircle, Trash2, Eye, PlusCircle, Settings, Check } from "lucide-react";
import { NavBar } from "@/components/NavBar";

export default function Admin() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  );
}

function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("users");
  const statsQuery = trpc.admin.stats.useQuery(undefined, { staleTime: 30_000 });

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-sm p-8 border mb-8">
            <h1 className="text-3xl font-bold">Welcome, <span className="text-indigo-600">Admin 👋</span></h1>
            <p className="text-gray-500 mt-2">You have full access to system management.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Your Role</CardTitle>
                <CardDescription>Administrative capabilities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">ADMIN</span>
                <ul className="mt-2 space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2"><Check className="text-green-500 w-4 h-4"/> Manage users & roles</li>
                  <li className="flex items-center gap-2"><Check className="text-green-500 w-4 h-4"/> Full post control</li>
                  <li className="flex items-center gap-2"><Check className="text-green-500 w-4 h-4"/> View audit logs</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3">
                  <button className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition" onClick={() => setSelectedTab('users')}>
                    <Users className="text-indigo-600"/> Manage Users
                  </button>
                  <button className="flex items-center gap-2 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition" onClick={() => setSelectedTab('permissions')}>
                    <Settings className="text-green-600"/> Permissions
                  </button>
                  <button className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition" onClick={() => setSelectedTab('stats')}>
                    <BarChart3 className="text-yellow-600"/> System Stats
                  </button>
                  <button className="flex items-center gap-2 p-3 bg-red-50 rounded-lg hover:bg-red-100 transition" onClick={() => setSelectedTab('audit')}>
                    <Eye className="text-red-600"/> Audit Logs
                  </button>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>System Stats</CardTitle>
                <CardDescription>At a glance</CardDescription>
              </CardHeader>
              <CardContent>
                {statsQuery.isLoading ? (
                  <div className="flex items-center justify-center h-24"><Loader2 className="h-5 w-5 animate-spin"/></div>
                ) : statsQuery.data ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-gray-500">Users</p>
                      <p className="text-xl font-semibold">{statsQuery.data.totalUsers}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-500">Admins</p>
                      <p className="text-xl font-semibold">{statsQuery.data.roleStats.admin}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-500">Editors</p>
                      <p className="text-xl font-semibold">{statsQuery.data.roleStats.editor}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-500">Viewers</p>
                      <p className="text-xl font-semibold">{statsQuery.data.roleStats.viewer}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
              <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            </TabsList>
            <TabsContent value="users" className="space-y-4"><UsersTab /></TabsContent>
            <TabsContent value="permissions" className="space-y-4"><PermissionsTab /></TabsContent>
            <TabsContent value="stats" className="space-y-4"><StatsTab /></TabsContent>
            <TabsContent value="audit" className="space-y-4"><AuditLogsTab /></TabsContent>
          </Tabs>

          <section className="bg-gray-50 p-6 rounded-2xl mt-12 border">
            <h2 className="text-lg font-semibold mb-3">About Roles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-xl shadow-sm border">
                <Users className="text-indigo-600 mb-2"/>
                <h3 className="font-semibold">Admin</h3>
                <p className="text-xs text-gray-500">Full control and visibility.</p>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm border">
                <Settings className="text-green-600 mb-2"/>
                <h3 className="font-semibold">Editor</h3>
                <p className="text-xs text-gray-500">Manages own content.</p>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm border">
                <Eye className="text-blue-600 mb-2"/>
                <h3 className="font-semibold">Viewer</h3>
                <p className="text-xs text-gray-500">Read-only access.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
function UsersTab() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: usersData, isLoading, refetch } = trpc.admin.users.useQuery({
    limit: 100,
    offset: 0,
  });
  const { user: currentUser } = useAuth();

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const createUserMutation = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      refetch();
      setIsCreateOpen(false);
    },
  });

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleRoleChange = (userId: number, newRole: "admin" | "editor" | "viewer") => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const handleCreateUser = (formData: any) => {
    createUserMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Users Management</CardTitle>
            <CardDescription>
              Manage user roles and access levels
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>Create User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user and assign a role
                </DialogDescription>
              </DialogHeader>
              <CreateUserForm
                onSubmit={handleCreateUser}
                isLoading={createUserMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium">Name</th>
                <th className="text-left py-3 px-4 font-medium">Email</th>
                <th className="text-left py-3 px-4 font-medium">Role</th>
                <th className="text-left py-3 px-4 font-medium">Created</th>
                <th className="text-left py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersData?.users.map((user: any) => (
                <tr key={user.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">{user.name || "N/A"}</td>
                  <td className="py-3 px-4">{user.email || "N/A"}</td>
                  <td className="py-3 px-4">
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <RoleSelector
                        userId={user.id}
                        currentRole={user.role}
                        onRoleChange={handleRoleChange}
                        isLoading={updateRoleMutation.isPending}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteUserMutation.mutate({ userId: user.id })}
                        disabled={deleteUserMutation.isPending || user.id === currentUser?.id}
                        className="text-destructive hover:text-destructive"
                        title={user.id === currentUser?.id ? "Cannot delete your own account" : "Delete user"}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function RoleSelector({
  userId,
  currentRole,
  onRoleChange,
  isLoading,
}: {
  userId: number;
  currentRole: string;
  onRoleChange: (userId: number, role: "admin" | "editor" | "viewer") => void;
  isLoading: boolean;
}) {
  return (
    <Select
      value={currentRole}
      onValueChange={(value) =>
        onRoleChange(userId, value as "admin" | "editor" | "viewer")
      }
      disabled={isLoading}
    >
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="editor">Editor</SelectItem>
        <SelectItem value="viewer">Viewer</SelectItem>
      </SelectContent>
    </Select>
  );
}

function AddPermissionForm({
  role,
  availablePermissions,
  currentPermissions,
  onSubmit,
  isLoading,
}: {
  role: "admin" | "editor" | "viewer";
  availablePermissions: any[];
  currentPermissions: string[];
  onSubmit: (permission: string, description?: string) => void;
  isLoading: boolean;
}) {
  const [selectedPermission, setSelectedPermission] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedPermission) {
      const perm = availablePermissions.find((p) => p.id === selectedPermission);
      onSubmit(selectedPermission, perm?.label);
      setSelectedPermission("");
    }
  };

  const unusedPermissions = availablePermissions.filter(
    (p) => !currentPermissions.includes(p.id)
  );

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-3 border rounded-lg bg-muted/30 space-y-3">
      <div>
        <label className="text-sm font-medium">Select Permission</label>
        <Select value={selectedPermission} onValueChange={setSelectedPermission}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a permission" />
          </SelectTrigger>
          <SelectContent>
            {unusedPermissions.map((perm) => (
              <SelectItem key={perm.id} value={perm.id}>
                {perm.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isLoading || !selectedPermission} className="w-full">
        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Add Permission
      </Button>
    </form>
  );
}

function PermissionsTab() {
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const { data: permissions, isLoading, refetch } = trpc.admin.rolePermissions.useQuery();
  const { data: availablePermissions } = trpc.admin.availablePermissions.useQuery();

  const removePermissionMutation = trpc.admin.removePermission.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const addPermissionMutation = trpc.admin.addPermission.useMutation({
    onSuccess: () => {
      refetch();
      setEditingRole(null);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const groupedPermissions = {
    admin: permissions?.filter((p: any) => p.role === "admin") || [],
    editor: permissions?.filter((p: any) => p.role === "editor") || [],
    viewer: permissions?.filter((p: any) => p.role === "viewer") || [],
  };

  return (
    <div className="space-y-4">
      {Object.entries(groupedPermissions).map(([role, perms]: [string, any]) => (
        <Card key={role}>
          <CardHeader>
            <CardTitle className="capitalize text-lg">{role} Permissions</CardTitle>
            <CardDescription>
              {perms.length} permission{perms.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {perms.length > 0 ? (
              <div className="space-y-3">
                {perms.map((perm: any) => (
                  <div key={perm.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground break-words">
                        {perm.permission}
                      </p>
                      {perm.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {perm.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePermissionMutation.mutate({ permissionId: perm.id })}
                      disabled={removePermissionMutation.isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No permissions assigned to this role
              </p>
            )}
            {editingRole === role && (
              <AddPermissionForm
                role={role as "admin" | "editor" | "viewer"}
                availablePermissions={availablePermissions || []}
                currentPermissions={perms.map((p: any) => p.permission)}
                onSubmit={(permission, description) => {
                  addPermissionMutation.mutate({
                    role: role as "admin" | "editor" | "viewer",
                    permission,
                    description,
                  });
                }}
                isLoading={addPermissionMutation.isPending}
              />
            )}
          </CardContent>
          <div className="px-6 py-3 border-t">
            {editingRole === role ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingRole(null)}
              >
                Cancel
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingRole(role)}
              >
                Add Permission
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function StatsTab() {
  const { data: stats, isLoading } = trpc.admin.stats.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalUsers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.roleStats.admin}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Editors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.roleStats.editor}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Viewers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.roleStats.viewer}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Authorization Denials</CardTitle>
          <CardDescription>
            Number of permission denials by action type
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.recentDenials.total === 0 ? (
            <p className="text-muted-foreground">No authorization denials recorded</p>
          ) : (
            <div className="space-y-2">
              <p className="font-medium">
                Total Denials: <span className="text-destructive">{stats?.recentDenials.total}</span>
              </p>
              <div className="space-y-1 text-sm">
                {Object.entries(stats?.recentDenials.byAction || {}).map(([action, count]: [string, any]) => (
                  <div key={action} className="flex justify-between">
                    <span className="text-muted-foreground">{action}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AuditLogsTab() {
  const { data: logs, isLoading } = trpc.admin.auditLogs.useQuery({
    limit: 50,
    offset: 0,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>
          Track all authorization events and system actions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {logs && logs.length > 0 ? (
            logs.map((log: any) => (
              <div
                key={log.id}
                className={`p-3 rounded border ${
                  log.allowed
                    ? "border-green-200 bg-green-50 dark:bg-green-950"
                    : "border-red-200 bg-red-50 dark:bg-red-950"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {log.action} {log.resourceType}
                      </span>
                      <Badge variant={log.allowed ? "default" : "destructive"}>
                        {log.allowed ? "Allowed" : "Denied"}
                      </Badge>
                    </div>
                    {log.denialReason && (
                      <p className="text-xs text-muted-foreground mb-1">
                        {log.denialReason}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      User ID: {log.userId} • {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">No audit logs found</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateUserForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "viewer",
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Name</label>
        <Input
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
          placeholder="User full name"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Email</label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
          placeholder="user@example.com"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Role</label>
        <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Create User
      </Button>
    </form>
  );
}
