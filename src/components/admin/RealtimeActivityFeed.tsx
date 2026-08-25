import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Users,
  Inbox,
  CalendarDays,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, format } from "date-fns";
import { useRealtimeNotifications, AdminRealtimeNotification } from "@/context/RealtimeNotificationContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const RealtimeActivityFeed = () => {
  const {
    notifications,
    isConnected,
    soundEnabled,
    toggleSound,
    markAsRead,
    sendTestAlert,
  } = useRealtimeNotifications();

  const [selectedFilter, setSelectedFilter] = useState<"all" | "membership" | "submission" | "registration">("all");

  const filteredItems = notifications.filter((item) => {
    if (selectedFilter === "all") return true;
    return item.type === selectedFilter;
  });

  const getIcon = (type: AdminRealtimeNotification["type"]) => {
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

  const getTagBadge = (type: AdminRealtimeNotification["type"]) => {
    switch (type) {
      case "membership":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
            Membership Application
          </span>
        );
      case "submission":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
            Contact Form
          </span>
        );
      case "registration":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
            Event Registration
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground">
            Alert
          </span>
        );
    }
  };

  return (
    <Card className="border-border/80 shadow-sm overflow-hidden bg-card/60 backdrop-blur-sm">
      <CardHeader className="p-5 pb-3 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-foreground">
                  Real-Time Live Activity & Alerts
                </CardTitle>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{isConnected ? "Live Stream Active" : "Connecting"}</span>
                </div>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Instant alerts for incoming student membership applications and contact form submissions.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSound}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              title={soundEnabled ? "Mute notification sounds" : "Enable notification sounds"}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-primary" />
                  <span className="hidden sm:inline">Chime On</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-muted-foreground/60" />
                  <span className="hidden sm:inline">Muted</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => sendTestAlert("membership")}
              className="h-8 gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Simulate Alert</span>
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto">
          <button
            onClick={() => setSelectedFilter("all")}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
              selectedFilter === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            All Activity ({notifications.length})
          </button>
          <button
            onClick={() => setSelectedFilter("membership")}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
              selectedFilter === "membership"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Memberships ({notifications.filter((n) => n.type === "membership").length})
          </button>
          <button
            onClick={() => setSelectedFilter("submission")}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
              selectedFilter === "submission"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Contact Inquiries ({notifications.filter((n) => n.type === "submission").length})
          </button>
          <button
            onClick={() => setSelectedFilter("registration")}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
              selectedFilter === "registration"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Event Registrations ({notifications.filter((n) => n.type === "registration").length})
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredItems.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
              <CheckCircle2 className="h-6 w-6 text-emerald-500/80" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">No recent alerts in this category</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              When students register or send messages through the public portal, notifications will stream here live.
            </p>
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 gap-1.5"
                onClick={() => sendTestAlert("submission")}
              >
                <Sparkles className="h-3 w-3 text-blue-500" />
                Test Contact Form Alert
              </Button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            <AnimatePresence initial={false}>
              {filteredItems.slice(0, 8).map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 transition-colors hover:bg-muted/30",
                    !item.isRead ? "bg-primary/[0.02]" : ""
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={cn(
                        "mt-0.5 h-9 w-9 shrink-0 rounded-lg flex items-center justify-center border",
                        item.type === "membership"
                          ? "bg-emerald-500/10 border-emerald-500/20"
                          : item.type === "submission"
                          ? "bg-blue-500/10 border-blue-500/20"
                          : "bg-purple-500/10 border-purple-500/20"
                      )}
                    >
                      {getIcon(item.type)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {item.title}
                        </span>
                        {getTagBadge(item.type)}
                        {!item.isRead && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-primary text-primary-foreground">
                            NEW
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {item.description}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground/70">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(item.date), {
                            addSuffix: true,
                          })}
                        </span>
                        <span>•</span>
                        <span>{format(new Date(item.date), "MMM d, h:mm a")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 sm:self-center pl-12 sm:pl-0">
                    {!item.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => markAsRead(item.id)}
                      >
                        Mark read
                      </Button>
                    )}
                    <Button
                      asChild
                      variant={!item.isRead ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      onClick={() => markAsRead(item.id)}
                    >
                      <Link to={item.link}>
                        <span>{item.type === "membership" ? "Review" : item.type === "submission" ? "Reply" : "View"}</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className="p-3 bg-muted/20 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing latest {Math.min(filteredItems.length, 8)} of {filteredItems.length} alerts
          </span>
          <div className="flex items-center gap-3">
            <Link to="/admin/membership" className="text-primary hover:underline font-medium">
              All Applications →
            </Link>
            <Link to="/admin/submissions" className="text-primary hover:underline font-medium">
              All Inquiries →
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
