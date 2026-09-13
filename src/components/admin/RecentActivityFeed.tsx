import React, { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  FolderOpen, 
  Calendar, 
  RefreshCw, 
  Filter, 
  Radio, 
  Clock, 
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export type ActivityCategory = "all" | "members" | "projects" | "events";

export interface ActivityItem {
  id: string;
  category: "members" | "projects" | "events";
  eventType: "insert" | "update" | "initial";
  title: string;
  summary: string;
  timestamp: string;
  badge: string;
  badgeVariant?: "default" | "outline" | "secondary";
  badgeColor?: string;
  isLive?: boolean;
  linkAdmin: string;
  linkPublic?: string;
  actor?: string;
}

interface RecentActivityFeedProps {
  limit?: number;
  className?: string;
  onActivityCountChange?: (count: number) => void;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  limit = 20,
  className = "",
  onActivityCountChange,
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActivityCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastEventTime, setLastEventTime] = useState<Date>(new Date());
  const [channelConnected, setChannelConnected] = useState(true);

  // Fetch initial activity batch across tables
  const fetchRecentActivities = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [membersRes, projectsRes, eventsRes, registrationsRes] = await Promise.all([
        supabase
          .from("membership_registrations")
          .select("id, full_name, student_id, department, status, created_at")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("projects")
          .select("id, title, category, progress, status, lead, updated_at, created_at")
          .order("updated_at", { ascending: false })
          .limit(8),
        supabase
          .from("events")
          .select("id, title, date, location, type, is_upcoming, created_at, updated_at")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("event_registrations")
          .select("id, name, email, created_at, events(title)")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

      const items: ActivityItem[] = [];

      // 1. Membership updates & applications
      if (membersRes.data) {
        membersRes.data.forEach((m) => {
          const isApproved = m.status === "approved";
          items.push({
            id: `member-${m.id}`,
            category: "members",
            eventType: "initial",
            title: isApproved ? `Member Verified: ${m.full_name}` : `New Application: ${m.full_name}`,
            summary: isApproved 
              ? `${m.full_name} (${m.student_id || "ID assigned"}) is verified in ${m.department || "BME"}.`
              : `${m.full_name} (${m.student_id || "ID pending"}) submitted membership application for ${m.department || "BME"}.`,
            timestamp: m.created_at,
            badge: isApproved ? "Member Verified" : "Pending Review",
            badgeColor: isApproved 
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" 
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
            linkAdmin: "/admin/membership",
            linkPublic: "/portal?tab=verify",
            actor: m.full_name,
          });
        });
      }

      // 2. Project Posts & Updates
      if (projectsRes.data) {
        projectsRes.data.forEach((p) => {
          items.push({
            id: `project-${p.id}`,
            category: "projects",
            eventType: "initial",
            title: `Project: ${p.title}`,
            summary: `${p.category || "Research Project"} • Lead: ${p.lead || "Research Team"} • Status: ${p.status || "Active"} (${p.progress || 0}% progress)`,
            timestamp: p.updated_at || p.created_at,
            badge: p.category || "Research",
            badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
            linkAdmin: "/admin/projects",
            linkPublic: "/projects",
            actor: p.lead || "Society",
          });
        });
      }

      // 3. Event Posts
      if (eventsRes.data) {
        eventsRes.data.forEach((e) => {
          items.push({
            id: `event-${e.id}`,
            category: "events",
            eventType: "initial",
            title: `Event Post: ${e.title}`,
            summary: `Scheduled for ${format(new Date(e.date), "MMM d, yyyy")} • ${e.location || "CUET Campus"} (${e.type || "Workshop"})`,
            timestamp: e.created_at || e.updated_at,
            badge: e.type || (e.is_upcoming ? "Upcoming" : "Society Event"),
            badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
            linkAdmin: "/admin/events",
            linkPublic: "/events",
          });
        });
      }

      // 4. Event Attendee Signups
      if (registrationsRes.data) {
        registrationsRes.data.forEach((r) => {
          const eventTitle = r.events?.title || "Society Event";
          items.push({
            id: `reg-${r.id}`,
            category: "events",
            eventType: "initial",
            title: `New Registration: ${eventTitle}`,
            summary: `${r.name} registered for attendee access to "${eventTitle}".`,
            timestamp: r.created_at,
            badge: "Event Signup",
            badgeColor: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
            linkAdmin: "/admin/registrations",
            actor: r.name,
          });
        });
      }

      // Sort all activities chronologically descending
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(items.slice(0, limit));
      setLastEventTime(new Date());
      if (onActivityCountChange) onActivityCountChange(items.length);

      if (isManual) {
        toast.success("Activity feed refreshed", {
          description: "Latest updates loaded across all channels.",
        });
      }
    } catch (err) {
      console.error("Failed to load activity feed:", err);
      if (isManual) {
        toast.error("Failed to refresh activity feed");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [limit, onActivityCountChange]);

  useEffect(() => {
    fetchRecentActivities();
  }, [fetchRecentActivities]);

  // Real-time Supabase subscription across members, projects, events
  useEffect(() => {
    const channel = supabase
      .channel("admin_realtime_activity_stream")
      // 1. Members
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "membership_registrations" },
        (payload) => {
          const nowIso = new Date().toISOString();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const record = (payload.new as any) || (payload.old as any);
          if (!record) return;

          const isApproved = record.status === "approved";
          const newActivity: ActivityItem = {
            id: `member-${record.id}-${Date.now()}`,
            category: "members",
            eventType: payload.eventType === "INSERT" ? "insert" : "update",
            title: payload.eventType === "INSERT"
              ? `New Application: ${record.full_name || "Applicant"}`
              : isApproved 
              ? `Member Approved: ${record.full_name}`
              : `Member Updated: ${record.full_name}`,
            summary: isApproved
              ? `${record.full_name} (${record.student_id || "ID assigned"}) verified in ${record.department || "BME"}.`
              : `${record.full_name} submitted membership registration (${record.department || "BME"}).`,
            timestamp: nowIso,
            badge: isApproved ? "Member Verified" : "Application Pending",
            badgeColor: isApproved 
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" 
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
            isLive: true,
            linkAdmin: "/admin/membership",
            linkPublic: "/portal?tab=verify",
            actor: record.full_name,
          };

          setActivities((prev) => [newActivity, ...prev.filter(x => x.id !== newActivity.id)].slice(0, 30));
          setLastEventTime(new Date());

          toast.info("Live Member Update", {
            description: newActivity.title,
            duration: 3000,
          });
        }
      )
      // 2. Projects
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        (payload) => {
          const nowIso = new Date().toISOString();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const record = (payload.new as any) || (payload.old as any);
          if (!record) return;

          const newActivity: ActivityItem = {
            id: `project-${record.id}-${Date.now()}`,
            category: "projects",
            eventType: payload.eventType === "INSERT" ? "insert" : "update",
            title: payload.eventType === "INSERT"
              ? `New Project Posted: ${record.title}`
              : `Project Updated: ${record.title}`,
            summary: `${record.category || "Research"} • Lead: ${record.lead || "Team"} • Status: ${record.status} (${record.progress || 0}%)`,
            timestamp: nowIso,
            badge: record.category || "Research",
            badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
            isLive: true,
            linkAdmin: "/admin/projects",
            linkPublic: "/projects",
            actor: record.lead || "Society",
          };

          setActivities((prev) => [newActivity, ...prev.filter(x => x.id !== newActivity.id)].slice(0, 30));
          setLastEventTime(new Date());

          toast.info("Live Project Update", {
            description: newActivity.title,
            duration: 3000,
          });
        }
      )
      // 3. Events
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        (payload) => {
          const nowIso = new Date().toISOString();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const record = (payload.new as any) || (payload.old as any);
          if (!record) return;

          const newActivity: ActivityItem = {
            id: `event-${record.id}-${Date.now()}`,
            category: "events",
            eventType: payload.eventType === "INSERT" ? "insert" : "update",
            title: payload.eventType === "INSERT"
              ? `New Event Posted: ${record.title}`
              : `Event Updated: ${record.title}`,
            summary: `Scheduled: ${record.date ? format(new Date(record.date), "MMM d, yyyy") : "Date TBD"} • ${record.location || "CUET Campus"}`,
            timestamp: nowIso,
            badge: record.type || "Event",
            badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
            isLive: true,
            linkAdmin: "/admin/events",
            linkPublic: "/events",
          };

          setActivities((prev) => [newActivity, ...prev.filter(x => x.id !== newActivity.id)].slice(0, 30));
          setLastEventTime(new Date());

          toast.info("Live Event Update", {
            description: newActivity.title,
            duration: 3000,
          });
        }
      )
      // 4. Event registrations
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "event_registrations" },
        (payload) => {
          const nowIso = new Date().toISOString();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const record = payload.new as any;
          if (!record) return;

          const newActivity: ActivityItem = {
            id: `reg-${record.id}-${Date.now()}`,
            category: "events",
            eventType: "insert",
            title: `New Event Registration`,
            summary: `${record.name} submitted a registration entry for an event.`,
            timestamp: nowIso,
            badge: "Event Attendee",
            badgeColor: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
            isLive: true,
            linkAdmin: "/admin/registrations",
            actor: record.name,
          };

          setActivities((prev) => [newActivity, ...prev.filter(x => x.id !== newActivity.id)].slice(0, 30));
          setLastEventTime(new Date());
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setChannelConnected(true);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setChannelConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter & Search
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Category filter
      if (activeFilter !== "all" && act.category !== activeFilter) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          act.title.toLowerCase().includes(query) ||
          act.summary.toLowerCase().includes(query) ||
          act.badge.toLowerCase().includes(query) ||
          (act.actor && act.actor.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [activities, activeFilter, searchQuery]);

  // Count per category
  const counts = useMemo(() => {
    return {
      all: activities.length,
      members: activities.filter((a) => a.category === "members").length,
      projects: activities.filter((a) => a.category === "projects").length,
      events: activities.filter((a) => a.category === "events").length,
    };
  }, [activities]);

  const getCategoryIcon = (category: ActivityItem["category"]) => {
    switch (category) {
      case "members":
        return <Users className="h-4 w-4" />;
      case "projects":
        return <FolderOpen className="h-4 w-4" />;
      case "events":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const formatActivityTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
      if (diffMinutes < 1) return "Just now";
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  return (
    <Card className={`border-border shadow-xs overflow-hidden ${className}`}>
      {/* Header */}
      <CardHeader className="bg-muted/15 border-b pb-3.5 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <Radio className="h-4 w-4 text-primary animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-foreground">
                  Recent Activity Stream
                </CardTitle>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono px-2 py-0.5 flex items-center gap-1.5 ${
                    channelConnected
                      ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                      : "border-amber-500/30 text-amber-600 bg-amber-500/10"
                  }`}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  {channelConnected ? "Real-time Live" : "Reconnecting"}
                </Badge>
              </div>
              <CardDescription className="text-xs flex items-center gap-1.5 flex-wrap">
                <span>Live chronological updates across society members, research projects, and event posts.</span>
                <span className="hidden md:inline text-muted-foreground/60">•</span>
                <span className="text-[10px] text-muted-foreground font-mono hidden md:inline">
                  Last event: {format(lastEventTime, "hh:mm:ss a")}
                </span>
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRecentActivities(true)}
              disabled={isRefreshing || isLoading}
              className="h-8 text-xs font-medium gap-1.5 text-muted-foreground hover:text-foreground"
              title="Refresh Activity Feed"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 mt-1 border-t border-border/50">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <span>All</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeFilter === "all" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background text-muted-foreground"
              }`}>
                {counts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("members")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeFilter === "members"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Users className="h-3 w-3" />
              <span>Members</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeFilter === "members" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background text-muted-foreground"
              }`}>
                {counts.members}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("projects")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeFilter === "projects"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <FolderOpen className="h-3 w-3" />
              <span>Projects</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeFilter === "projects" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background text-muted-foreground"
              }`}>
                {counts.projects}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("events")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeFilter === "events"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Calendar className="h-3 w-3" />
              <span>Events</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeFilter === "events" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background text-muted-foreground"
              }`}>
                {counts.events}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stream..."
              className="h-7 text-xs pl-8 pr-2.5 bg-background border-border/80 rounded-md"
            />
          </div>
        </div>
      </CardHeader>

      {/* Feed List */}
      <CardContent className="p-0">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto text-primary" />
            <p>Connecting to real-time activity stream...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted-foreground space-y-1.5">
            <Filter className="h-6 w-6 mx-auto text-muted-foreground/40 mb-1" />
            <p className="font-semibold text-foreground">No recent activity matching your filter.</p>
            <p className="text-muted-foreground text-[11px]">
              {searchQuery ? "Try clearing your search query." : "Activities will appear here live as they occur."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60 max-h-[460px] overflow-y-auto">
            {filteredActivities.map((item) => (
              <div
                key={item.id}
                className={`group flex items-start justify-between gap-3 p-3.5 sm:px-4 text-xs hover:bg-muted/30 transition-all ${
                  item.isLive ? "bg-primary/5 animate-pulse" : ""
                }`}
              >
                {/* Left: Icon & Core Details */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Category icon avatar */}
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                    item.category === "members" 
                      ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25"
                      : item.category === "projects"
                      ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25"
                  }`}>
                    {getCategoryIcon(item.category)}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground text-xs leading-tight">
                        {item.title}
                      </span>

                      {/* Badge */}
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium px-1.5 py-0 border ${
                          item.badgeColor || "border-border text-muted-foreground"
                        }`}
                      >
                        {item.badge}
                      </Badge>

                      {item.isLive && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500 text-white px-1.5 py-0.2 rounded-full">
                          LIVE
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {item.summary}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatActivityTime(item.timestamp)}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{item.category}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2.5 text-primary hover:text-primary hover:bg-primary/10 font-medium"
                  >
                    <Link to={item.linkAdmin}>
                      <span>Manage</span>
                      <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                    </Link>
                  </Button>

                  {item.linkPublic && (
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hidden sm:inline-flex"
                      title="View on Public Website"
                    >
                      <Link to={item.linkPublic} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivityFeed;
