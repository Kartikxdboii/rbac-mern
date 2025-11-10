import DashboardLayout from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export default function AdminUsersPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="page-wrap px-2 md:px-4 w-full max-w-[1400px] mx-auto overflow-x-hidden">
          <UsersTab />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function UsersTab() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: usersData, isLoading, refetch } = trpc.admin.users.useQuery({
    limit: 100,
    offset: 0,
  });
  const { data: customRoles } = trpc.admin.customRoles.useQuery();

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

  const assignCustomRoleMutation = trpc.admin.assignCustomRole.useMutation({
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
  <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold">Manage Users</h1>
        <p className="text-gray-500 mt-1">Create users and assign roles. You can also assign a custom role for fine-grained permissions.</p>
      </div>
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage user roles and access levels</CardDescription>
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
                <CreateUserForm onSubmit={handleCreateUser} isLoading={createUserMutation.isPending} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border bg-white">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Role</th>
                  <th className="text-left py-3 px-4 font-medium">Custom Role</th>
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
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Select
                        value={user.customRoleId == null ? "none" : String(user.customRoleId)}
                        onValueChange={(value) => assignCustomRoleMutation.mutate({ userId: user.id, customRoleId: value === "none" ? null : Number(value) })}
                        disabled={assignCustomRoleMutation.isPending}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select custom role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {customRoles?.map((r: any) => (
                            <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <RoleSelector userId={user.id} currentRole={user.role} onRoleChange={handleRoleChange} isLoading={updateRoleMutation.isPending} />
                        <Button variant="ghost" size="sm" onClick={() => deleteUserMutation.mutate({ userId: user.id })} className="text-destructive hover:text-destructive">Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RoleSelector({ userId, currentRole, onRoleChange, isLoading }: { userId: number; currentRole: string; onRoleChange: (userId: number, role: "admin" | "editor" | "viewer") => void; isLoading: boolean; }) {
  return (
    <Select value={currentRole} onValueChange={(value) => onRoleChange(userId, value as "admin" | "editor" | "viewer")} disabled={isLoading}>
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

function CreateUserForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({ name: "", email: "", role: "viewer" });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Name</label>
        <Input value={formData.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })} placeholder="User full name" required />
      </div>
      <div>
        <label className="text-sm font-medium">Email</label>
        <Input type="email" value={formData.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })} placeholder="user@example.com" required />
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
