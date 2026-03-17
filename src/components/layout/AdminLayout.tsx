import { Link, useLocation, Navigate } from "react-router-dom";
import { Users, Calendar, FolderOpen, Trophy, LayoutDashboard, LogOut, FileText, Image, Settings, Inbox, Home, GraduationCap, Navigation, Link as LinkIcon, Bell, CalendarDays, HelpCircle, Menu, ExternalLink, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import defaultLogo from "@/assets/logo.png";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import AdminNotifications from "@/components/admin/AdminNotifications";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const linkGroups = [
  {
    title: "Overview",
    links: [
      { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    ]
  },
  {
    title: "Home Page",
    links: [
      { label: "Home Sections", path: "/admin/home", icon: Home },
      { label: "Quick Links", path: "/admin/home?section=quick_links", icon: LinkIcon },
      { label: "Announcements", path: "/admin/home?section=announcements", icon: Bell },
      { label: "Upcoming Events", path: "/admin/home?section=upcoming_events", icon: CalendarDays },
    ]
  },
  {
    title: "Content",
    links: [
      { label: "Pages / Nav", path: "/admin/pages", icon: Navigation },
      { label: "About Page", path: "/admin/about", icon: FileText },
      { label: "Academics", path: "/admin/academics", icon: GraduationCap },
      { label: "Activities", path: "/admin/activities", icon: CalendarDays },
      { label: "Portal Page", path: "/admin/portal", icon: FileText },
      { label: "People", path: "/admin/people", icon: Users },
      { label: "Events", path: "/admin/events", icon: Calendar },
      { label: "Projects", path: "/admin/projects", icon: FolderOpen },
      { label: "Achievements", path: "/admin/achievements", icon: Trophy },
      { label: "Blog", path: "/admin/blog", icon: FileText },
      { label: "Alumni", path: "/admin/alumni", icon: GraduationCap },
      { label: "FAQ", path: "/admin/faq", icon: HelpCircle },
    ]
  },
  {
    title: "System",
    links: [
      { label: "Media", path: "/admin/media", icon: Image },
      { label: "Contact Form", path: "/admin/submissions", icon: Inbox },
      { label: "Event Registrations", path: "/admin/registrations", icon: CalendarDays },
      { label: "Membership Apps", path: "/admin/membership", icon: UserCheck },
      { label: "Settings", path: "/admin/settings", icon: Settings },
    ]
  }
];

const SidebarContent = ({ pathname, signOut, logoUrl }: { pathname: string, signOut: () => void, logoUrl: string }) => (
  <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
    <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
      <img alt="BMES" className="h-8 w-8 rounded-lg object-contain bg-white p-1" src={logoUrl || defaultLogo} />
      <span className="text-lg font-bold tracking-tight">BMES Admin</span>
    </div>
    <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
      {linkGroups.map((group) => (
        <div key={group.title}>
          <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            {group.title}
          </h4>
          <div className="space-y-1">
            {group.links.map((l) => {
              const isActive = pathname === l.path || pathname + location.search === l.path;
              return (
                <Link
                  key={l.path}
                  to={l.path}
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
      ))}
    </nav>
    <div className="border-t border-sidebar-border p-4 space-y-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full justify-start gap-2 border-sidebar-border bg-sidebar-accent/10 text-sidebar-foreground hover:bg-sidebar-accent/50" 
        asChild
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

const AdminLayout = ({ children }: {children: React.ReactNode;}) => {
  const { user, isAdmin, loading, signOut } = useAuth();
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
  if (!isAdmin) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center bg-muted/30">
      <div className="rounded-xl border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">You don't have admin privileges to view this page.</p>
        <Button variant="outline" className="mt-6" onClick={signOut}>Sign Out</Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex fixed inset-y-0 left-0 z-50">
        <SidebarContent pathname={location.pathname} signOut={signOut} logoUrl={logoUrl} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
          <div className="sr-only">
            <SheetTitle>Admin Navigation</SheetTitle>
          </div>
          <SidebarContent pathname={location.pathname} signOut={signOut} logoUrl={logoUrl} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col md:pl-64 transition-all duration-300">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSheetOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden md:block">
              <Breadcrumbs />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
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