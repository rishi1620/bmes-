import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Zap, 
  Calendar, 
  Bell, 
  Mail, 
  Users, 
  FileText, 
  Trophy, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  MapPin, 
  Image,
  Loader2,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AdminQuickActionsProps {
  variant?: "dropdown" | "grid" | "bar";
  className?: string;
  onActionSuccess?: () => void;
}

export interface QuickEventData {
  title: string;
  type: string;
  date: string;
  location: string;
  description: string;
  is_upcoming: boolean;
}

export interface QuickNoticeData {
  title: string;
  category: "departmental" | "club";
  date: string;
  content: string;
  pdf_url?: string;
}

export default function AdminQuickActions({ 
  variant = "dropdown", 
  className,
  onActionSuccess 
}: AdminQuickActionsProps) {
  const navigate = useNavigate();
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);

  // Quick Event form state
  const [eventForm, setEventForm] = useState<QuickEventData>({
    title: "",
    type: "workshop",
    date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16), // 3 days ahead
    location: "CUET Campus",
    description: "",
    is_upcoming: true,
  });
  const [submittingEvent, setSubmittingEvent] = useState(false);

  // Quick Notice form state
  const [noticeForm, setNoticeForm] = useState<QuickNoticeData>({
    title: "",
    category: "departmental",
    date: new Date().toISOString().split("T")[0],
    content: "",
    pdf_url: "",
  });
  const [submittingNotice, setSubmittingNotice] = useState(false);

  // Handler: Submit Event directly
  const handleCreateEvent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!eventForm.title.trim()) {
      toast.error("Event title is required");
      return;
    }

    setSubmittingEvent(true);
    try {
      const { error } = await supabase.from("events").insert({
        title: eventForm.title.trim(),
        type: eventForm.type,
        date: eventForm.date ? new Date(eventForm.date).toISOString() : new Date().toISOString(),
        location: eventForm.location.trim() || "CUET Campus",
        description: eventForm.description.trim() || null,
        is_upcoming: eventForm.is_upcoming,
      });

      if (error) throw error;

      toast.success("Event created successfully!", {
        description: `"${eventForm.title}" is now recorded in the schedule.`,
        action: {
          label: "View Events",
          onClick: () => navigate("/admin/events"),
        },
      });

      setEventForm({
        title: "",
        type: "workshop",
        date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
        location: "CUET Campus",
        description: "",
        is_upcoming: true,
      });
      setEventModalOpen(false);
      onActionSuccess?.();
    } catch (err: unknown) {
      console.error("Error adding quick event:", err);
      toast.error("Failed to create event", {
        description: err instanceof Error ? err.message : "Database error occurred",
      });
    } finally {
      setSubmittingEvent(false);
    }
  };

  // Handler: Submit Notice directly
  const handlePublishNotice = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!noticeForm.title.trim()) {
      toast.error("Notice title is required");
      return;
    }

    setSubmittingNotice(true);
    try {
      // 1. Fetch current portal_notices_json from site_settings
      const { data: settingRow, error: fetchErr } = await supabase
        .from("site_settings")
        .select("id, setting_value")
        .eq("setting_key", "portal_notices_json")
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      let currentList: QuickNoticeData[] = [];
      if (settingRow?.setting_value) {
        try {
          currentList = JSON.parse(settingRow.setting_value);
        } catch {
          currentList = [];
        }
      }

      const newNotice = {
        id: `notice-${Date.now()}`,
        title: noticeForm.title.trim(),
        category: noticeForm.category,
        date: noticeForm.date || new Date().toISOString().split("T")[0],
        content: noticeForm.content.trim(),
        pdf_url: noticeForm.pdf_url?.trim() || undefined,
      };

      const updatedList = [newNotice, ...currentList];

      // 2. Save back to site_settings
      if (settingRow) {
        const { error: updateErr } = await supabase
          .from("site_settings")
          .update({ setting_value: JSON.stringify(updatedList) })
          .eq("id", settingRow.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from("site_settings")
          .insert({
            setting_group: "portal_page",
            setting_key: "portal_notices_json",
            setting_value: JSON.stringify(updatedList),
          });
        if (insertErr) throw insertErr;
      }

      toast.success("Notice published live to portal!", {
        description: `"${noticeForm.title}" is visible on the student portal notice board.`,
        action: {
          label: "View Portal",
          onClick: () => navigate("/portal"),
        },
      });

      setNoticeForm({
        title: "",
        category: "departmental",
        date: new Date().toISOString().split("T")[0],
        content: "",
        pdf_url: "",
      });
      setNoticeModalOpen(false);
      onActionSuccess?.();
    } catch (err: unknown) {
      console.error("Error publishing notice:", err);
      toast.error("Failed to publish notice", {
        description: err instanceof Error ? err.message : "Database error occurred",
      });
    } finally {
      setSubmittingNotice(false);
    }
  };

  const quickActionItems = [
    {
      id: "add-event",
      label: "Add New Event",
      description: "Schedule a workshop, seminar, or competition",
      icon: Calendar,
      accent: "text-primary bg-primary/10 border-primary/20",
      badge: "Events",
      badgeClass: "bg-primary/10 text-primary border-primary/30",
      onClick: () => setEventModalOpen(true),
    },
    {
      id: "publish-notice",
      label: "Publish Notice",
      description: "Post live announcement to student portal",
      icon: Bell,
      accent: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
      badge: "Notice Board",
      badgeClass: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
      onClick: () => setNoticeModalOpen(true),
    },
    {
      id: "send-email",
      label: "Send Mass Email",
      description: "Broadcast message to all members, EC, or applicants",
      icon: Mail,
      accent: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
      badge: "Communication",
      badgeClass: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30",
      onClick: () => navigate("/admin/bulk-email"),
    },
    {
      id: "review-members",
      label: "Review Member Applications",
      description: "Approve pending registrations and issue IDs",
      icon: Users,
      accent: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
      badge: "Registry",
      badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
      onClick: () => navigate("/admin/membership"),
    },
    {
      id: "write-blog",
      label: "Write Blog Article",
      description: "Publish research spotlight or society news story",
      icon: FileText,
      accent: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
      badge: "Editorial",
      badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
      onClick: () => navigate("/admin/blog?new=true"),
    },
    {
      id: "add-achievement",
      label: "Record Achievement",
      description: "Highlight competition award or member honor",
      icon: Trophy,
      accent: "text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
      badge: "Awards",
      badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
      onClick: () => navigate("/admin/achievements?new=true"),
    },
  ];

  return (
    <>
      {/* VARIANT 1: Dropdown Menu Trigger (Great for headers & toolbars) */}
      {variant === "dropdown" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              className={cn(
                "relative gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary text-primary-foreground shadow-sm transition-all duration-200",
                className
              )}
              size="sm"
            >
              <Zap className="h-4 w-4 fill-primary-foreground/20" />
              <span>Quick Actions</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-80" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-72 p-1.5 shadow-xl border-border bg-popover/95 backdrop-blur-md rounded-xl"
          >
            <DropdownMenuLabel className="px-2.5 py-1.5 flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Common Society Tasks
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">Fast Access</Badge>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator className="my-1 opacity-60" />

            <DropdownMenuGroup>
              <DropdownMenuItem 
                onClick={() => setEventModalOpen(true)}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent/70 transition-colors"
              >
                <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground">Add New Event</div>
                  <div className="text-[11px] text-muted-foreground truncate">Schedule workshop, seminar, contest</div>
                </div>
                <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => setNoticeModalOpen(true)}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent/70 transition-colors"
              >
                <div className="h-8 w-8 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground">Publish Notice</div>
                  <div className="text-[11px] text-muted-foreground truncate">Post announcement to student portal</div>
                </div>
                <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => navigate("/admin/bulk-email")}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent/70 transition-colors"
              >
                <div className="h-8 w-8 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground">Send Mass Email</div>
                  <div className="text-[11px] text-muted-foreground truncate">Broadcast to members, EC, applicants</div>
                </div>
                <Send className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-1 opacity-60" />

            <DropdownMenuGroup>
              <DropdownMenuItem 
                onClick={() => navigate("/admin/membership")}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent/70 transition-colors"
              >
                <div className="h-7 w-7 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Users className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground">Review Member Applications</div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => navigate("/admin/blog?new=true")}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent/70 transition-colors"
              >
                <div className="h-7 w-7 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground">Write Blog Article</div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => navigate("/admin/achievements?new=true")}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent/70 transition-colors"
              >
                <div className="h-7 w-7 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Trophy className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground">Record Achievement</div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => navigate("/admin/media")}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent/70 transition-colors"
              >
                <div className="h-7 w-7 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <Image className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground">Upload Media Files</div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* VARIANT 2: Dashboard Grid / Bento Section */}
      {variant === "grid" && (
        <div className={cn("space-y-3.5", className)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <Zap className="h-4 w-4 fill-primary/20" />
              </div>
              <h2 className="text-base font-bold text-foreground tracking-tight">Quick Actions</h2>
              <Badge variant="secondary" className="text-[11px] font-normal px-2 py-0">
                Frequently Used
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Instant shortcuts to essential admin workflows
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {quickActionItems.map((item) => {
              const Icon = item.icon;
              return (
                <Card 
                  key={item.id}
                  onClick={item.onClick}
                  className="group relative cursor-pointer border-border hover:border-primary/40 bg-card hover:bg-accent/30 transition-all duration-200 shadow-2xs hover:shadow-sm overflow-hidden"
                >
                  <CardContent className="p-3.5 flex items-start gap-3.5">
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105",
                      item.accent
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {item.label}
                        </span>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0", item.badgeClass)}>
                          {item.badge}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* VARIANT 3: Bar / Banner Strip */}
      {variant === "bar" && (
        <div className={cn(
          "flex flex-wrap items-center gap-2 p-2 rounded-xl bg-card border border-border shadow-2xs",
          className
        )}>
          <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-muted-foreground shrink-0">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span>Fast Tasks:</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setEventModalOpen(true)}
            className="h-8 text-xs gap-1.5 border-primary/30 hover:bg-primary/10 hover:text-primary"
          >
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>New Event</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setNoticeModalOpen(true)}
            className="h-8 text-xs gap-1.5 border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
          >
            <Bell className="h-3.5 w-3.5 text-cyan-600" />
            <span>Publish Notice</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/admin/bulk-email")}
            className="h-8 text-xs gap-1.5 border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400"
          >
            <Mail className="h-3.5 w-3.5 text-purple-600" />
            <span>Mass Email</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/admin/membership")}
            className="h-8 text-xs gap-1.5 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400"
          >
            <Users className="h-3.5 w-3.5 text-amber-600" />
            <span>Pending Members</span>
          </Button>
        </div>
      )}

      {/* MODAL 1: Quick Add Event Dialog */}
      <Dialog open={eventModalOpen} onOpenChange={setEventModalOpen}>
        <DialogContent className="sm:max-w-[520px] p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Add New Society Event</DialogTitle>
                <DialogDescription className="text-xs">
                  Schedule a workshop, contest, or seminar. Shows immediately on public calendar.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateEvent} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="quick-event-title" className="text-xs font-semibold">
                Event Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quick-event-title"
                placeholder="e.g., Hands-on Biomedical Signal Processing Workshop"
                value={eventForm.title}
                onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="quick-event-type" className="text-xs font-semibold">Event Type</Label>
                <Select
                  value={eventForm.type}
                  onValueChange={(val) => setEventForm(prev => ({ ...prev, type: val }))}
                >
                  <SelectTrigger id="quick-event-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="seminar">Seminar</SelectItem>
                    <SelectItem value="competition">Competition / Contest</SelectItem>
                    <SelectItem value="meetup">Meetup / Gathering</SelectItem>
                    <SelectItem value="conference">Conference</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quick-event-date" className="text-xs font-semibold">Date & Time</Label>
                <Input
                  id="quick-event-date"
                  type="datetime-local"
                  value={eventForm.date}
                  onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quick-event-location" className="text-xs font-semibold flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Location / Venue
              </Label>
              <Input
                id="quick-event-location"
                placeholder="e.g., EEE Seminar Hall / Zoom Virtual"
                value={eventForm.location}
                onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quick-event-desc" className="text-xs font-semibold">
                Short Description / Highlights
              </Label>
              <Textarea
                id="quick-event-desc"
                placeholder="Brief summary of topics covered, prerequisites, guest speakers..."
                rows={3}
                value={eventForm.description}
                onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
              <div className="space-y-0.5">
                <Label htmlFor="quick-event-upcoming" className="text-xs font-semibold cursor-pointer">
                  Mark as Upcoming Event
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Highlight this event on the homepage and registration section
                </p>
              </div>
              <Switch
                id="quick-event-upcoming"
                checked={eventForm.is_upcoming}
                onCheckedChange={(checked) => setEventForm(prev => ({ ...prev, is_upcoming: checked }))}
              />
            </div>

            <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row gap-2 sm:justify-between items-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEventModalOpen(false);
                  navigate("/admin/events");
                }}
                className="text-xs text-muted-foreground hover:text-foreground w-full sm:w-auto"
              >
                Open Full Events Manager
              </Button>
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEventModalOpen(false)}
                  disabled={submittingEvent}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingEvent}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                >
                  {submittingEvent ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      Publish Event
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Quick Publish Notice Dialog */}
      <Dialog open={noticeModalOpen} onOpenChange={setNoticeModalOpen}>
        <DialogContent className="sm:max-w-[520px] p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-cyan-500/10 text-cyan-600 flex items-center justify-center border border-cyan-500/20">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Publish Portal Notice</DialogTitle>
                <DialogDescription className="text-xs">
                  Broadcast an announcement to the CUET BME student portal and society notice board.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handlePublishNotice} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="quick-notice-title" className="text-xs font-semibold">
                Notice Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quick-notice-title"
                placeholder="e.g., Call for Papers: BMES Annual Student Symposium 2026"
                value={noticeForm.title}
                onChange={(e) => setNoticeForm(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="quick-notice-category" className="text-xs font-semibold">Category</Label>
                <Select
                  value={noticeForm.category}
                  onValueChange={(val: "departmental" | "club") => setNoticeForm(prev => ({ ...prev, category: val }))}
                >
                  <SelectTrigger id="quick-notice-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="departmental">Departmental Official</SelectItem>
                    <SelectItem value="club">Club & Society Notice</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quick-notice-date" className="text-xs font-semibold">Notice Date</Label>
                <Input
                  id="quick-notice-date"
                  type="date"
                  value={noticeForm.date}
                  onChange={(e) => setNoticeForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quick-notice-content" className="text-xs font-semibold">
                Notice Content / Body
              </Label>
              <Textarea
                id="quick-notice-content"
                placeholder="Enter complete notice announcement details, instructions, eligibility..."
                rows={4}
                value={noticeForm.content}
                onChange={(e) => setNoticeForm(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quick-notice-pdf" className="text-xs font-semibold">
                Attachment / Document URL (Optional)
              </Label>
              <Input
                id="quick-notice-pdf"
                placeholder="https://... or link to official PDF circular"
                value={noticeForm.pdf_url}
                onChange={(e) => setNoticeForm(prev => ({ ...prev, pdf_url: e.target.value }))}
              />
            </div>

            <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row gap-2 sm:justify-between items-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNoticeModalOpen(false);
                  navigate("/admin/notices");
                }}
                className="text-xs text-muted-foreground hover:text-foreground w-full sm:w-auto"
              >
                Open Notice Board Manager
              </Button>
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNoticeModalOpen(false)}
                  disabled={submittingNotice}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingNotice}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white gap-1.5"
                >
                  {submittingNotice ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      Publish Live
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
