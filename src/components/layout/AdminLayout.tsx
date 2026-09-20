import { Link, useLocation, Navigate } from "react-router-dom";
import { 
  Users, 
  Calendar, 
  FolderOpen, 
  Trophy, 
  LayoutDashboard, 
  LogOut, 
  FileText, 
  Image, 
  Settings, 
  Inbox, 
  Home, 
  GraduationCap, 
  Navigation, 
  Bell, 
  CalendarDays, 
  HelpCircle, 
  Menu, 
  ExternalLink, 
  UserCheck, 
  ChevronDown, 
  ChevronUp, 
  Microscope, 
  Mail,
  Globe,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import defaultLogo from "@/assets/logo.png";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import AdminNotifications from "@/components/admin/AdminNotifications";
import AdminGlobalSearch from "@/components/admin/AdminGlobalSearch";
import AdminQuickActions from "@/components/admin/AdminQuickActions";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
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
  badgeKey?: "pendingMemberships" | "unreadSubmissions";
}

interface LinkGroup {
  title: string;
  links: NavLink[];
  defaultOpen?: boolean;
}

const linkGroups: LinkGroup[] = [
  {
    title: "Overview",
    links: [
      { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    ],
    defaultOpen: true
  },
  {
    title: "Site Structure",
    links: [
      { label: "Pages & Navigation", path: "/admin/pages", icon: Navigation, roles: ["admin", "super_admin", "editor", "content_manager"] },
      { label: "Home Sections", path: "/admin/home", icon: Home, roles: ["admin", "super_admin", "editor", "content_manager"] },
      { label: "Media Library", path: "/admin/media", icon: Image, roles: ["admin", "super_admin", "editor", "content_manager"] },
      { label: "Site Settings", path: "/admin/settings", icon: Settings, roles: ["admin", "super_admin"] },
    ],
    defaultOpen: false
  },
  {
    title: "Core Content",
    links: [
      { label: "About Page", path: "/admin/about", icon: FileText, roles: ["admin", "super_admin", "editor", "content_manager"] },
      { label: "Academics", path: "/admin/academics", icon: GraduationCap, roles: ["admin", "super_admin", "editor", "content_manager"] },
      { label: "Research", path: "/admin/research", icon: Microscope, roles: ["admin", "super_admin", "editor", "content_manager"] },
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
      { label: "Contact Submissions", path: "/admin/submissions", icon: Inbox, roles: ["admin", "super_admin", "user", "editor", "content_manager"], badgeKey: "unreadSubmissions" },
      { label: "Event Registrations", path: "/admin/registrations", icon: CalendarDays, roles: ["admin", "super_admin", "user", "editor", "content_manager"] },
      { label: "Membership Apps", path: "/admin/membership", icon: UserCheck, roles: ["admin", "super_admin", "user", "editor", "content_manager"], badgeKey: "pendingMemberships" },
      { label: "Bulk Email", path: "/admin/bulk-email", icon: Mail, roles: ["admin", "super_admin"] },
      { label: "User Roles", path: "/admin/users", icon: Users, roles: ["admin", "super_admin"] },
    ]
  },
  {
    title: "Google Workspace",
    links: [
      { label: "Drive, Calendar & Forms", path: "/admin/workspace", icon: Globe, roles: ["admin", "super_admin", "editor", "content_manager"] },
    ],
    defaultOpen: true
  }
];

interface SidebarBadges {
  pendingMemberships: number;
  unreadSubmissions: number;
}

const SidebarContent = ({ 
  pathname, 
  search, 
  signOut, 
  logoUrl, 
  badges, 
  onLinkClick 
}: { 
  pathname: string; 
  search: string; 
  signOut: () => void; 
  logoUrl: string; 
  badges: SidebarBadges; 
  onLinkClick?: () => void;
}) => {
  const { hasRole } = useAuth();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    linkGroups.forEach(g => defaults[g.title] = g.defaultOpen || false);
    return defaults;
  });

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };
  
  return (
    <div className="flex h-full flex-col bg-transparent text-sidebar-foreground">
      {/* Sidebar Header with Society Branding & Live Sync Status */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4 lg:px-6">
        <div className="relative">
          <img 
            alt="CUET BMES" 
            className="h-9 w-9 rounded-xl object-contain bg-white dark:bg-slate-900 p-1 border border-border/80 shadow-xs" 
            src={logoUrl || defaultLogo} 
          />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary ring-2 ring-background"></span>
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-foreground truncate">CUET BMES</span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary/30 text-primary bg-primary/10">
              Admin
            </Badge>
          </div>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary"></span>
            Synced with Main Site
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {linkGroups.map((group) => {
          // Filter links based on user roles
          const visibleLinks = group.links.filter(link => {
            if (!link.roles) return true; // If no roles specified, visible to all with admin access
            return hasRole(link.roles);
          });

          if (visibleLinks.length === 0) return null;

          const isOpen = openGroups[group.title];

          return (
            <div key={group.title}>
              <button
                onClick={() => toggleGroup(group.title)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
              >
                {group.title}
                {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              <div 
                className={cn(
                  "grid transition-all duration-200 ease-in-out", 
                  isOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0 mt-0"
                )}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-col gap-1">
                    {visibleLinks.map((l) => {
                      const isActive = pathname === l.path || pathname + search === l.path;
                      const badgeValue = l.badgeKey ? badges[l.badgeKey] : 0;

                      return (
                        <Link
                          key={l.path}
                          to={l.path}
                          onClick={onLinkClick}
                          className={cn(
                            "group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                            isActive
                              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <l.icon className={cn(
                              "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                              isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                            )} />
                            <span className="truncate">{l.label}</span>
                          </div>

                          {badgeValue > 0 && (
                            <span className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 font-mono",
                              isActive 
                                ? "bg-white text-primary" 
                                : l.badgeKey === "pendingMemberships"
                                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse"
                                : "bg-primary/15 text-primary border border-primary/25"
                            )}>
                              {badgeValue}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer with Main Site Live Status */}
      <div className="border-t border-sidebar-border p-4 space-y-2">
        <div className="p-2.5 rounded-lg border border-border/60 bg-muted/40 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-primary" />
              Public Main Site
            </span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary/30 text-primary bg-primary/10">
              Live
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground leading-snug">
            All database updates auto-sync in real time.
          </p>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start gap-2 border-sidebar-border bg-sidebar-accent/10 text-sidebar-foreground hover:bg-sidebar-accent/50 text-xs" 
          asChild
          onClick={onLinkClick}
        >
          <Link to="/" target="_blank">
            <ExternalLink className="h-3.5 w-3.5" /> 
            Open Public Website
          </Link>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive text-xs" 
          onClick={signOut}
        >
          <LogOut className="h-3.5 w-3.5" /> 
          Sign Out
        </Button>
      </div>
    </div>
  );
};

const AdminLayout = ({ children }: {children: React.ReactNode;}) => {
  const { user, hasAdminAccess, loading, signOut, roles, isAdmin } = useAuth();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [badges, setBadges] = useState<SidebarBadges>({
    pendingMemberships: 0,
    unreadSubmissions: 0,
  });

  useEffect(() => {
    const fetchBadgesAndLogo = async () => {
      try {
        const [logoRes, fallbackLogoRes, pendingMemRes, unreadSubRes] = await Promise.all([
          supabase.from("site_settings").select("setting_value").eq("setting_key", "dashboard_logo_url").maybeSingle(),
          supabase.from("site_settings").select("setting_value").eq("setting_key", "logo_url").maybeSingle(),
          supabase.from("membership_registrations").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("contact_submissions").select("id", { count: "exact", head: true }).eq("is_read", false)
        ]);

        if (logoRes.data?.setting_value) {
          setLogoUrl(logoRes.data.setting_value);
        } else if (fallbackLogoRes.data?.setting_value) {
          setLogoUrl(fallbackLogoRes.data.setting_value);
        }

        setBadges({
          pendingMemberships: pendingMemRes.count ?? 0,
          unreadSubmissions: unreadSubRes.count ?? 0,
        });
      } catch (e) {
        console.error("Error loading admin header data:", e);
      }
    };

    fetchBadgesAndLogo();

    // Listen to changes to keep sidebar badges in sync
    const memChannel = supabase
      .channel("admin_layout_badges")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "membership_registrations" },
        () => fetchBadgesAndLogo()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_submissions" },
        () => fetchBadgesAndLogo()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(memChannel);
    };
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading dashboard...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!hasAdminAccess) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center bg-muted/30">
      <div className="rounded-xl border bg-card p-8 shadow-sm max-w-md">
        <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">You don't have administrative privileges to view this portal.</p>
        <Button variant="outline" className="mt-6" onClick={signOut}>Sign Out</Button>
      </div>
    </div>
  );

  const roleLabel = roles.includes("super_admin") 
    ? "Super Admin" 
    : isAdmin 
    ? "Admin" 
    : roles.includes("editor") 
    ? "Editor" 
    : "Manager";

  return (
    <div className="flex min-h-screen bg-transparent">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar/90 backdrop-blur-md md:flex fixed inset-y-0 left-0 z-50">
        <SidebarContent 
          pathname={location.pathname} 
          search={location.search} 
          signOut={signOut} 
          logoUrl={logoUrl} 
          badges={badges} 
        />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r border-sidebar-border bg-sidebar/95 backdrop-blur-md text-sidebar-foreground">
          <div className="sr-only">
            <SheetTitle>Admin Navigation</SheetTitle>
          </div>
          <SidebarContent 
            pathname={location.pathname} 
            search={location.search} 
            signOut={signOut} 
            logoUrl={logoUrl} 
            badges={badges}
            onLinkClick={() => setSheetOpen(false)} 
          />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col md:pl-64 transition-all duration-300">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 md:px-6 backdrop-blur-md gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSheetOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden lg:block">
              <Breadcrumbs />
            </div>
          </div>
          
          {/* Global Search Bar */}
          <div className="flex-1 max-w-sm md:max-w-md mx-auto flex items-center justify-center">
            <AdminGlobalSearch />
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {/* Live Sync Status Indicator Badge */}
            <div 
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium cursor-help"
              title="Database changes immediately reflect on the public site"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span>Site Synced</span>
            </div>

            {/* Quick Actions Component */}
            <AdminQuickActions variant="dropdown" />

            {/* Public Website Preview Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden lg:flex gap-1.5 text-xs font-semibold h-8 border-border">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  <span>Main Website</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5">
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                  <span>Public Site Links</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary/30 text-primary">
                    Live
                  </Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/" target="_blank" className="flex items-center justify-between cursor-pointer text-xs">
                    <span className="flex items-center gap-2">
                      <Home className="h-3.5 w-3.5 text-primary" />
                      Home Page
                    </span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/portal" target="_blank" className="flex items-center justify-between cursor-pointer text-xs">
                    <span className="flex items-center gap-2">
                      <UserCheck className="h-3.5 w-3.5 text-primary" />
                      Member Portal & ID
                    </span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/notices" target="_blank" className="flex items-center justify-between cursor-pointer text-xs">
                    <span className="flex items-center gap-2">
                      <Bell className="h-3.5 w-3.5 text-amber-500" />
                      Notices & News
                    </span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/events" target="_blank" className="flex items-center justify-between cursor-pointer text-xs">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-blue-500" />
                      Events Calendar
                    </span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/projects" target="_blank" className="flex items-center justify-between cursor-pointer text-xs">
                    <span className="flex items-center gap-2">
                      <FolderOpen className="h-3.5 w-3.5 text-purple-500" />
                      Projects Showcase
                    </span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/academics" target="_blank" className="flex items-center justify-between cursor-pointer text-xs">
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                      Academic Batches
                    </span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/alumni" target="_blank" className="flex items-center justify-between cursor-pointer text-xs">
                    <span className="flex items-center gap-2">
                      <GraduationCap className="h-3.5 w-3.5 text-cyan-500" />
                      Alumni Directory
                    </span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ThemeToggle align="end" />
            <AdminNotifications />

            {/* Admin Profile Pill */}
            <div className="flex items-center gap-2 pl-1 border-l border-border">
              <div className="hidden sm:flex flex-col items-end text-sm">
                <span className="font-semibold text-foreground text-xs leading-tight">{user.email?.split('@')[0]}</span>
                <span className="text-[10px] text-muted-foreground font-mono leading-none mt-0.5">{roleLabel}</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 shadow-xs">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full animate-fade-up">
          <div className="md:hidden mb-4">
            <Breadcrumbs />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
