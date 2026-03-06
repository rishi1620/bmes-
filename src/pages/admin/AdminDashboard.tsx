import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import StatCard from "@/components/shared/StatCard";

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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard value={String(counts.members)} label="Members" />
        <StatCard value={String(counts.advisors)} label="Advisors" />
        <StatCard value={String(counts.events)} label="Events" />
        <StatCard value={String(counts.projects)} label="Projects" />
        <StatCard value={String(counts.achievements)} label="Achievements" />
        <StatCard value={String(counts.blog)} label="Blog Posts" />
        <StatCard value={String(counts.alumni)} label="Alumni" />
        <StatCard value={String(counts.media)} label="Media Files" />
        <StatCard value={String(counts.submissions)} label="Submissions" />
        <StatCard value={String(counts.unread)} label="Unread Messages" />
        <StatCard value={String(counts.registrations)} label="Event Registrations" />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
