import { useState, useEffect, useMemo, useCallback } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Mail, 
  Send, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  RefreshCw, 
  Search, 
  Sparkles, 
  X, 
  Smartphone, 
  Monitor, 
  History,
  Info,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export type RecipientSource = "member" | "advisor" | "ec" | "staff" | "event" | "membership" | "custom";

export interface Recipient {
  id: string;
  email: string;
  name: string;
  source: RecipientSource;
  detail?: string;
  status?: string;
  eventId?: string;
}

interface EventItem {
  id: string;
  title: string;
}

interface BroadcastHistoryItem {
  id: string;
  subject: string;
  emailType: "announcement" | "reminder" | "urgent" | "general";
  recipientCount: number;
  date: string;
  sentBy?: string;
  previewText: string;
}

const EMAIL_TEMPLATES = [
  {
    label: "📢 General Announcement",
    type: "announcement" as const,
    subject: "[CUET BMES Announcement] Important Update for All Members",
    message: `Dear {name},\n\nWe are excited to share an important announcement with our society members and registered students.\n\nPlease review the details above and check our student portal for updated academic and society materials.\n\nIf you have any questions or feedback, feel free to reply or get in touch with the executive committee.`,
    buttonText: "Visit Student Portal",
    buttonUrl: "/portal",
  },
  {
    label: "⏰ Event Registration Reminder",
    type: "reminder" as const,
    subject: "[Reminder] Upcoming Event Registration & Schedule",
    message: `Dear {name},\n\nThis is a friendly reminder regarding our upcoming society session and activities.\n\nSpots and session schedules are being finalized. We encourage all interested participants to confirm their details promptly.\n\nWe look forward to your active participation!`,
    buttonText: "View Event Details",
    buttonUrl: "/events",
  },
  {
    label: "📋 Membership Application Reminder",
    type: "reminder" as const,
    subject: "[BMES Membership] Complete Your Society Application",
    message: `Dear {name},\n\nThank you for your interest in joining the CUET Biomedical Engineering Society.\n\nIf you have submitted a pending application, please ensure your student ID and transaction information are accurate so our committee can verify and approve your membership.\n\nApproved members gain full access to licensed engineering software and our study library.`,
    buttonText: "Check Application Status",
    buttonUrl: "/portal",
  },
  {
    label: "🎓 Membership Approved & Induction",
    type: "announcement" as const,
    subject: "[CUET BMES] Membership Application Approved • Welcome to the Society!",
    message: `Dear {name},\n\nCongratulations! Your membership application for the CUET Biomedical Engineering Society has been reviewed and officially approved.\n\nYou are now an official inducted member of our society. Your official Membership ID and credentials are active.\n\nYou can now log in to the Student Portal to view and download your official virtual Member ID Card, access licensed academic biomedical software, and participate in upcoming specialized workshops.\n\nWe look forward to an inspiring journey together in biomedical engineering!`,
    buttonText: "Access Student Portal & Member Card",
    buttonUrl: "/portal",
  },
  {
    label: "🚨 Urgent Society Notice",
    type: "urgent" as const,
    subject: "[URGENT] Important Notice from CUET BMES Administration",
    message: `Dear {name},\n\nPlease take note of this urgent departmental society update.\n\nAction or acknowledgement is requested from all members at your earliest convenience.\n\nThank you for your cooperation and timely response.`,
    buttonText: "Read Full Notice",
    buttonUrl: "/notices",
  },
];

export default function AdminBulkEmail() {
  const { user } = useAuth();

  // Recipient data
  const [allRecipients, setAllRecipients] = useState<Recipient[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [loadingRecipients, setLoadingRecipients] = useState(true);
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  
  // Audience filtering: Checkboxes for target groups (Empty by default for strict safety - must explicitly select)
  const [selectedSources, setSelectedSources] = useState<Set<RecipientSource>>(
    new Set()
  );
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [membershipStatusFilter, setMembershipStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [customEmailsInput, setCustomEmailsInput] = useState("");

  // Email composer form
  const [emailType, setEmailType] = useState<"announcement" | "reminder" | "urgent" | "general">("announcement");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [includeCta, setIncludeCta] = useState(true);
  const [ctaText, setCtaText] = useState("Visit Student Portal");
  const [ctaUrl, setCtaUrl] = useState(`${window.location.origin}/portal`);

  // Modals & States (Test email starts empty to prevent any unintended dispatches)
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState<{ current: number; total: number } | null>(null);

  // Broadcast History
  const [history, setHistory] = useState<BroadcastHistoryItem[]>([]);

  // 1. Fetch all registered users & recipients from Supabase
  const loadRecipients = useCallback(async () => {
    setLoadingRecipients(true);
    try {
      // Fetch membership registrations
      const { data: membershipData } = await supabase
        .from("membership_registrations")
        .select("id, email, full_name, status, department, student_id");

      // Fetch advisors and faculty
      const { data: advisorsData } = await supabase
        .from("advisors")
        .select("id, email, name, designation, department, role_type")
        .eq("is_active", true);

      // Fetch members (EC and Staff)
      const { data: membersData } = await supabase
        .from("members")
        .select("id, email, name, role, department, team")
        .eq("is_active", true);

      // Fetch event registrations
      const { data: eventData } = await supabase
        .from("event_registrations")
        .select("id, email, name, event_id, events(title)");

      // Fetch events for filter dropdown
      const { data: events } = await supabase
        .from("events")
        .select("id, title")
        .order("created_at", { ascending: false });

      if (events) {
        setEventsList(events);
      }

      const combined: Recipient[] = [];
      const seen = new Set<string>();

      // 1. Society Members (Approved members who officially registered and took society membership)
      if (membershipData) {
        membershipData.forEach((m) => {
          const email = m.email?.trim().toLowerCase();
          if (email && !seen.has(email)) {
            seen.add(email);
            const isApproved = m.status === "approved";
            combined.push({
              id: `mem-${m.id}`,
              email,
              name: m.full_name || "Society Member",
              source: isApproved ? "member" : "membership",
              status: m.status,
              detail: isApproved
                ? `Official Society Member • ${m.department || "BME"} • ID: ${m.student_id || "N/A"}`
                : `Membership Applicant (${m.status}) • ${m.department || "BME"} • ID: ${m.student_id || "N/A"}`,
            });
          }
        });
      }

      // 2. Advisory Panel & Faculty Mentors (from advisors table)
      if (advisorsData) {
        advisorsData.forEach((adv) => {
          const email = adv.email?.trim().toLowerCase();
          if (email && !seen.has(email)) {
            seen.add(email);
            combined.push({
              id: `adv-${adv.id}`,
              email,
              name: adv.name || "Advisor",
              source: "advisor",
              detail: `Advisory Panel • ${adv.role_type || "Advisor"}${adv.designation ? ` (${adv.designation})` : ""} • ${adv.department || "CUET"}`,
            });
          }
        });
      }

      // 3. Department Members: explicitly separate Staff / Technical Officer from Executive Committee
      if (membersData) {
        membersData.forEach((sm) => {
          const email = sm.email?.trim().toLowerCase();
          if (email && !seen.has(email)) {
            seen.add(email);
            const isStaff = sm.team === "Staff" || 
              /officer|staff|technician|assistant/i.test(sm.role || "") ||
              /officer|staff|technician/i.test(sm.team || "") ||
              /modasser/i.test(sm.name || "");

            if (isStaff) {
              combined.push({
                id: `staff-${sm.id}`,
                email,
                name: sm.name || "Staff Member",
                source: "staff",
                detail: `Department Staff • ${sm.role || "Technical Officer"} • ${sm.department || "Biomedical Engineering"}`,
              });
            } else {
              combined.push({
                id: `ec-${sm.id}`,
                email,
                name: sm.name || "EC Member",
                source: "ec",
                detail: `Executive Committee (EC) • ${sm.role || "Officer"} • ${sm.department || "CUET"}`,
              });
            }
          }
        });
      }

      // 4. Event registrations
      if (eventData) {
        eventData.forEach((e) => {
          const email = e.email?.trim().toLowerCase();
          const eventTitle = (e.events as unknown as { title: string })?.title || "Event Attendee";
          if (email && !seen.has(email)) {
            seen.add(email);
            combined.push({
              id: `evt-${e.id}`,
              email,
              name: e.name || "Participant",
              source: "event",
              eventId: e.event_id || undefined,
              detail: `Registered for: ${eventTitle}`,
            });
          }
        });
      }

      setAllRecipients(combined);

      // Strict safety: Start with zero recipients pre-selected so no emails are sent accidentally
      setSelectedEmails(new Set());
    } catch (err) {
      console.error("Failed to load recipients:", err);
      toast.error("Failed to load recipient list.");
    } finally {
      setLoadingRecipients(false);
    }
  }, []);

  // 2. Load Broadcast History from site_settings or localStorage
  const loadHistory = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "email_broadcast_history")
        .maybeSingle();

      if (data?.setting_value) {
        const parsed = JSON.parse(data.setting_value);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not read broadcast history from database:", e);
    }

    // Fallback to localStorage
    const local = localStorage.getItem("bmes_broadcast_history");
    if (local) {
      try {
        setHistory(JSON.parse(local));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    loadRecipients();
    loadHistory();
  }, [loadRecipients, loadHistory]);

  // Handle custom email parsing
  const customRecipients = useMemo(() => {
    if (!customEmailsInput.trim()) return [];
    const lines = customEmailsInput.split(/[\n,;]+/);
    const parsed: Recipient[] = [];
    lines.forEach((item, idx) => {
      const trimmed = item.trim();
      if (trimmed && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        parsed.push({
          id: `custom-${idx}`,
          email: trimmed.toLowerCase(),
          name: trimmed.split("@")[0],
          source: "custom",
          detail: "Manually entered email",
        });
      }
    });
    return parsed;
  }, [customEmailsInput]);

  // 3. Filtered Recipients based on current Checked Groups & Filters
  const filteredRecipients = useMemo(() => {
    let list: Recipient[] = [];

    if (selectedSources.has("custom")) {
      list.push(...customRecipients);
    }

    const fromDb = allRecipients.filter((r) => {
      if (!selectedSources.has(r.source)) return false;

      if (r.source === "membership" && membershipStatusFilter !== "all") {
        return r.status === membershipStatusFilter;
      }

      if (r.source === "event" && selectedEventId !== "all") {
        return r.eventId === selectedEventId;
      }

      return true;
    });

    list.push(...fromDb);

    // Apply text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          (r.detail && r.detail.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allRecipients, customRecipients, selectedSources, membershipStatusFilter, selectedEventId, searchQuery]);

  // Toggle a target group source checkbox
  const toggleSource = (source: RecipientSource) => {
    setSelectedSources((prev) => {
      const next = new Set(prev);
      const isAdding = !next.has(source);
      if (isAdding) {
        next.add(source);
      } else {
        next.delete(source);
      }

      // Sync selected emails dynamically
      setSelectedEmails((current) => {
        const updated = new Set(current);
        const affected = source === "custom"
          ? customRecipients
          : allRecipients.filter((r) => r.source === source);
        affected.forEach((r) => {
          if (isAdding) {
            updated.add(r.email);
          } else {
            updated.delete(r.email);
          }
        });
        return updated;
      });

      return next;
    });
  };

  // Audience presets
  const setSourcePreset = (sources: RecipientSource[]) => {
    const newSet = new Set(sources);
    setSelectedSources(newSet);
    const newSelected = new Set<string>();
    if (newSet.has("custom")) {
      customRecipients.forEach((r) => newSelected.add(r.email));
    }
    allRecipients.forEach((r) => {
      if (newSet.has(r.source)) {
        newSelected.add(r.email);
      }
    });
    setSelectedEmails(newSelected);
  };

  // Toggle single recipient checkbox
  const toggleRecipient = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  };

  // Select all / Deselect all currently filtered recipients
  const selectAllFiltered = () => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      filteredRecipients.forEach((r) => next.add(r.email));
      return next;
    });
  };

  const deselectAllFiltered = () => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      filteredRecipients.forEach((r) => next.delete(r.email));
      return next;
    });
  };

  // Final count of active selected recipients that will receive the broadcast
  const activeRecipientsList = useMemo(() => {
    return filteredRecipients.filter((r) => selectedEmails.has(r.email));
  }, [filteredRecipients, selectedEmails]);

  // Apply a template
  const applyTemplate = (tpl: typeof EMAIL_TEMPLATES[number]) => {
    setEmailType(tpl.type);
    setSubject(tpl.subject);
    setMessage(tpl.message);
    setIncludeCta(true);
    setCtaText(tpl.buttonText);
    setCtaUrl(tpl.buttonUrl.startsWith("http") ? tpl.buttonUrl : `${window.location.origin}${tpl.buttonUrl}`);
    toast.info(`Applied template: ${tpl.label}`);
  };

  // Send Test Email
  const handleSendTest = async () => {
    if (!testEmailAddress || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmailAddress.trim())) {
      toast.error("Please enter a valid test email address.");
      return;
    }
    if (!subject.trim()) {
      toast.error("Please enter an email subject first.");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter an email message first.");
      return;
    }

    setSendingTest(true);
    try {
      const res = await fetch("/api/send-test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testEmail: testEmailAddress.trim(),
          testName: user?.user_metadata?.full_name || "Admin",
          subject: subject.trim(),
          message: message.trim(),
          emailType,
          actionButtonText: includeCta && ctaText.trim() ? ctaText.trim() : undefined,
          actionButtonUrl: includeCta && ctaUrl.trim() ? ctaUrl.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send test email");
      }

      toast.success(`Test email delivered to ${testEmailAddress.trim()}! Please check your inbox.`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Error sending test email";
      toast.error(errorMsg);
    } finally {
      setSendingTest(false);
    }
  };

  // Send Bulk Email to All Selected Recipients
  const handleSendBroadcast = async () => {
    if (activeRecipientsList.length === 0) {
      toast.error("No recipients selected to send to.");
      return;
    }
    if (!subject.trim()) {
      toast.error("Please enter a subject line.");
      return;
    }
    if (!message.trim()) {
      toast.error("Please write the email message.");
      return;
    }

    setConfirmModalOpen(false);
    setIsSending(true);
    setSendProgress({ current: 0, total: activeRecipientsList.length });

    try {
      const payloadRecipients = activeRecipientsList.map((r) => ({
        email: r.email,
        name: r.name,
      }));

      const res = await fetch("/api/send-bulk-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: payloadRecipients,
          subject: subject.trim(),
          message: message.trim(),
          emailType,
          actionButtonText: includeCta && ctaText.trim() ? ctaText.trim() : undefined,
          actionButtonUrl: includeCta && ctaUrl.trim() ? ctaUrl.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Server failed to process bulk email");
      }

      const summary = data.summary || { sent: payloadRecipients.length, failed: 0 };

      toast.success(`Broadcast sent! Successfully delivered ${summary.sent} emails.`);

      if (summary.failed > 0) {
        toast.warning(`${summary.failed} email(s) could not be delivered. Check server logs.`);
      }

      // Save to broadcast history
      const newHistoryItem: BroadcastHistoryItem = {
        id: Date.now().toString(),
        subject: subject.trim(),
        emailType,
        recipientCount: summary.sent,
        date: new Date().toISOString(),
        sentBy: user?.email || "Admin",
        previewText: message.slice(0, 100) + "...",
      };

      const updatedHistory = [newHistoryItem, ...history].slice(0, 20);
      setHistory(updatedHistory);
      localStorage.setItem("bmes_broadcast_history", JSON.stringify(updatedHistory));

      // Attempt to save to site_settings
      try {
        await supabase.from("site_settings").upsert({
          setting_key: "email_broadcast_history",
          setting_value: JSON.stringify(updatedHistory),
        });
      } catch (e) {
        console.warn("Could not sync broadcast history to site_settings:", e);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to send broadcast";
      toast.error(errorMsg);
    } finally {
      setIsSending(false);
      setSendProgress(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Mail className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Bulk Email Broadcasts</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Dispatch official announcements, reminders, or updates to registered society users via Gmail SMTP.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadRecipients}
              disabled={loadingRecipients || isSending}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loadingRecipients ? "animate-spin" : ""}`} />
              Refresh Audience
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPreviewModalOpen(true)}
              className="gap-2"
              disabled={!subject.trim() && !message.trim()}
            >
              <Eye className="h-4 w-4" />
              Live Preview
            </Button>
          </div>
        </div>

        {/* Audience Overview Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Total Reachable Users</p>
                <p className="text-2xl font-bold mt-1 text-foreground">{allRecipients.length}</p>
                <p className="text-xs text-muted-foreground">Across membership, events & members</p>
              </div>
              <Users className="h-8 w-8 text-primary/40" />
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Selected for Sending</p>
                <p className="text-2xl font-bold mt-1 text-primary">{activeRecipientsList.length}</p>
                <p className="text-xs text-muted-foreground">Will receive this broadcast</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-primary/40" />
            </CardContent>
          </Card>
          <Card className="bg-slate-500/5 border-slate-500/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Configured Sender</p>
                <p className="text-base font-semibold mt-1 text-foreground truncate max-w-[200px]">
                  CUET BMES Society
                </p>
                <p className="text-xs text-muted-foreground">Via environment SMTP credentials</p>
              </div>
              <Sparkles className="h-8 w-8 text-muted-foreground/30" />
            </CardContent>
          </Card>
        </div>

        {/* Main Grid: Composer & Recipient Manager */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Email Composer (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-4 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">Compose Email Broadcast</CardTitle>
                    <CardDescription>Draft your message with personalization tokens</CardDescription>
                  </div>
                  <Select onValueChange={(val) => {
                    const found = EMAIL_TEMPLATES.find((t) => t.label === val);
                    if (found) applyTemplate(found);
                  }}>
                    <SelectTrigger className="w-[200px] h-8 text-xs">
                      <SelectValue placeholder="Quick Templates..." />
                    </SelectTrigger>
                    <SelectContent>
                      {EMAIL_TEMPLATES.map((t) => (
                        <SelectItem key={t.label} value={t.label} className="text-xs">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {/* Email Type Selector */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email Category & Theme
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "announcement", label: "Announcement", color: "border-primary bg-primary/10 text-primary" },
                      { id: "reminder", label: "Reminder", color: "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
                      { id: "urgent", label: "Urgent Notice", color: "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" },
                      { id: "general", label: "General Update", color: "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setEmailType(t.id as typeof emailType)}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                          emailType === t.id
                            ? `${t.color} ring-2 ring-offset-1 ring-primary`
                            : "border-input bg-background hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject Line */}
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm font-semibold">
                    Subject Line <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="subject"
                    placeholder="e.g. [BMES Announcement] Important Society Workshop on Sunday"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="text-base"
                  />
                </div>

                {/* Message Content */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="message" className="text-sm font-semibold">
                      Email Body <span className="text-destructive">*</span>
                    </Label>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Use <code className="bg-muted px-1 py-0.5 rounded text-[11px] font-mono">{"{name}"}</code> for recipient name
                    </span>
                  </div>
                  <Textarea
                    id="message"
                    rows={9}
                    placeholder="Write your announcement or reminder message here. Paragraph breaks will be formatted automatically..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="font-sans leading-relaxed text-sm resize-y"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Tip: Double line-breaks form separate paragraphs. The email footer and official society signature will be appended automatically.
                  </p>
                </div>

                {/* Call To Action Button (Optional) */}
                <div className="rounded-xl border p-4 bg-muted/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold cursor-pointer" onClick={() => setIncludeCta(!includeCta)}>
                        Include Call-to-Action Button
                      </Label>
                      <p className="text-xs text-muted-foreground">Add a prominent action button in the email</p>
                    </div>
                    <Checkbox
                      checked={includeCta}
                      onCheckedChange={(c) => setIncludeCta(Boolean(c))}
                    />
                  </div>

                  {includeCta && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Button Label</Label>
                        <Input
                          value={ctaText}
                          onChange={(e) => setCtaText(e.target.value)}
                          placeholder="e.g. Visit Student Portal"
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Target URL</Label>
                        <Input
                          value={ctaUrl}
                          onChange={(e) => setCtaUrl(e.target.value)}
                          placeholder="https://..."
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Test Send Area */}
                <div className="rounded-xl border border-dashed p-4 bg-background space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" /> Test Delivery
                    </span>
                    <span className="text-[11px] text-muted-foreground">Sends a single preview to your inbox</span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Enter test email address..."
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      className="h-9 text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSendTest}
                      disabled={sendingTest || !subject.trim() || !message.trim()}
                      className="h-9 px-4 text-xs shrink-0"
                    >
                      {sendingTest ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                      Send Test
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/20 border-t p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground text-center sm:text-left">
                  Ready to send to <strong className="text-foreground">{activeRecipientsList.length}</strong> selected recipient(s).
                </div>
                <Button
                  size="lg"
                  onClick={() => setConfirmModalOpen(true)}
                  disabled={isSending || activeRecipientsList.length === 0 || !subject.trim() || !message.trim()}
                  className="w-full sm:w-auto gap-2 bg-primary font-semibold shadow-md"
                >
                  <Send className="h-4 w-4" />
                  Dispatch Broadcast ({activeRecipientsList.length})
                </Button>
              </CardFooter>
            </Card>

            {/* Broadcast History */}
            {history.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    Recent Broadcasts History
                  </CardTitle>
                  <CardDescription>Logs of previous announcements and reminders sent from this dashboard</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="divide-y divide-border">
                    {history.map((item) => (
                      <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground">{item.subject}</span>
                            <Badge variant="outline" className="text-[10px] uppercase font-mono">
                              {item.emailType}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{item.previewText}</p>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between text-xs text-muted-foreground shrink-0">
                          <span className="font-semibold text-primary">
                            {item.recipientCount} sent
                          </span>
                          <span>{format(new Date(item.date), "MMM d, yyyy • h:mm a")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Audience & Recipient List (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Recipient Audience
                    </CardTitle>
                    <CardDescription>Filter and select which users receive this email</CardDescription>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {activeRecipientsList.length} / {filteredRecipients.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Target Audience Checkboxes & Presets */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Filter className="h-3.5 w-3.5 text-primary" /> Target Audience (Check to Include)
                    </Label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSourcePreset(["member", "advisor"])}
                        className="text-[11px] text-primary hover:underline font-medium"
                      >
                        Members + Advisory
                      </button>
                      <span className="text-muted-foreground text-[10px]">•</span>
                      <button
                        type="button"
                        onClick={() => setSourcePreset(["member", "advisor", "ec", "staff", "event", "membership"])}
                        className="text-[11px] text-muted-foreground hover:underline font-medium"
                      >
                        All
                      </button>
                    </div>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSourcePreset(["member", "advisor"])}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        selectedSources.has("member") && selectedSources.has("advisor") && !selectedSources.has("ec") && !selectedSources.has("staff") && !selectedSources.has("event")
                          ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                          : "bg-background border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      🎓 Society Members & Advisors
                    </button>
                    <button
                      type="button"
                      onClick={() => setSourcePreset(["member"])}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        selectedSources.size === 1 && selectedSources.has("member")
                          ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                          : "bg-background border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      🎓 Members Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setSourcePreset(["advisor"])}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        selectedSources.size === 1 && selectedSources.has("advisor")
                          ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                          : "bg-background border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      🏛️ Advisors Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setSourcePreset(["member", "advisor", "ec"])}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        selectedSources.has("member") && selectedSources.has("advisor") && selectedSources.has("ec") && !selectedSources.has("staff")
                          ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                          : "bg-background border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      + EC Committee
                    </button>
                  </div>

                  {/* Checkbox selector cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {/* 1. Society Members */}
                    <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      selectedSources.has("member")
                        ? "border-primary/50 bg-primary/10 font-medium"
                        : "border-border bg-background hover:bg-muted/40"
                    }`}>
                      <Checkbox
                        checked={selectedSources.has("member")}
                        onCheckedChange={() => toggleSource("member")}
                        className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-primary truncate">Society Members</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary shrink-0">
                            {allRecipients.filter(r => r.source === 'member').length}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">Approved registered members</p>
                      </div>
                    </label>

                    {/* 2. Advisory Panel */}
                    <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      selectedSources.has("advisor")
                        ? "border-amber-500/50 bg-amber-500/10 font-medium"
                        : "border-border bg-background hover:bg-muted/40"
                    }`}>
                      <Checkbox
                        checked={selectedSources.has("advisor")}
                        onCheckedChange={() => toggleSource("advisor")}
                        className="mt-0.5 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-amber-700 dark:text-amber-400 truncate">Advisory Panel</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/30 text-amber-600 shrink-0">
                            {allRecipients.filter(r => r.source === 'advisor').length}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">Advisors, moderators & faculty</p>
                      </div>
                    </label>

                    {/* 3. Executive Committee */}
                    <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      selectedSources.has("ec")
                        ? "border-blue-500/50 bg-blue-500/10 font-medium"
                        : "border-border bg-background hover:bg-muted/40"
                    }`}>
                      <Checkbox
                        checked={selectedSources.has("ec")}
                        onCheckedChange={() => toggleSource("ec")}
                        className="mt-0.5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-blue-700 dark:text-blue-400 truncate">EC Committee</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-blue-500/30 text-blue-600 shrink-0">
                            {allRecipients.filter(r => r.source === 'ec').length}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">Student executive committee</p>
                      </div>
                    </label>

                    {/* 4. Staff & Technical Officers */}
                    <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      selectedSources.has("staff")
                        ? "border-slate-500/50 bg-slate-500/10 font-medium"
                        : "border-border bg-background hover:bg-muted/40"
                    }`}>
                      <Checkbox
                        checked={selectedSources.has("staff")}
                        onCheckedChange={() => toggleSource("staff")}
                        className="mt-0.5 data-[state=checked]:bg-slate-700 data-[state=checked]:border-slate-700"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">Staff & Officers</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-slate-500/30 text-slate-600 dark:text-slate-300 shrink-0">
                            {allRecipients.filter(r => r.source === 'staff').length}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">Department technical staff</p>
                      </div>
                    </label>

                    {/* 5. Event Attendees */}
                    <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      selectedSources.has("event")
                        ? "border-purple-500/50 bg-purple-500/10 font-medium"
                        : "border-border bg-background hover:bg-muted/40"
                    }`}>
                      <Checkbox
                        checked={selectedSources.has("event")}
                        onCheckedChange={() => toggleSource("event")}
                        className="mt-0.5 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-purple-700 dark:text-purple-400 truncate">Event Attendees</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-purple-500/30 text-purple-600 shrink-0">
                            {allRecipients.filter(r => r.source === 'event').length}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">Event workshop attendees</p>
                      </div>
                    </label>

                    {/* 6. Pending Membership Applicants */}
                    <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      selectedSources.has("membership")
                        ? "border-orange-500/50 bg-orange-500/10 font-medium"
                        : "border-border bg-background hover:bg-muted/40"
                    }`}>
                      <Checkbox
                        checked={selectedSources.has("membership")}
                        onCheckedChange={() => toggleSource("membership")}
                        className="mt-0.5 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-orange-700 dark:text-orange-400 truncate">Pending Applicants</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-orange-500/30 text-orange-600 shrink-0">
                            {allRecipients.filter(r => r.source === 'membership').length}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">Unapproved registrations</p>
                      </div>
                    </label>

                    {/* 7. Custom Email List */}
                    <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors sm:col-span-2 ${
                      selectedSources.has("custom")
                        ? "border-primary/50 bg-primary/10 font-medium"
                        : "border-border bg-background hover:bg-muted/40"
                    }`}>
                      <Checkbox
                        checked={selectedSources.has("custom")}
                        onCheckedChange={() => toggleSource("custom")}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-foreground truncate">Custom Pasted List</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                            {customRecipients.length}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">Include manually entered email addresses</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Sub-filter if Membership applicant is selected */}
                {selectedSources.has("membership") && (
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-xs text-muted-foreground">Membership Application Status Filter</Label>
                    <Select value={membershipStatusFilter} onValueChange={setMembershipStatusFilter}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Applicants (Approved & Pending)</SelectItem>
                        <SelectItem value="approved">Approved Members Only</SelectItem>
                        <SelectItem value="pending">Pending Applicants Only (For reminders)</SelectItem>
                        <SelectItem value="rejected">Rejected / Incomplete Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Sub-filter if Event is selected */}
                {selectedSources.has("event") && eventsList.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-xs text-muted-foreground">Filter by Event</Label>
                    <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Events ({allRecipients.filter(r => r.source === 'event').length})</SelectItem>
                        {eventsList.map((ev) => (
                          <SelectItem key={ev.id} value={ev.id}>
                            {ev.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Custom Email Input if Custom is selected */}
                {selectedSources.has("custom") && (
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-xs text-muted-foreground">Paste Email Addresses (comma or line separated)</Label>
                    <Textarea
                      placeholder="student1@cuet.ac.bd&#10;student2@cuet.ac.bd"
                      rows={3}
                      value={customEmailsInput}
                      onChange={(e) => setCustomEmailsInput(e.target.value)}
                      className="text-xs font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Parsed valid emails: {customRecipients.length}
                    </p>
                  </div>
                )}

                {/* Search in filtered list */}
                <div className="relative pt-1">
                  <Search className="absolute left-2.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-3 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Select / Deselect actions */}
                <div className="flex items-center justify-between text-xs pt-1 border-b pb-2">
                  <span className="text-muted-foreground">
                    Showing <strong>{filteredRecipients.length}</strong> matching recipient(s)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllFiltered}
                      className="text-primary hover:underline font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <button
                      type="button"
                      onClick={deselectAllFiltered}
                      className="text-muted-foreground hover:underline font-medium"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {/* Recipient List with Checkboxes */}
                <div className="max-h-[380px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/40">
                  {loadingRecipients ? (
                    <div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                      Loading registered users...
                    </div>
                  ) : filteredRecipients.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No recipients matched the current filters.
                    </div>
                  ) : (
                    filteredRecipients.map((rec) => {
                      const isChecked = selectedEmails.has(rec.email);
                      return (
                        <div
                          key={rec.id}
                          onClick={() => toggleRecipient(rec.email)}
                          className={`p-2 rounded-lg flex items-start gap-3 cursor-pointer transition-colors ${
                            isChecked ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50 opacity-60"
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleRecipient(rec.email)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-semibold text-foreground truncate">{rec.name}</p>
                              <Badge 
                                variant="outline" 
                                className={`text-[9px] px-1.5 py-0 uppercase font-semibold ${
                                  rec.source === "member" 
                                    ? "border-primary/30 text-primary bg-primary/10" 
                                    : rec.source === "advisor"
                                    ? "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                                    : rec.source === "ec" 
                                    ? "border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10" 
                                    : rec.source === "staff"
                                    ? "border-slate-500/30 text-slate-700 dark:text-slate-300 bg-slate-500/10"
                                    : rec.source === "event" 
                                    ? "border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10" 
                                    : rec.source === "membership"
                                    ? "border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-500/10"
                                    : "border-slate-500/30 text-slate-600 dark:text-slate-300 bg-slate-500/10"
                                }`}
                              >
                                {rec.source === "member" 
                                  ? "Society Member" 
                                  : rec.source === "advisor"
                                  ? "Advisory Panel"
                                  : rec.source === "ec" 
                                  ? "EC Committee" 
                                  : rec.source === "staff"
                                  ? "Staff / Officer"
                                  : rec.source === "membership" 
                                  ? "Applicant" 
                                  : rec.source === "event" 
                                  ? "Event" 
                                  : "Custom"}
                              </Badge>
                            </div>
                            <p className="text-xs text-primary/80 font-mono truncate">{rec.email}</p>
                            {rec.detail && (
                              <p className="text-[11px] text-muted-foreground truncate">{rec.detail}</p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Information Tips Card */}
            <Card className="bg-muted/40 border-dashed">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <ShieldCheckIcon className="h-4 w-4 text-primary" />
                  Responsible Delivery Guidelines
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4 leading-relaxed">
                  <li>Emails are sent directly via the configured Gmail SMTP service.</li>
                  <li>Batching and pacing are applied automatically to prevent spam filtering.</li>
                  <li>Always send a test email to your own address first to verify formatting.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog before sending */}
      <AlertDialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Email Broadcast
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <div className="text-sm">
                You are about to send this <strong>{emailType}</strong> to{" "}
                <strong className="text-foreground">{activeRecipientsList.length}</strong> recipient(s).
              </div>
              <div className="rounded-lg border p-3 bg-muted/30 text-xs space-y-1.5 font-mono">
                <div><strong>Subject:</strong> {subject}</div>
                <div><strong>Sender:</strong> CUET BMES Administration &lt;bmes@cuet.ac.bd&gt;</div>
                <div><strong>Total Batch:</strong> {activeRecipientsList.length} individual emails</div>
              </div>
              <div className="text-xs text-muted-foreground">
                This action cannot be undone once dispatched. Please ensure you have tested the email content.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendBroadcast}
              className="bg-primary text-primary-foreground font-semibold"
            >
              Yes, Send to {activeRecipientsList.length} Users
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Live Email Preview Dialog */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
          <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold">Email Preview</DialogTitle>
              <DialogDescription className="text-xs">
                Accurate rendering of how this announcement appears in recipients&apos; inboxes
              </DialogDescription>
            </div>
            <div className="flex items-center border rounded-lg p-0.5 bg-background">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                  previewDevice === "desktop" ? "bg-muted text-foreground font-semibold" : "text-muted-foreground"
                }`}
              >
                <Monitor className="h-3.5 w-3.5" /> Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                  previewDevice === "mobile" ? "bg-muted text-foreground font-semibold" : "text-muted-foreground"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" /> Mobile
              </button>
            </div>
          </div>

          <div className="p-6 bg-slate-100 dark:bg-slate-900 flex justify-center">
            <div
              className={`force-light bg-white text-slate-900 rounded-xl shadow-lg border border-slate-200 overflow-hidden transition-all duration-200 ${
                previewDevice === "mobile" ? "w-[340px]" : "w-full max-w-[560px]"
              }`}
            >
              {/* Email Top color bar */}
              <div
                className={`h-1.5 w-full ${
                  emailType === "reminder"
                    ? "bg-amber-500"
                    : emailType === "urgent"
                    ? "bg-rose-500"
                    : emailType === "general"
                    ? "bg-blue-500"
                    : "bg-[#00568a]"
                }`}
              />

              {/* Email Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 leading-none">CUET Biomedical Engineering Society</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Chittagong University of Engineering & Technology</p>
                </div>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    emailType === "reminder"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : emailType === "urgent"
                      ? "bg-rose-50 text-rose-800 border-rose-200"
                      : emailType === "general"
                      ? "bg-blue-50 text-blue-800 border-blue-200"
                      : "bg-sky-50 text-[#00568a] border-sky-200"
                  }`}
                >
                  {emailType === "reminder"
                    ? "IMPORTANT REMINDER"
                    : emailType === "urgent"
                    ? "URGENT NOTICE"
                    : emailType === "general"
                    ? "GENERAL UPDATE"
                    : "OFFICIAL ANNOUNCEMENT"}
                </span>
              </div>

              {/* Email Body */}
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-bold text-slate-900 leading-snug">
                  {subject || "Your Announcement Subject Line Here"}
                </h2>
                <p className="text-sm font-semibold text-slate-800">
                  Dear John Doe (Preview),
                </p>
                <div className="text-sm text-slate-600 leading-relaxed space-y-3 whitespace-pre-line">
                  {message
                    ? message.replace(/\{name\}/gi, "John Doe")
                    : "Your email body will appear here formatted with clean paragraph breaks and society branding."}
                </div>

                {includeCta && ctaText && (
                  <div className="pt-4 pb-2 text-center">
                    <span
                      className={`inline-block px-6 py-2.5 rounded-lg text-white font-semibold text-sm shadow-sm ${
                        emailType === "reminder"
                          ? "bg-amber-500"
                          : emailType === "urgent"
                          ? "bg-rose-500"
                          : emailType === "general"
                          ? "bg-blue-500"
                          : "bg-[#00568a]"
                      }`}
                    >
                      {ctaText} &rarr;
                    </span>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-0.5">
                  <p className="font-semibold text-slate-700">Best regards,</p>
                  <p>Executive Committee & Administration</p>
                  <p className="font-bold text-slate-800">CUET Biomedical Engineering Society</p>
                </div>
              </div>

              {/* Email Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 space-y-1">
                <p>You are receiving this official communication as a registered student or member of CUET BMES.</p>
                <p className="text-slate-500 font-medium">cuetbmes.vercel.app • Student Portal • Events</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sending Progress Overlay */}
      {isSending && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-2xl border-primary/20">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                <Send className="h-6 w-6 animate-pulse" />
              </div>
              <CardTitle className="text-xl">Sending Broadcast...</CardTitle>
              <CardDescription>
                Dispatching emails safely via society mail service. Please keep this tab open.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 text-center space-y-3">
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>Subject: {subject.slice(0, 25)}...</span>
                <span>{sendProgress ? `${sendProgress.total} recipients` : `${activeRecipientsList.length} recipients`}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-primary h-2.5 rounded-full animate-pulse"
                  style={{ width: "100%" }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Connecting to SMTP and sending batches sequentially...
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
