import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { soundService } from "@/lib/notificationSound";
import { getAdminBroadcastChannel, notifyAdmins } from "@/lib/realtimeBroadcast";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export interface AdminRealtimeNotification {
  id: string;
  type: "membership" | "submission" | "registration" | "system";
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  date: string;
  link: string;
  isRead: boolean;
}

interface RealtimeNotificationContextType {
  notifications: AdminRealtimeNotification[];
  unreadCount: number;
  isConnected: boolean;
  soundEnabled: boolean;
  toggleSound: () => boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
  refresh: () => Promise<void>;
  sendTestAlert: (type?: "membership" | "submission" | "registration") => Promise<void>;
}

const RealtimeNotificationContext = createContext<RealtimeNotificationContextType | undefined>(undefined);

const READ_STORAGE_KEY = "bmes_admin_read_notifs_v1";

function getStoredReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {
    // fallback
  }
  return new Set();
}

function saveStoredReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(ids).slice(-200)));
  } catch {
    // ignore
  }
}

export const RealtimeNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AdminRealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(soundService.isEnabled());
  const processedIds = useRef<Set<string>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const navigate = useNavigate();

  // Helper to get link from type
  const getLinkForType = useCallback((type: string) => {
    switch (type) {
      case "membership":
        return "/admin/membership";
      case "submission":
        return "/admin/submissions";
      case "registration":
        return "/admin/registrations";
      default:
        return "/admin";
    }
  }, []);

  // Fetch initial notifications from database & server
  const refresh = useCallback(async () => {
    try {
      const readIds = getStoredReadIds();

      // 1. Fetch unread contact submissions
      const { data: submissions } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      // 2. Fetch recent membership applications
      const { data: memberships } = await supabase
        .from("membership_registrations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      // 3. Fetch recent event registrations
      const { data: registrations } = await supabase
        .from("event_registrations")
        .select("*, events(title)")
        .order("created_at", { ascending: false })
        .limit(10);

      const items: AdminRealtimeNotification[] = [];

      if (memberships) {
        memberships.forEach((mem) => {
          const id = `mem-${mem.id}`;
          processedIds.current.add(id);
          const isRead = mem.status !== "pending" || readIds.has(id);
          items.push({
            id,
            type: "membership",
            title: "New Membership Application",
            description: `${mem.full_name || "Applicant"} (${mem.email || "No email"}) • ${mem.department || "BME"}`,
            date: mem.created_at || new Date().toISOString(),
            link: "/admin/membership",
            isRead,
            metadata: mem,
          });
        });
      }

      if (submissions) {
        submissions.forEach((sub) => {
          const id = `sub-${sub.id}`;
          processedIds.current.add(id);
          const isRead = sub.is_read || readIds.has(id);
          items.push({
            id,
            type: "submission",
            title: "New Contact Submission",
            description: `From ${sub.name || "User"} (${sub.email}) • "${sub.subject || "No subject"}"`,
            date: sub.created_at || new Date().toISOString(),
            link: "/admin/submissions",
            isRead,
            metadata: sub,
          });
        });
      }

      if (registrations) {
        registrations.forEach((reg) => {
          const id = `reg-${reg.id}`;
          processedIds.current.add(id);
          const isRead = readIds.has(id);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const eventTitle = (reg.events as any)?.title || "Upcoming Event";
          items.push({
            id,
            type: "registration",
            title: "New Event Registration",
            description: `${reg.name || "Participant"} (${reg.email}) registered for ${eventTitle}`,
            date: reg.created_at || new Date().toISOString(),
            link: "/admin/registrations",
            isRead,
            metadata: reg,
          });
        });
      }

      // Sort descending
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setNotifications(items);
      setUnreadCount(items.filter((item) => !item.isRead).length);
    } catch (err) {
      console.error("Error refreshing realtime notifications:", err);
    }
  }, []);

  // Handle incoming live alert
  const handleIncomingNotification = useCallback(
    (notif: {
      id?: string;
      type: "membership" | "submission" | "registration" | "system";
      title: string;
      description: string;
      metadata?: Record<string, unknown>;
      createdAt?: string;
      date?: string;
    }, isNewLiveEvent = true) => {
      const id = notif.id || `notif-${Date.now()}`;
      
      // Prevent duplicate processing
      if (processedIds.current.has(id) && !isNewLiveEvent) {
        return;
      }
      processedIds.current.add(id);

      const newItem: AdminRealtimeNotification = {
        id,
        type: notif.type,
        title: notif.title,
        description: notif.description,
        metadata: notif.metadata || {},
        date: notif.date || notif.createdAt || new Date().toISOString(),
        link: getLinkForType(notif.type),
        isRead: false,
      };

      setNotifications((prev) => {
        const filtered = prev.filter((p) => p.id !== id);
        return [newItem, ...filtered].slice(0, 30);
      });

      setUnreadCount((prev) => prev + 1);

      // Play audio chime and trigger rich toast for live new events
      if (isNewLiveEvent) {
        soundService.playChime(notif.type);

        const actionText =
          notif.type === "membership"
            ? "Review Application"
            : notif.type === "submission"
            ? "View Message"
            : "View Registrations";

        toast(notif.title, {
          description: notif.description,
          action: {
            label: actionText,
            onClick: () => navigate(newItem.link),
          },
          duration: 7000,
        });

        // Trigger custom UI event so dashboard counts reload
        window.dispatchEvent(new CustomEvent("bmes:data-updated", { detail: { type: notif.type } }));
      }
    },
    [getLinkForType, navigate]
  );

  // Setup WebSocket connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let isUnmounted = false;
    let retryDelay = 4000;

    const connectWs = () => {
      if (isUnmounted) return;
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;

        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isUnmounted) return;
          setIsConnected(true);
          retryDelay = 4000;
        };

        ws.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "NOTIFICATION" && msg.data) {
              handleIncomingNotification(msg.data, true);
            }
          } catch {
            // ignore
          }
        };

        ws.onclose = () => {
          if (isUnmounted) return;
          setIsConnected(false);
          reconnectTimer = setTimeout(connectWs, retryDelay);
          retryDelay = Math.min(30000, retryDelay * 1.5);
        };

        ws.onerror = () => {
          if (isUnmounted) return;
          setIsConnected(false);
        };
      } catch {
        if (!isUnmounted) {
          setIsConnected(false);
        }
      }
    };

    connectWs();

    return () => {
      isUnmounted = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (ws) {
        try {
          ws.close();
        } catch {
          // ignore
        }
      }
    };
  }, [handleIncomingNotification]);

  // Setup Supabase Realtime Channels
  useEffect(() => {
    refresh();

    const memChannel = supabase
      .channel("realtime-membership-admin")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "membership_registrations" },
        (payload) => {
          const rec = payload.new as { id: string; full_name?: string; email?: string; department?: string; created_at?: string };
          handleIncomingNotification(
            {
              id: `mem-${rec.id}`,
              type: "membership",
              title: "New Membership Application Received",
              description: `${rec.full_name || "Applicant"} (${rec.email || "No email"}) submitted a registration.`,
              date: rec.created_at,
              metadata: rec,
            },
            true
          );
        }
      )
      .subscribe();

    const subChannel = supabase
      .channel("realtime-submissions-admin")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "contact_submissions" },
        (payload) => {
          const rec = payload.new as { id: string; name?: string; email?: string; subject?: string; created_at?: string };
          handleIncomingNotification(
            {
              id: `sub-${rec.id}`,
              type: "submission",
              title: "New Contact Message Received",
              description: `From ${rec.name || "Visitor"} (${rec.email}): "${rec.subject || "Message"}"`,
              date: rec.created_at,
              metadata: rec,
            },
            true
          );
        }
      )
      .subscribe();

    const regChannel = supabase
      .channel("realtime-event-reg-admin")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "event_registrations" },
        (payload) => {
          const rec = payload.new as { id: string; name?: string; email?: string; created_at?: string };
          handleIncomingNotification(
            {
              id: `reg-${rec.id}`,
              type: "registration",
              title: "New Event Registration",
              description: `${rec.name || "Participant"} registered for an event.`,
              date: rec.created_at,
              metadata: rec,
            },
            true
          );
        }
      )
      .subscribe();

    // BroadcastChannel listener
    const bc = getAdminBroadcastChannel();
    const handleBcMessage = (event: MessageEvent) => {
      if (event.data?.type === "ADMIN_NOTIFICATION" && event.data.data) {
        handleIncomingNotification(event.data.data, true);
      }
    };
    if (bc) {
      bc.addEventListener("message", handleBcMessage);
    }

    // In-window custom event listener
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        handleIncomingNotification(customEvent.detail, true);
      }
    };
    window.addEventListener("bmes:admin-notification", handleCustomEvent);

    return () => {
      supabase.removeChannel(memChannel);
      supabase.removeChannel(subChannel);
      supabase.removeChannel(regChannel);
      if (bc) {
        bc.removeEventListener("message", handleBcMessage);
      }
      window.removeEventListener("bmes:admin-notification", handleCustomEvent);
    };
  }, [refresh, handleIncomingNotification]);

  const toggleSound = useCallback(() => {
    const next = soundService.toggleSound();
    setSoundEnabled(next);
    toast.info(next ? "Notification sounds enabled" : "Notification sounds muted");
    return next;
  }, []);

  const markAsRead = useCallback((id: string) => {
    const readIds = getStoredReadIds();
    readIds.add(id);
    saveStoredReadIds(readIds);

    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    const readIds = getStoredReadIds();
    notifications.forEach((item) => readIds.add(item.id));
    saveStoredReadIds(readIds);

    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    toast.success("All notifications marked as read");
  }, [notifications]);

  const clearNotification = useCallback((id: string) => {
    const readIds = getStoredReadIds();
    readIds.add(id);
    saveStoredReadIds(readIds);

    setNotifications((prev) => prev.filter((item) => item.id !== id));
    setUnreadCount((prev) => {
      const item = notifications.find((n) => n.id === id);
      return item && !item.isRead ? Math.max(0, prev - 1) : prev;
    });
  }, [notifications]);

  const clearAll = useCallback(() => {
    const readIds = getStoredReadIds();
    notifications.forEach((item) => readIds.add(item.id));
    saveStoredReadIds(readIds);

    setNotifications([]);
    setUnreadCount(0);
    toast.info("Notifications cleared");
  }, [notifications]);

  const sendTestAlert = useCallback(async (type: "membership" | "submission" | "registration" = "membership") => {
    let title = "New Membership Application (Live Test)";
    let description = "Afif Rahman (1908001) submitted a membership registration for BME Dept.";

    if (type === "submission") {
      title = "New Contact Submission (Live Test)";
      description = "Dr. Tanvir Ahmed (tanvir@cuet.ac.bd): 'Inquiry regarding biomedical symposium keynote'";
    } else if (type === "registration") {
      title = "New Event Registration (Live Test)";
      description = "Nusrat Jahan registered for 'Annual Biomedical Engineering Symposium 2026'";
    }

    await notifyAdmins({
      id: `test-${Date.now()}`,
      type,
      title,
      description,
      metadata: { isTest: true },
    });
  }, []);

  return (
    <RealtimeNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        soundEnabled,
        toggleSound,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll,
        refresh,
        sendTestAlert,
      }}
    >
      {children}
    </RealtimeNotificationContext.Provider>
  );
};

export const useRealtimeNotifications = () => {
  const context = useContext(RealtimeNotificationContext);
  if (!context) {
    throw new Error("useRealtimeNotifications must be used within a RealtimeNotificationProvider");
  }
  return context;
};
