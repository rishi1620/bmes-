import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import StatCard from "@/components/shared/StatCard";
import { Users, Calendar, FolderOpen, Trophy, FileText, Inbox, Image, GraduationCap, UserCheck, Link as LinkIcon, Bell, CalendarDays } from "lucide-react";

const AdminDashboard = () => {
  const [counts, setCounts] = useState({ members: 0, events: 0, projects: 0, achievements: 0, blog: 0, submissions: 0, unread: 0, media: 0, advisors: 0, alumni: 0, registrations: 0 });

  const load = async () => {
    const [m, e, p, a, b, s, u, media, adv, alum, reg] = await Promise.all([
      supabase.from("members").select("id", { count: "exact", head: true }),
      supabase.from("events").select("id", { count: "exact", head: true }),
      supabase.from("projects").select("id", { count: "exact", head: true }),
      supabase.from("achievements").select("id", { count: "exact", head: true }),
      supabase.from("blog_posts").select("id", { count: "exact", head: true }),
      supabase.from("contact_submissions").select("id", { count: "exact", head: true }),
      supabase.from("contact_submissions").select("id", { count: "exact", head: true }).eq("is_read", false),
      supabase.storage.from("media").list("", { limit: 1000 }),
      supabase.from("advisors").select("id", { count: "exact", head: true }),
      supabase.from("alumni").select("id", { count: "exact", head: true }),
      supabase.from("event_registrations").select("id", { count: "exact", head: true }),
    ]);
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
    });
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your system statistics and activity.</p>
        </div>
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
        <StatCard value={String(counts.submissions)} label="Submissions" icon={Inbox} to="/admin/submissions" />
        <StatCard value={String(counts.unread)} label="Unread Messages" icon={Bell} className="border-primary/20 bg-primary/5" to="/admin/submissions" />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
