import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Inbox, CalendarDays, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

interface NotificationItem {
  id: string;
  type: "submission" | "registration" | "membership";
  title: string;
  description: string;
  date: string;
  link: string;
  isRead: boolean;
}

interface EventRegistration {
  id: string;
  name?: string;
  full_name?: string;
  email: string;
  created_at: string;
  events?: {
    title: string;
  };
}

interface MembershipRegistration {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      // Fetch unread contact submissions
      const { data: submissions, count: subCount } = await supabase
        .from("contact_submissions")
        .select("*", { count: 'exact' })
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch recent event registrations (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: registrations, count: regCount } = await supabase
        .from("event_registrations")
        .select("*, events(title)", { count: 'exact' })
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch recent membership registrations (last 7 days)
      const { data: memberships, count: memCount } = await supabase
        .from("membership_registrations")
        .select("*", { count: 'exact' })
        .eq("status", "pending")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(5);

      const items: NotificationItem[] = [];

      if (submissions) {
        submissions.forEach((sub) => {
          items.push({
            id: `sub-${sub.id}`,
            type: "submission",
            title: "New Contact Submission",
            description: `From ${sub.name} (${sub.email})`,
            date: sub.created_at,
            link: "/admin/submissions",
            isRead: sub.is_read,
          });
        });
      }

      if (registrations) {
        (registrations as unknown as EventRegistration[]).forEach((reg) => {
          items.push({
            id: `reg-${reg.id}`,
            type: "registration",
            title: "New Event Registration",
            description: `${reg.name || reg.full_name} registered for ${reg.events?.title || "an event"}`,
            date: reg.created_at,
            link: "/admin/registrations",
            isRead: false,
          });
        });
      }

      if (memberships) {
        (memberships as unknown as MembershipRegistration[]).forEach((mem) => {
          items.push({
            id: `mem-${mem.id}`,
            type: "membership",
            title: "New Membership Application",
            description: `From ${mem.full_name} (${mem.email})`,
            date: mem.created_at,
            link: "/admin/membership",
            isRead: false,
          });
        });
      }

      // Sort by date descending
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setNotifications(items.slice(0, 10)); // Keep top 10 in dropdown
      setUnreadCount((subCount || 0) + (regCount || 0) + (memCount || 0));
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time subscriptions for both INSERT and UPDATE
    const subChannel = supabase.channel('submissions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_submissions' }, fetchNotifications)
      .subscribe();
      
    const regChannel = supabase.channel('registrations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_registrations' }, fetchNotifications)
      .subscribe();

    const memChannel = supabase.channel('membership-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'membership_registrations' }, fetchNotifications)
      .subscribe();

    return () => {
      supabase.removeChannel(subChannel);
      supabase.removeChannel(regChannel);
      supabase.removeChannel(memChannel);
    };
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          ) : (
            notifications.map((item) => (
              <DropdownMenuItem key={item.id} asChild className="cursor-pointer p-3 focus:bg-muted">
                <Link to={item.link} className="flex gap-3 items-start w-full">
                  <div className={`mt-0.5 rounded-full p-1.5 ${
                    item.type === 'submission' ? 'bg-blue-100 text-blue-600' : 
                    item.type === 'registration' ? 'bg-green-100 text-green-600' : 
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {item.type === 'submission' ? <Inbox className="h-3.5 w-3.5" /> : 
                     item.type === 'registration' ? <CalendarDays className="h-3.5 w-3.5" /> : 
                     <Users className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex flex-col gap-1 overflow-hidden">
                    <span className="text-sm font-medium leading-none">{item.title}</span>
                    <span className="text-xs text-muted-foreground truncate">{item.description}</span>
                    <span className="text-[10px] text-muted-foreground/70">
                      {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                    </span>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </div>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="w-full text-center cursor-pointer justify-center text-primary">
              <Link to="/admin/submissions">View all submissions</Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AdminNotifications;
