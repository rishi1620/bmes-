import { useEffect, useState } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, hasAdminAccess, loading, signOut } = useAuth();
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading && !timedOut) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-xs text-muted-foreground animate-pulse">Loading administration workspace...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && !hasAdminAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 shadow-lg text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Admin Access Required</h2>
          <p className="text-sm text-muted-foreground">
            You are signed in as <span className="font-semibold text-foreground">{user.email}</span>, but this account does not have administrator privileges.
          </p>
          <div className="pt-4 flex flex-col gap-2">
            <Button asChild variant="default" className="w-full gap-2">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Return to Home Website
              </Link>
            </Button>
            <Button variant="outline" onClick={signOut} className="w-full gap-2 text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4" />
              Sign Out & Switch Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
