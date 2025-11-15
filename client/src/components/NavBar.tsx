import { getLogoUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { Button } from "./ui/button";
import { NotificationBell } from "./NotificationBell";
import { LogOut, User } from "lucide-react";
export function NavBar() {
  const { user, logout } = useAuth();
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={getLogoUrl()}
            alt="Logo"
            className="h-11 w-11 rounded-full ring-2 ring-primary shadow-sm object-cover"
          />
        </div>
        <div className="flex items-center gap-2">
          <Link href="/posts">
            <Button variant="ghost" size="sm">Posts</Button>
          </Link>
          {user?.role === 'admin' && (
            <Link href="/admin">
              <Button variant="ghost" size="sm">Admin</Button>
            </Link>
          )}
          {user && <NotificationBell />}
          {user && (
            <Link href="/profile">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}
          {user ? (
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" /> Sign out
            </Button>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

