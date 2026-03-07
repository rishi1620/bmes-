import { Link, useLocation, Navigate } from "react-router-dom";
import { Users, Calendar, FolderOpen, Trophy, LayoutDashboard, LogOut, FileText, Image, Settings, Inbox, Home, GraduationCap, UserCheck, Navigation, Link as LinkIcon, Bell, CalendarDays, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import defaultLogo from "@/assets/logo.png";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import AdminNotifications from "@/components/admin/AdminNotifications";

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
      { label: "Media", path: "/admin/media", icon: Image, adminOnly: true },
      { label: "Contact Form", path: "/admin/submissions", icon: Inbox, adminOnly: true },
      { label: "Event Registrations", path: "/admin/registrations", icon: CalendarDays },
      { label: "Settings", path: "/admin/settings", icon: Settings },
    ]
  }
];

const AdminLayout = ({ children }: {children: React.ReactNode;}) => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
      <p className="text-muted-foreground">You don't have admin privileges.</p>
      <Button variant="outline" onClick={signOut}>Sign Out</Button>
    </div>);

  return (
    <div className="flex min-h-screen">
      <aside className={`hidden flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300 md:flex ${collapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img alt="BMES" className="h-8 w-8 rounded-lg object-contain" src={defaultLogo} />
            {!collapsed && <span className="text-sm font-bold whitespace-nowrap">BMES Admin</span>}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto p-2">
          {linkGroups.map((group) => (
            <div key={group.title}>
              {!collapsed && (
                <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                  {group.title}
                </h4>
              )}
              <div className="space-y-1">
                {group.links.filter(l => !l.adminOnly || isAdmin).map((l) => {
                  const isActive = location.pathname === l.path || location.pathname + location.search === l.path;
                  return (
                    <Link
                      key={l.path}
                      to={l.path}
                      title={collapsed ? l.label : undefined}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                        isActive ?
                        "bg-primary/10 text-primary" :
                        "text-muted-foreground hover:bg-muted hover:text-foreground"
                      } ${collapsed ? 'justify-center' : ''}`}
                    >
                      <l.icon className="h-4 w-4" />
                      {!collapsed && l.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <Button variant="ghost" size="sm" className={`w-full gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground ${collapsed ? 'justify-center' : 'justify-start'}`} onClick={signOut}>
            <LogOut className="h-4 w-4" /> {!collapsed && "Sign Out"}
          </Button>
        </div>
      </aside>


      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 md:hidden">
          <div className="flex items-center gap-2">
            <img alt="BMES" className="h-6 w-6 rounded-lg object-contain" src={defaultLogo} />
            <span className="text-sm font-bold">BMES Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <AdminNotifications />
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-background p-2 md:hidden">
          {linkGroups.flatMap(g => g.links).map((l) => {
            const isActive = location.pathname === l.path || location.pathname + location.search === l.path;
            return (
              <Link
                key={l.path}
                to={l.path}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                <l.icon className="h-3.5 w-3.5" />
                {l.label}
              </Link>
            );
          })}
        </nav>
        <main className="flex-1 overflow-auto bg-muted/30 p-4 md:p-8">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>);
};

export default AdminLayout;