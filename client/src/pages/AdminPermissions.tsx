import DashboardLayout from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AdminPermissionsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="page-wrap px-2 md:px-4 w-full max-w-[1400px] mx-auto overflow-x-hidden">
          <PermissionsTab />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function AddPermissionForm({ role, availablePermissions, currentPermissions, onSubmit, isLoading }: { role: "admin" | "editor" | "viewer"; availablePermissions: any[]; currentPermissions: string[]; onSubmit: (permission: string, description?: string) => void; isLoading: boolean; }) {
  const [selectedPermission, setSelectedPermission] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedPermission) {
      const perm = availablePermissions.find((p) => p.id === selectedPermission);
      onSubmit(selectedPermission, perm?.label);
      setSelectedPermission("");
    }
  };

  const unusedPermissions = availablePermissions.filter((p) => !currentPermissions.includes(p.id));

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
              <SelectItem key={perm.id} value={perm.id}>{perm.label}</SelectItem>
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
  const customRolesQuery = trpc.admin.customRoles.useQuery();
  const createCustomRoleMutation = trpc.admin.createCustomRole.useMutation({ onSuccess: () => customRolesQuery.refetch() });
  const deleteCustomRoleMutation = trpc.admin.deleteCustomRole.useMutation({ onSuccess: () => customRolesQuery.refetch() });
  // Hooks must be called before any conditional returns
  const [newRole, setNewRole] = useState({ name: "", description: "" });

  const removePermissionMutation = trpc.admin.removePermission.useMutation({ onSuccess: () => refetch() });
  const addPermissionMutation = trpc.admin.addPermission.useMutation({ onSuccess: () => { refetch(); setEditingRole(null); } });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const grouped = {
    editor: permissions?.filter((p: any) => p.role === "editor") || [],
    viewer: permissions?.filter((p: any) => p.role === "viewer") || [],
  };

  const handleCreateCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.name.trim()) return;
    createCustomRoleMutation.mutate({ name: newRole.name.trim(), description: newRole.description || undefined });
    setNewRole({ name: "", description: "" });
  };

  return (
  <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Permissions</h1>
          <p className="text-gray-500 text-sm mt-1">Manage capabilities per role. Compact view reduces scrolling.</p>
        </div>
      </div>

  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-min w-full overflow-hidden">
        {Object.entries(grouped).map(([role, perms]: [string, any]) => (
          <Card key={role} className="rounded-xl shadow-sm flex flex-col h-full">
            <CardHeader className="pb-3">
              <CardTitle className="capitalize text-sm flex items-center justify-between gap-2">
                <span className="truncate">{role} Permissions</span>
                <Badge variant="secondary" className="shrink-0 text-[10px] px-2 py-0.5">{perms.length}</Badge>
              </CardTitle>
              <CardDescription className="text-xs">Role scope</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-4 pt-0 overflow-y-auto custom-scrollbar space-y-2 max-h-72">
              {perms.length > 0 ? (
                perms.map((perm: any) => (
                  <div key={perm.id} className="flex items-start gap-2 p-2 rounded-md border bg-card/60 hover:bg-muted/50 transition text-xs">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium break-all leading-snug">{perm.permission}</p>
                      {perm.description && <p className="text-muted-foreground mt-0.5 leading-snug">{perm.description}</p>}
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-destructive" onClick={() => removePermissionMutation.mutate({ permissionId: perm.id })} disabled={removePermissionMutation.isPending}>×</Button>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4 text-xs">This role currently has no specific permissions.</p>
              )}
            </CardContent>
            <div className="px-4 pb-4 pt-2 mt-auto">
              {editingRole === role ? (
                <div className="space-y-2">
                  <AddPermissionForm role={role as any} availablePermissions={availablePermissions || []} currentPermissions={perms.map((p: any) => p.permission)} onSubmit={(permission, description) => { addPermissionMutation.mutate({ role: role as any, permission, description }); }} isLoading={addPermissionMutation.isPending} />
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setEditingRole(null)}>Cancel</Button>
                </div>
              ) : (
                <Button variant="default" size="sm" className="w-full" onClick={() => setEditingRole(role)}>Add Permission</Button>
              )}
            </div>
          </Card>
        ))}
        <Card className="rounded-xl shadow-sm flex flex-col h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between gap-2">
              <span className="truncate">Create Custom Role</span>
            </CardTitle>
            <CardDescription className="text-xs">Define a new bespoke role</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <form onSubmit={handleCreateCustomRole} className="space-y-3">
              <div>
                <label className="text-xs font-medium">Name</label>
                <Input value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} placeholder="e.g. auditor" />
              </div>
              <div>
                <label className="text-xs font-medium">Description (optional)</label>
                <Input value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} placeholder="Short summary" />
              </div>
              <Button type="submit" className="w-full" disabled={createCustomRoleMutation.isPending || !newRole.name.trim()}>
                {createCustomRoleMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Create Role
              </Button>
            </form>
          </CardContent>
        </Card>
        {customRolesQuery.data?.map((role: any) => (
          <CustomRoleCard
            key={role.id}
            role={role}
            availablePermissions={availablePermissions || []}
            onDelete={() => deleteCustomRoleMutation.mutate({ customRoleId: role.id })}
          />
        ))}
      </div>
    </div>
  );
}

function CustomRoleCard({ role, availablePermissions, onDelete }: { role: any; availablePermissions: any[]; onDelete: () => void }) {
  const permsQuery = trpc.admin.customRolePermissions.useQuery({ customRoleId: role.id });
  const addPerm = trpc.admin.addCustomRolePermission.useMutation({ onSuccess: () => permsQuery.refetch() });
  const removePerm = trpc.admin.removeCustomRolePermission.useMutation({ onSuccess: () => permsQuery.refetch() });
  const [selectedPermission, setSelectedPermission] = useState("");

  const currentPermIds = useMemo(() => new Set((permsQuery.data || []).map((p: any) => p.permission)), [permsQuery.data]);
  const unusedPermissions = (availablePermissions || []).filter((p: any) => !currentPermIds.has(p.id));

  return (
    <Card className="rounded-xl shadow-sm flex flex-col h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between gap-2">
          <span className="truncate">{role.name}</span>
          <Badge variant="secondary" className="shrink-0 text-[10px] px-2 py-0.5">{permsQuery.data?.length ?? 0}</Badge>
        </CardTitle>
        {role.description && <CardDescription className="text-xs">{role.description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-4 pt-0 overflow-y-auto custom-scrollbar space-y-2 max-h-72">
        {permsQuery.isLoading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : permsQuery.data && permsQuery.data.length > 0 ? (
          permsQuery.data.map((perm: any) => (
            <div key={perm.id} className="flex items-start gap-2 p-2 rounded-md border bg-card/60 hover:bg-muted/50 transition text-xs">
              <div className="flex-1 min-w-0">
                <p className="font-medium break-all leading-snug">{perm.permission}</p>
                {perm.description && <p className="text-muted-foreground mt-0.5 leading-snug">{perm.description}</p>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-destructive"
                onClick={() => removePerm.mutate({ customRoleId: role.id, permissionId: perm.id, permission: perm.permission })}
                disabled={removePerm.isPending}
              >×</Button>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-center py-4 text-xs">No permissions yet.</p>
        )}
      </CardContent>
      <div className="px-4 pb-4 pt-2 mt-auto space-y-2">
        <div className="flex items-center gap-2">
          <Select value={selectedPermission} onValueChange={setSelectedPermission}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Add permission" />
            </SelectTrigger>
            <SelectContent>
              {unusedPermissions.map((perm: any) => (
                <SelectItem key={perm.id} value={perm.id}>{perm.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={() => {
              if (!selectedPermission) return;
              const meta = unusedPermissions.find((p: any) => p.id === selectedPermission);
              addPerm.mutate({ customRoleId: role.id, permission: selectedPermission, description: meta?.label });
              setSelectedPermission("");
            }}
            disabled={addPerm.isPending || !selectedPermission}
          >Add</Button>
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={onDelete} disabled={permsQuery.isLoading || deleteConfirmationGuard(permsQuery.data)}>
          Delete Role
        </Button>
      </div>
    </Card>
  );
}

function deleteConfirmationGuard(perms: any[] | undefined) {
  // We can allow deletion regardless; keeping button always enabled is fine.
  return false;
}
