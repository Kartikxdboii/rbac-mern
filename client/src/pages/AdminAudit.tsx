import DashboardLayout from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { trpc } from "@/lib/trpc";
import { Loader2, FileSearch } from "lucide-react";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
export default function AdminAuditPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <AuditLogsTab />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
function AuditLogsTab() {
  const { data: logs, isLoading } = trpc.admin.auditLogs.useQuery({ limit: 50, offset: 0 });
  if (isLoading) {
    return (
          <div className="space-y-6 page-wrap px-2 md:px-4 w-full max-w-[1400px] mx-auto overflow-x-hidden">
        <div className="bg-white rounded-2xl shadow p-6">
          <h1 className="text-xl font-semibold">Audit Logs</h1>
          <p className="text-gray-500 text-sm mt-1">All authorization events and system actions.</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex items-center justify-center min-h-[300px]">
          <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
        </div>
      </div>
    );
  }
  return (
      <div className="space-y-6 page-wrap px-2 md:px-4 w-full max-w-[1400px] mx-auto overflow-x-hidden">
      <div className="bg-white rounded-2xl shadow p-6">
        <h1 className="text-xl font-semibold">Audit Logs</h1>
        <p className="text-gray-500 text-sm mt-1">All authorization events and system actions.</p>
      </div>
      <div className="bg-white rounded-xl shadow p-4">
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {logs && logs.length > 0 ? (
            logs.map((log: any) => (
              <div key={log.id} className={`p-3 rounded-md border text-xs ${log.allowed ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium leading-tight">{log.action} {log.resourceType}</span>
                      <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${log.allowed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{log.allowed ? 'Allowed' : 'Denied'}</span>
                    </div>
                    {log.denialReason && <p className="text-[11px] text-muted-foreground mb-1 leading-snug">{log.denialReason}</p>}
                    <p className="text-[11px] text-muted-foreground leading-snug">User ID: {log.userId} • {new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <Empty className="border border-dashed py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileSearch className="h-6 w-6 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>No Logs Found</EmptyTitle>
                <EmptyDescription>
                  System activity and authorization events will appear here as they happen.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </div>
    </div>
  );
}

