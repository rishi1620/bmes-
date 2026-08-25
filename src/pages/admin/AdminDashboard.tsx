import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import StatCard from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, FolderOpen, Trophy, FileText, Image, GraduationCap, UserCheck, Bell, CalendarDays, RefreshCw, ArrowRight, Layout } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const AdminDashboard = () => {
  const [counts, setCounts] = useState({ members: 0, events: 0, projects: 0, achievements: 0, blog: 0, submissions: 0, unread: 0, media: 0, advisors: 0, alumni: 0, registrations: 0, membershipApps: 0, notices: 0 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pendingApps, setPendingApps] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, e, p, a, b, s, u, media, adv, alum, reg, mem, recentRegsData, pendingAppsData, noticesData] = await Promise.all([
        supabase.from("members").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("achievements").select("id", { count: "exact", head: true }),
        supabase.from("blog_posts").select("id", { count: "exact", head: true }),
        supabase.from("contact_submissions").select("id", { count: "exact", head: true }),
        supabase.from("contact_submissions").select("id", { count: "exact", head: true }).eq("is_read", false),
        supabase.storage.from("media").list("", { limit: 1000 }),
        supabase.from("advisors").select("id", { count: "exact", head: true }).in("role_type", ["Advisor", "Moderator", "Counselor"]),
        supabase.from("alumni").select("id", { count: "exact", head: true }),
        supabase.from("event_registrations").select("id", { count: "exact", head: true }),
        supabase.from("membership_registrations").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("event_registrations").select("id, name, email, created_at, events(title)").order("created_at", { ascending: false }).limit(5),
        supabase.from("membership_registrations").select("id, full_name, email, created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(5),
        supabase.from("site_settings").select("setting_value").eq("setting_key", "portal_notices_json").maybeSingle(),
      ]);

      let noticesCount = 0;
      let parsedNotices: Record<string, unknown>[] = [];
      try {
        if (noticesData.data?.setting_value) {
          const parsed = JSON.parse(noticesData.data.setting_value);
          if (Array.isArray(parsed)) {
            noticesCount = parsed.length;
            parsed.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
            parsedNotices = parsed.slice(0, 5);
          }
        }
      } catch (err) {
        console.error("Error parsing notices:", err);
      }

      setRecentNotices(parsedNotices);
      setCounts({
        members: m.count ?? 0,
        events: e.count ?? 0,
        projects: p.count ?? 0,
        achievements: a.count ?? 0,
        blog: b.count ?? 0,
        submissions: s.count ?? 0,
        unread: u.count ?? 0,
        media: media.data?.filter((f) => f.name !== ".emptyFolderPlaceholder").length ?? 0,
        advisors: adv.count ?? 0,
        alumni: alum.count ?? 0,
        registrations: reg.count ?? 0,
        membershipApps: mem.count ?? 0,
        notices: noticesCount,
      });
      setRecentRegistrations(recentRegsData.data || []);
      setPendingApps(pendingAppsData.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your system statistics and activity.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard value={String(counts.members)} label="Members" icon={Users} to="/admin/people?tab=ec" />
        <StatCard value={String(counts.advisors)} label="Advisors" icon={UserCheck} to="/admin/people?tab=advisory" />
        <StatCard value={String(counts.alumni)} label="Alumni" icon={GraduationCap} to="/admin/alumni" />
        <StatCard value={String(counts.events)} label="Events" icon={Calendar} to="/admin/events" />
        
        <StatCard value={String(counts.registrations)} label="Registrations" icon={CalendarDays} to="/admin/registrations" />
        <StatCard value={String(counts.projects)} label="Projects" icon={FolderOpen} to="/admin/projects" />
        <StatCard value={String(counts.achievements)} label="Achievements" icon={Trophy} to="/admin/achievements" />
        <StatCard value={String(counts.blog)} label="Blog Posts" icon={FileText} to="/admin/blog" />
        
        <StatCard value={String(counts.media)} label="Media Files" icon={Image} to="/admin/media" />
        <StatCard value={String(counts.notices)} label="Notices & News" icon={Bell} to="/admin/notices" />
        <StatCard value="Manage" label="Portal Page" icon={Layout} to="/admin/portal" />
        <StatCard value={String(counts.membershipApps)} label="Pending Apps" icon={UserCheck} className="border-purple-500/20 bg-purple-500/5" to="/admin/membership" />
        <StatCard value={String(counts.unread)} label="Unread Messages" icon={Bell} className="border-primary/20 bg-primary/5" to="/admin/submissions" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8 items-start">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base font-medium">Recent Event Registrations</CardTitle>
              <CardDescription>Latest users who registered for events</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link to="/admin/registrations">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentRegistrations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent registrations.</p>
            ) : (
              <div className="space-y-2">
                {recentRegistrations.map((reg) => (
                  <Link key={reg.id} to="/admin/registrations" className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0 hover:bg-muted/50 p-2 rounded-md transition-colors">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{reg.name}</p>
                      <p className="text-sm text-muted-foreground">{reg.email}</p>
                      <p className="text-xs text-primary">{reg.events?.title || 'Unknown Event'}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(reg.created_at), "MMM d, yyyy")}
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" asChild className="w-full mt-4 sm:hidden">
              <Link to="/admin/registrations">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base font-medium">Pending Membership Apps</CardTitle>
              <CardDescription>Applications waiting for approval</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link to="/admin/membership">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingApps.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No pending applications.</p>
            ) : (
              <div className="space-y-2">
                {pendingApps.map((app) => (
                  <Link key={app.id} to="/admin/membership" className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0 hover:bg-muted/50 p-2 rounded-md transition-colors">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{app.full_name}</p>
                      <p className="text-sm text-muted-foreground">{app.email}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(app.created_at), "MMM d, yyyy")}
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" asChild className="w-full mt-4 sm:hidden">
              <Link to="/admin/membership">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base font-medium">Recent Notices</CardTitle>
              <CardDescription>Latest announcements</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link to="/admin/notices">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentNotices.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent notices.</p>
            ) : (
              <div className="space-y-2">
                {recentNotices.map((notice, idx) => (
                  <Link key={notice.id || idx} to="/admin/notices" className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0 hover:bg-muted/50 p-2 rounded-md transition-colors">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none line-clamp-1">{notice.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{notice.category || 'Departmental'}</p>
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                      {notice.date ? format(new Date(notice.date), "MMM d, yyyy") : ''}
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" asChild className="w-full mt-4 sm:hidden">
              <Link to="/admin/notices">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
