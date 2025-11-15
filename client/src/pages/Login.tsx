import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogIn, Shield, Edit3, Eye, CheckCircle2 } from "lucide-react";
import { APP_TITLE, getLogoUrl } from "@/const";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();
  const loginMutation = trpc.auth.login.useMutation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }
  if (isAuthenticated) {
    navigate("/posts");
    return null;
  }
  return (
  <div className="min-h-[100dvh] md:h-screen grid grid-cols-1 md:grid-cols-2 short:grid-cols-1 bg-white overflow-hidden max-w-[1440px] mx-auto">
      {/* Left: Info/Brand */}
  <div className="hidden md:flex short:hidden flex-col justify-between p-8 xl:p-10 short:p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 md:overflow-y-auto custom-scrollbar max-w-full">
        <div>
          <div className="flex items-center gap-3">
            <img src={getLogoUrl()} alt={APP_TITLE} className="h-14 w-14 rounded-full ring-2 ring-primary shadow-md object-cover" />
            <div>
              <h1 className="text-xl short:text-base font-semibold tracking-tight">{APP_TITLE}</h1>
              <p className="text-slate-300 text-xs">Secure role-based access control</p>
            </div>
          </div>
          <div className="mt-8 xl:mt-12 short:mt-6 space-y-6 xl:space-y-8 short:gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Available Roles</h2>
              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-100">Admin</h3>
                      <Badge className="bg-blue-600 text-white">Full Access</Badge>
                    </div>
                    <p className="text-sm text-slate-300">Full access to all features and user management.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Edit3 className="w-5 h-5 text-amber-400 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-100">Editor</h3>
                      <Badge variant="secondary" className="bg-amber-600/20 text-amber-200 border-amber-300/30">Limited</Badge>
                    </div>
                    <p className="text-sm text-slate-300">Create and manage your own content.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-emerald-400 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-100">Viewer</h3>
                      <Badge variant="outline" className="border-emerald-300/30 text-emerald-200">Read-Only</Badge>
                    </div>
                    <p className="text-sm text-slate-300">Read-only access to published content.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="short:hidden">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Security Features</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> JWT-based authentication with role claims</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Row-level ownership verification</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Comprehensive audit logging</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Real-time permission enforcement</li>
              </ul>
            </div>
          </div>
        </div>
  <p className="text-[10px] text-slate-400">© {new Date().getFullYear()} {APP_TITLE}. All rights reserved.</p>
      </div>
      {/* Right: Action/Form */}
      <div className="flex items-center justify-center px-6 py-6 md:p-10 short:px-4 short:py-4 bg-white short:h-auto max-w-full">
        <div className="w-full max-w-sm md:max-w-md short:max-w-sm mx-auto">
          <Card className="shadow-xl border-slate-200">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl short:text-base">Welcome back</CardTitle>
              <CardDescription className="text-sm short:text-xs">Please enter your credentials to continue</CardDescription>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs font-semibold text-blue-900 mb-1">Demo Credentials:</p>
                <p className="text-xs text-blue-800">Username: <code className="bg-blue-100 px-1 py-0.5 rounded">admin</code></p>
                <p className="text-xs text-blue-800">Password: <code className="bg-blue-100 px-1 py-0.5 rounded">pass123</code></p>
              </div>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError(null);
                  try {
                    await loginMutation.mutateAsync({ username, password });
                    await utils.auth.me.invalidate();
                    navigate("/posts");
                  } catch (err: any) {
                    setError(err?.message ?? "Login failed");
                  }
                }}
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Username</label>
                  <input
                    type="text"
                    className="w-full border rounded-md px-3 py-2"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Password</label>
                    <a href="#" className="text-xs text-blue-600 hover:underline">Forgot password?</a>
                  </div>
                  <input
                    type="password"
                    className="w-full border rounded-md px-3 py-2"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                  disabled={loginMutation.isPending}
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

