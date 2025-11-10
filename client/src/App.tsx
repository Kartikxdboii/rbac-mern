import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./pages/Login";
import Posts from "./pages/Posts";
import PostsEnhanced from "./pages/PostsEnhanced";
import Profile from "./pages/Profile";
import AdminDashboardPage from "./pages/AdminDashboard";
import AdminUsersPage from "./pages/AdminUsers";
import AdminRegister from "./pages/AdminRegister";
import AdminPermissionsPage from "./pages/AdminPermissions";
import AdminStatsPage from "./pages/AdminStats";
import AdminAuditPage from "./pages/AdminAudit";
import { ProtectedRoute } from "./components/ProtectedRoute";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
  <Route path={"/"} component={Login} />
      <Route path={"/login"} component={Login} />
      <Route path={"/posts"}>
        <ProtectedRoute>
          <PostsEnhanced />
        </ProtectedRoute>
      </Route>
      <Route path={"/profile"}>
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route path={"/admin"}>
        <ProtectedRoute requiredRole="admin">
          <AdminDashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path={"/admin/users"}>
        <ProtectedRoute requiredRole="admin">
          <AdminUsersPage />
        </ProtectedRoute>
      </Route>
      <Route path={"/admin/register"}>
        <ProtectedRoute requiredRole="admin">
          <AdminRegister />
        </ProtectedRoute>
      </Route>
      <Route path={"/admin/permissions"}>
        <ProtectedRoute requiredRole="admin">
          <AdminPermissionsPage />
        </ProtectedRoute>
      </Route>
      <Route path={"/admin/stats"}>
        <ProtectedRoute requiredRole="admin">
          <AdminStatsPage />
        </ProtectedRoute>
      </Route>
      <Route path={"/admin/audit"}>
        <ProtectedRoute requiredRole="admin">
          <AdminAuditPage />
        </ProtectedRoute>
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
