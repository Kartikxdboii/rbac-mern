import DashboardLayout from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
export default function AdminStatsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <StatsTab />
      </DashboardLayout>
    </ProtectedRoute>
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold">Statistics</h1>
        <p className="text-gray-500 mt-1">Overview of role distribution and authorization denials.</p>
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="shadow-sm rounded-2xl"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Users</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats?.totalUsers}</p></CardContent></Card>
        <Card className="shadow-sm rounded-2xl"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Admins</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats?.roleStats.admin}</p></CardContent></Card>
        <Card className="shadow-sm rounded-2xl"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Editors</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats?.roleStats.editor}</p></CardContent></Card>
        <Card className="shadow-sm rounded-2xl"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Viewers</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats?.roleStats.viewer}</p></CardContent></Card>
      </div>
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Recent Authorization Denials</CardTitle>
          <CardDescription>Number of permission denials by action type</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.recentDenials.total === 0 ? (
            <p className="text-muted-foreground">No authorization denials recorded</p>
          ) : (
            <div className="space-y-2">
              <p className="font-medium">Total Denials: <span className="text-destructive">{stats?.recentDenials.total}</span></p>
              <div className="space-y-1 text-sm">
                {Object.entries(stats?.recentDenials.byAction || {}).map(([action, count]: [string, any]) => (
                  <div key={action} className="flex justify-between"><span className="text-muted-foreground">{action}</span><span className="font-medium">{count}</span></div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

