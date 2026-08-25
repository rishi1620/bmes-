import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Inbox,
  CalendarDays,
  Users,
  CheckCheck,
  Volume2,
  VolumeX,
  Radio,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { useRealtimeNotifications, AdminRealtimeNotification } from "@/context/RealtimeNotificationContext";
import { cn } from "@/lib/utils";

const AdminNotifications = () => {
  const {
    notifications,
    unreadCount,
    isConnected,
    soundEnabled,
    toggleSound,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
    sendTestAlert,
  } = useRealtimeNotifications();

  const [activeFilter, setActiveFilter] = useState<"all" | "membership" | "submission" | "registration">("all");
  const navigate = useNavigate();

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === "all") return true;
    return item.type === activeFilter;
  });

  const getIconForType = (type: AdminRealtimeNotification["type"]) => {
    switch (type) {
      case "membership":
        return <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case "submission":
        return <Inbox className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case "registration":
        return <CalendarDays className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
    }
  };

  const getBadgeClassForType = (type: AdminRealtimeNotification["type"]) => {
    switch (type) {
      case "membership":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300";
      case "submission":
        return "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300";
      case "registration":
        return "bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300";
      default:
        return "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full hover:bg-muted/80 transition-colors"
          aria-label="Admin Notifications"
        >
          <Bell className="h-5 w-5 text-foreground/80" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground shadow-sm">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          {/* Real-time Connection Dot */}
          <span
            className={cn(
              "absolute bottom-1 right-1 h-2 w-2 rounded-full border border-background transition-colors",
              isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            )}
            title={isConnected ? "Real-time Live Monitoring Active" : "Connecting to Real-time Hub..."}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-0 shadow-xl border-border/80 rounded-xl overflow-hidden">
        {/* Header with Title, Live Status, and Sound Toggle */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground">Live Alerts</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              <Radio className="h-2.5 w-2.5 animate-pulse" />
              <span>{isConnected ? "Live" : "Connecting"}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={toggleSound}
              title={soundEnabled ? "Mute notification sounds" : "Enable notification sounds"}
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5 text-muted-foreground/50" />}
            </Button>

            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={markAllAsRead}
                title="Mark all as read"
              >
                <CheckCheck className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 px-3 py-2 bg-background border-b border-border/40 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveFilter("all")}
            className={cn(
              "px-2.5 py-1 rounded-md transition-colors font-medium whitespace-nowrap",
              activeFilter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setActiveFilter("membership")}
            className={cn(
              "px-2.5 py-1 rounded-md transition-colors font-medium whitespace-nowrap",
              activeFilter === "membership" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            Memberships
          </button>
          <button
            onClick={() => setActiveFilter("submission")}
            className={cn(
              "px-2.5 py-1 rounded-md transition-colors font-medium whitespace-nowrap",
              activeFilter === "submission" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            Inquiries
          </button>
          <button
            onClick={() => setActiveFilter("registration")}
            className={cn(
              "px-2.5 py-1 rounded-md transition-colors font-medium whitespace-nowrap",
              activeFilter === "registration" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            Events
          </button>
        </div>

        {/* Notification Items List */}
        <div className="max-h-[340px] overflow-y-auto divide-y divide-border/40">
          {filteredNotifications.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <div className="h-10 w-10 mx-auto mb-2 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                <Bell className="h-5 w-5 opacity-40" />
              </div>
              <p className="text-sm font-medium text-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                New membership requests or contact forms will pop up here instantly.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-xs h-7 gap-1"
                onClick={() => sendTestAlert("membership")}
              >
                <Sparkles className="h-3 w-3 text-amber-500" />
                Trigger Live Test Alert
              </Button>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  markAsRead(item.id);
                  navigate(item.link);
                }}
                className={cn(
                  "group relative flex items-start gap-3 p-3 text-left transition-colors cursor-pointer hover:bg-muted/60",
                  !item.isRead ? "bg-primary/[0.03]" : "opacity-85"
                )}
              >
                {!item.isRead && (
                  <span className="absolute left-1.5 top-4 h-1.5 w-1.5 rounded-full bg-primary" />
                )}

                <div
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                    getBadgeClassForType(item.type)
                  )}
                >
                  {getIconForType(item.type)}
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-semibold leading-none truncate",
                        !item.isRead ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {item.title}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground/70">
                    <span>
                      {formatDistanceToNow(new Date(item.date), {
                        addSuffix: true,
                      })}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{item.type}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearNotification(item.id);
                  }}
                  className="absolute top-2.5 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
                  title="Dismiss notification"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between p-2.5 bg-muted/30 border-t border-border/60 text-xs">
            <button
              onClick={clearAll}
              className="text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              Clear all
            </button>
            <div className="flex items-center gap-3">
              <Link
                to="/admin/membership"
                className="text-primary font-medium hover:underline px-1"
              >
                Memberships
              </Link>
              <Link
                to="/admin/submissions"
                className="text-primary font-medium hover:underline px-1"
              >
                Inquiries
              </Link>
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AdminNotifications;
