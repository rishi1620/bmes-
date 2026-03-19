import { Link, useLocation, Navigate } from "react-router-dom";
import { Users, Calendar, FolderOpen, Trophy, LayoutDashboard, LogOut, FileText, Image, Settings, Inbox, Home, GraduationCap, Navigation, Bell, CalendarDays, HelpCircle, Menu, ExternalLink, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import defaultLogo from "@/assets/logo.png";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import AdminNotifications from "@/components/admin/AdminNotifications";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface NavLink {
  label: string;
  path: string;
  icon: React.ElementType;
  roles?: AppRole[];
}

interface LinkGroup {
  title: string;
  links: NavLink[];
}

const linkGroups: LinkGroup[] = [
  {
    title: "Overview",
    links: [
      { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    ]
  },
  {
    title: "Site Structure",
    links: [
      { label: "Pages & Navigation", path: "/admin/pages", icon: Navigation, roles: ["admin", "super_admin", "editor", "content_manager"] },
      { label: "Home Sections", path: "/admin/home", icon: Home, roles: ["admin", "super_admin", "editor", "content_manager"] },
      { label: "Media Library", path: "/admin/media", icon: Image, roles: ["admin", "super_admin", "editor", "content_manager"] },
      { label: "Site Settings", path: "/admin/settings", icon: Settings, roles: ["admin", "super_admin"] },
    ]
  },
  {
    title: "Core Content",
    links: [
      { label: "About Page", path: "/admin/about", icon: FileText, roles: ["admin", "super_admin", "editor", "content_manager"] },
      { label: "Academics", path: "/admin/academics", icon: GraduationCap, roles: ["admin", "super_admin", "editor", "content_manager"] },
      { label: "Portal Page", path: "/admin/portal", icon: FileText, roles: ["admin", "super_admin", "editor", "content_manager"] },
      { label: "Notices & News", path: "/admin/notices", icon: Bell, roles: ["admin", "super_admin", "editor", "content_manager"] },
      { label: "FAQ", path: "/admin/faq", icon: HelpCircle, roles: ["admin", "super_admin", "editor", "content_manager"] },
    ]
  },
  {
    title: "Community",
    links: [
      { label: "People", path: "/admin/people", icon: Users, roles: ["admin", "super_admin", "editor", "content_manager"] },
      { label: "Alumni", path: "/admin/alumni", icon: GraduationCap, roles: ["admin", "super_admin", "editor", "content_manager"] },
      { label: "Blog Posts", path: "/admin/blog", icon: FileText, roles: ["admin", "super_admin", "editor", "content_manager"] },
    ]
  },
  {
    title: "Engagement",
    links: [
      { label: "Events", path: "/admin/events", icon: Calendar, roles: ["admin", "super_admin", "editor", "content_manager"] },
      { label: "Projects", path: "/admin/projects", icon: FolderOpen, roles: ["admin", "super_admin", "editor", "content_manager"] },
      { label: "Achievements", path: "/admin/achievements", icon: Trophy, roles: ["admin", "super_admin", "editor", "content_manager"] },
      { label: "Activities", path: "/admin/activities", icon: CalendarDays, roles: ["admin", "super_admin", "editor", "content_manager"] },
    ]
  },
  {
    title: "User Data",
    links: [
      { label: "Contact Submissions", path: "/admin/submissions", icon: Inbox, roles: ["admin", "super_admin", "user", "editor", "content_manager"] },
      { label: "Event Registrations", path: "/admin/registrations", icon: CalendarDays, roles: ["admin", "super_admin", "user", "editor", "content_manager"] },
      { label: "Membership Apps", path: "/admin/membership", icon: UserCheck, roles: ["admin", "super_admin", "user", "editor", "content_manager"] },
    ]
  },
  {
    title: "System",
    links: [
      { label: "Users & Roles", path: "/admin/users", icon: Users, roles: ["admin", "super_admin"] },
    ]
  }
];

const SidebarContent = ({ pathname, search, signOut, logoUrl, onLinkClick }: { pathname: string, search: string, signOut: () => void, logoUrl: string, onLinkClick?: () => void }) => {
  const { hasRole } = useAuth();
  
  return (
    <div className="flex h-full flex-col bg-transparent text-sidebar-foreground">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <img alt="BMES" className="h-8 w-8 rounded-lg object-contain bg-white p-1" src={logoUrl || defaultLogo} />
        <span className="text-lg font-bold tracking-tight">BMES Admin</span>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
        {linkGroups.map((group) => {
          // Filter links based on user roles
          const visibleLinks = group.links.filter(link => {
            if (!link.roles) return true; // If no roles specified, visible to all with admin access
            return hasRole(link.roles);
          });

          if (visibleLinks.length === 0) return null;

          return (
            <div key={group.title}>
              <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {group.title}
              </h4>
              <div className="space-y-1">
                {visibleLinks.map((l) => {
                  const isActive = pathname === l.path || pathname + search === l.path;
                  return (
                    <Link
                      key={l.path}
                      to={l.path}
                      onClick={onLinkClick}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <l.icon className="h-4 w-4" />
                      {l.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4 space-y-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start gap-2 border-sidebar-border bg-sidebar-accent/10 text-sidebar-foreground hover:bg-sidebar-accent/50" 
          asChild
          onClick={onLinkClick}
        >
          <Link to="/">
            <ExternalLink className="h-4 w-4" /> 
            Main Page
          </Link>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground" 
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" /> 
          Sign Out
        </Button>
      </div>
    </div>
  );
};

const AdminLayout = ({ children }: {children: React.ReactNode;}) => {
  const { user, hasAdminAccess, loading, signOut } = useAuth();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    const fetchLogo = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "dashboard_logo_url")
        .single();
      
      if (data?.setting_value) {
        setLogoUrl(data.setting_value);
      } else {
        // Fallback to main logo if dashboard logo not set
        const { data: mainLogo } = await supabase
          .from("site_settings")
          .select("setting_value")
          .eq("setting_key", "logo_url")
          .single();
        if (mainLogo?.setting_value) {
          setLogoUrl(mainLogo.setting_value);
        }
      }
    };
    fetchLogo();
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading dashboard...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!hasAdminAccess) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center bg-muted/30">
      <div className="rounded-xl border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">You don't have admin privileges to view this page.</p>
        <Button variant="outline" className="mt-6" onClick={signOut}>Sign Out</Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-transparent">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-md md:flex fixed inset-y-0 left-0 z-50">
        <SidebarContent pathname={location.pathname} search={location.search} signOut={signOut} logoUrl={logoUrl} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r border-sidebar-border bg-sidebar/80 backdrop-blur-md text-sidebar-foreground">
          <div className="sr-only">
            <SheetTitle>Admin Navigation</SheetTitle>
          </div>
          <SidebarContent pathname={location.pathname} search={location.search} signOut={signOut} logoUrl={logoUrl} onLinkClick={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col md:pl-64 transition-all duration-300">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/40 px-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSheetOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden md:block">
              <Breadcrumbs />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="hidden md:flex gap-2" asChild>
              <Link to="/" target="_blank">
                <ExternalLink className="h-4 w-4" />
                View Site
              </Link>
            </Button>
            <AdminNotifications />
            <div className="flex items-center gap-2">
              <div className="hidden flex-col items-end text-sm md:flex">
                <span className="font-medium text-foreground">{user.email?.split('@')[0]}</span>
                <span className="text-xs text-muted-foreground">Admin</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full animate-fade-up">
          <div className="md:hidden mb-6">
            <Breadcrumbs />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;