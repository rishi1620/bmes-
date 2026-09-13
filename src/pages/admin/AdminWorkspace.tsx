import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { 
  googleSignIn, 
  googleSignOut, 
  initAuth 
} from "@/lib/googleAuth";
import {
  listDriveFiles,
  uploadFileToDrive,
  deleteDriveFile,
  listCalendarEvents,
  createCalendarEvent,
  listGoogleForms,
  createGoogleForm,
  createPreconfiguredFeedbackForm,
  createPreconfiguredEventRegistrationForm,
  getEmbeddableGoogleFormUrl,
  extractGoogleFormId,
  DriveFile,
  CalendarEventItem,
  GoogleFormItem
} from "@/lib/googleWorkspace";
import { User } from "firebase/auth";
import { supabase } from "@/integrations/supabase/client";
import { 
  FolderOpen, 
  Calendar as CalendarIcon, 
  FileCheck2, 
  Upload, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  Plus, 
  Search, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle2, 
  LogOut, 
  Sparkles, 
  Clock, 
  MapPin, 
  Link as LinkIcon,
  Copy,
  Eye,
  FileSpreadsheet,
  Settings2,
  FileQuestion,
  MessageSquare
} from "lucide-react";
import GoogleFormSubmissionsViewer from "@/components/admin/GoogleFormSubmissionsViewer";
import EmbeddedGoogleForm from "@/components/shared/EmbeddedGoogleForm";
import GoogleFormsSyncBar from "@/components/admin/GoogleFormsSyncBar";
import { useGoogleFormsConfig } from "@/hooks/useGoogleFormsConfig";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { format } from "date-fns";
import { toast } from "sonner";

interface SocietyEventOption {
  id: string;
  title: string;
  date: string;
  location: string | null;
  description: string | null;
}

const AdminWorkspace: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [activeTab, setActiveTab] = useState<"drive" | "calendar" | "forms">("drive");

  // Google Drive State
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [driveSearch, setDriveSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<DriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Google Calendar State
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    summary: "",
    description: "",
    location: "CUET Campus, Chittagong",
    startDate: format(new Date(), "yyyy-MM-dd"),
    startTime: "10:00",
    endDate: format(new Date(), "yyyy-MM-dd"),
    endTime: "12:00",
  });
  const [societyEvents, setSocietyEvents] = useState<SocietyEventOption[]>([]);
  const [isSyncingEventId, setIsSyncingEventId] = useState<string | null>(null);

  // Google Forms State
  const [googleForms, setGoogleForms] = useState<GoogleFormItem[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState("");
  const [newFormDescription, setNewFormDescription] = useState("");

  // Submissions Viewer & Public Embed Integration State
  const { config: formsConfig, saveConfig: saveFormsConfig } = useGoogleFormsConfig();
  const [selectedFormForSubmissions, setSelectedFormForSubmissions] = useState<{ id: string; title: string } | null>(null);
  const [previewModal, setPreviewModal] = useState<{ url: string; title: string } | null>(null);
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState<"feedback" | "event" | null>(null);
  const [feedbackUrlInput, setFeedbackUrlInput] = useState("");
  const [eventUrlInput, setEventUrlInput] = useState("");
  const [isEditingEmbedConfig, setIsEditingEmbedConfig] = useState(false);

  // Sync inputs with loaded formsConfig
  useEffect(() => {
    if (formsConfig) {
      setFeedbackUrlInput(formsConfig.memberFeedbackFormUrl || "");
      setEventUrlInput(formsConfig.eventRegistrationFormUrl || "");
    }
  }, [formsConfig]);

  // Initialize Auth listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, accessToken) => {
        setCurrentUser(user);
        setToken(accessToken);
      },
      () => {
        setCurrentUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch data when authenticated or tab changes
  const loadDrive = useCallback(async () => {
    if (!token) return;
    setIsLoadingDrive(true);
    try {
      const files = await listDriveFiles();
      setDriveFiles(files);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load Google Drive files";
      toast.error(message);
    } finally {
      setIsLoadingDrive(false);
    }
  }, [token]);

  const loadCalendar = useCallback(async () => {
    if (!token) return;
    setIsLoadingCalendar(true);
    try {
      const [events, socEventsRes] = await Promise.all([
        listCalendarEvents(),
        supabase.from("events").select("id, title, date, location, description").order("date", { ascending: false }).limit(10)
      ]);
      setCalendarEvents(events);
      if (socEventsRes.data) {
        setSocietyEvents(socEventsRes.data);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load Google Calendar events";
      toast.error(message);
    } finally {
      setIsLoadingCalendar(false);
    }
  }, [token]);

  const loadForms = useCallback(async () => {
    if (!token) return;
    setIsLoadingForms(true);
    try {
      const forms = await listGoogleForms();
      setGoogleForms(forms);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load Google Forms";
      toast.error(message);
    } finally {
      setIsLoadingForms(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      if (activeTab === "drive") loadDrive();
      else if (activeTab === "calendar") loadCalendar();
      else if (activeTab === "forms") loadForms();
    }
  }, [token, activeTab, loadDrive, loadCalendar, loadForms]);

  // Handle Google Sign-in
  const handleSignIn = async () => {
    setIsAuthenticating(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setToken(result.accessToken);
        toast.success(`Connected to Google as ${result.user.displayName || result.user.email}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google connection failed";
      toast.error(message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleSignOut();
      setCurrentUser(null);
      setToken(null);
      setDriveFiles([]);
      setCalendarEvents([]);
      setGoogleForms([]);
      toast.info("Google Account disconnected");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to disconnect";
      toast.error(message);
    }
  };

  // Drive Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await uploadFileToDrive(file);
      }
      toast.success(`${files.length} file(s) successfully uploaded to Google Drive!`);
      loadDrive();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "File upload failed";
      toast.error(message);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // Drive Delete (with mandatory confirmation)
  const confirmDeleteDriveFile = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(fileToDelete.id);
      toast.success(`"${fileToDelete.name}" removed from Google Drive.`);
      setDriveFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      setFileToDelete(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete file";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Calendar Create
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.summary.trim()) {
      toast.error("Please enter an event title");
      return;
    }

    setIsSubmittingEvent(true);
    try {
      await createCalendarEvent({
        summary: newEvent.summary,
        description: newEvent.description,
        location: newEvent.location,
        startDate: newEvent.startDate,
        startTime: newEvent.startTime,
        endDate: newEvent.endDate,
        endTime: newEvent.endTime,
      });

      toast.success("Event scheduled in Google Calendar!");
      setIsCreateEventOpen(false);
      setNewEvent({
        summary: "",
        description: "",
        location: "CUET Campus, Chittagong",
        startDate: format(new Date(), "yyyy-MM-dd"),
        startTime: "10:00",
        endDate: format(new Date(), "yyyy-MM-dd"),
        endTime: "12:00",
      });
      loadCalendar();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create event";
      toast.error(message);
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  // Quick sync society event to Google Calendar
  const handleSyncSocietyEvent = async (socEvent: SocietyEventOption) => {
    setIsSyncingEventId(socEvent.id);
    try {
      const eventDateStr = socEvent.date ? format(new Date(socEvent.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
      await createCalendarEvent({
        summary: `[BMES CUET] ${socEvent.title}`,
        description: socEvent.description || `Official Event organized by Biomedical Engineering Society, CUET.`,
        location: socEvent.location || "Chittagong University of Engineering & Technology (CUET)",
        startDate: eventDateStr,
        startTime: "10:00",
        endDate: eventDateStr,
        endTime: "13:00",
      });
      toast.success(`"${socEvent.title}" synced to Google Calendar!`);
      loadCalendar();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Event sync failed";
      toast.error(message);
    } finally {
      setIsSyncingEventId(null);
    }
  };

  // Create Google Form
  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormTitle.trim()) {
      toast.error("Please enter a form title");
      return;
    }

    setIsSubmittingForm(true);
    try {
      const form = await createGoogleForm(newFormTitle, newFormDescription);
      toast.success(`Google Form "${form.title}" created successfully!`);
      setIsCreateFormOpen(false);
      setNewFormTitle("");
      setNewFormDescription("");
      loadForms();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create Google Form";
      toast.error(message);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Generate official Member Feedback Form with pre-populated questions
  const handleGenerateFeedbackTemplate = async () => {
    setIsGeneratingTemplate("feedback");
    try {
      const form = await createPreconfiguredFeedbackForm();
      toast.success(`Generated official Member Feedback Form: "${form.title}"!`);
      await loadForms();
      await saveFormsConfig({
        memberFeedbackFormUrl: form.responderUri,
        memberFeedbackFormId: form.formId,
        memberFeedbackTitle: form.title,
        memberFeedbackEnabled: true,
      });
      setFeedbackUrlInput(form.responderUri);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate Member Feedback Form";
      toast.error(msg);
    } finally {
      setIsGeneratingTemplate(null);
    }
  };

  // Generate official Event Registration Form with pre-populated questions
  const handleGenerateEventTemplate = async () => {
    setIsGeneratingTemplate("event");
    try {
      const form = await createPreconfiguredEventRegistrationForm("BMES Society Workshop / Event");
      toast.success(`Generated official Event Registration Form: "${form.title}"!`);
      await loadForms();
      await saveFormsConfig({
        eventRegistrationFormUrl: form.responderUri,
        eventRegistrationFormId: form.formId,
        eventRegistrationTitle: form.title,
        eventRegistrationEnabled: true,
      });
      setEventUrlInput(form.responderUri);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate Event Registration Form";
      toast.error(msg);
    } finally {
      setIsGeneratingTemplate(null);
    }
  };

  // Assign any form in the list as Active Member Feedback or Event Registration
  const handleAssignActiveForm = async (type: "feedback" | "event", form: GoogleFormItem) => {
    const embedUrl = getEmbeddableGoogleFormUrl(form.id);
    if (type === "feedback") {
      await saveFormsConfig({
        memberFeedbackFormUrl: embedUrl,
        memberFeedbackFormId: form.id,
        memberFeedbackTitle: form.title,
        memberFeedbackEnabled: true,
      });
      setFeedbackUrlInput(embedUrl);
      toast.success(`"${form.title}" is now the active Member Feedback Form on the public site!`);
    } else {
      await saveFormsConfig({
        eventRegistrationFormUrl: embedUrl,
        eventRegistrationFormId: form.id,
        eventRegistrationTitle: form.title,
        eventRegistrationEnabled: true,
      });
      setEventUrlInput(embedUrl);
      toast.success(`"${form.title}" is now the active Event Registration Form on the public site!`);
    }
  };

  // Save custom embed configuration
  const handleSaveCustomEmbedConfig = async () => {
    await saveFormsConfig({
      memberFeedbackFormUrl: feedbackUrlInput,
      eventRegistrationFormUrl: eventUrlInput,
    });
    setIsEditingEmbedConfig(false);
  };

  // Copy URL helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Format file size
  const formatFileSize = (bytesStr?: string) => {
    if (!bytesStr) return "Folder / Doc";
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return "Doc";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredDriveFiles = driveFiles.filter((f) =>
    f.name.toLowerCase().includes(driveSearch.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Google Workspace Integration Hub
              </h1>
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-xs">
                Official Google Services
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Connect and manage Google Drive cloud storage, Google Calendar event schedules, and Google Forms for registrations and surveys.
            </p>
          </div>

          {/* Google Auth Status Bar */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3 bg-muted/60 border border-border/80 rounded-xl p-2 px-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || "Google User"}
                    className="h-8 w-8 rounded-full border border-border"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs">
                    {(currentUser.displayName || currentUser.email || "G").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground truncate max-w-[160px]">
                    {currentUser.displayName || "Google Account"}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                    {currentUser.email}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-rose-600 ml-1"
                  title="Disconnect Google Account"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-100 dark:border-slate-700 shadow-sm font-medium text-xs h-9 gap-2.5"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                {isAuthenticating ? "Connecting..." : "Sign in with Google"}
              </Button>
            )}
          </div>
        </div>

        {/* Not connected warning banner */}
        {!currentUser && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">
                    Connect Google Workspace Account
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sign in with your Google Account to authorize seamless access to Google Drive files, Google Calendar scheduling, and Google Forms surveys directly from this dashboard.
                </p>
              </div>
              <Button onClick={handleSignIn} disabled={isAuthenticating} size="sm" className="shrink-0 text-xs gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Authorize Workspace Access
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Workspace Hub Tabs */}
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "drive" | "calendar" | "forms")}>
          <TabsList className="grid grid-cols-3 h-11 w-full max-w-md">
            <TabsTrigger value="drive" className="text-xs gap-1.5">
              <FolderOpen className="h-3.5 w-3.5" />
              <span>Google Drive</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Google Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="forms" className="text-xs gap-1.5">
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>Google Forms</span>
            </TabsTrigger>
          </TabsList>

          {/* =========================================================================
              TAB 1: GOOGLE DRIVE STORAGE & FILES
              ========================================================================= */}
          <TabsContent value="drive" className="space-y-4 pt-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  Google Drive Cloud Storage
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {driveFiles.length} Files
                  </Badge>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Store and manage notice PDFs, research papers, banners, and media archive in your Google Drive.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadDrive}
                  disabled={isLoadingDrive || !currentUser}
                  className="h-8 text-xs gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingDrive ? "animate-spin text-primary" : ""}`} />
                  Refresh
                </Button>

                <label>
                  <Button
                    asChild
                    size="sm"
                    disabled={isUploading || !currentUser}
                    className="h-8 text-xs gap-1.5 cursor-pointer bg-primary text-primary-foreground"
                  >
                    <span>
                      <Upload className={`h-3.5 w-3.5 ${isUploading ? "animate-bounce" : ""}`} />
                      {isUploading ? "Uploading..." : "Upload File"}
                    </span>
                  </Button>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading || !currentUser}
                  />
                </label>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="search"
                value={driveSearch}
                onChange={(e) => setDriveSearch(e.target.value)}
                placeholder="Search Drive files..."
                className="h-8 text-xs pl-8 pr-2.5"
              />
            </div>

            {/* Files List Card */}
            <Card className="border-border shadow-xs overflow-hidden">
              <CardContent className="p-0">
                {!currentUser ? (
                  <div className="text-center py-12 text-xs text-muted-foreground space-y-2">
                    <FolderOpen className="mx-auto h-8 w-8 text-muted-foreground/40" />
                    <p className="font-semibold text-foreground">Sign in to access Google Drive</p>
                    <p className="text-[11px]">Click the "Sign in with Google" button above to view and upload files.</p>
                  </div>
                ) : isLoadingDrive ? (
                  <div className="text-center py-12 text-xs text-muted-foreground space-y-2">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
                    <p>Loading files from Google Drive...</p>
                  </div>
                ) : filteredDriveFiles.length === 0 ? (
                  <div className="text-center py-12 text-xs text-muted-foreground space-y-2">
                    <FolderOpen className="mx-auto h-8 w-8 text-muted-foreground/30" />
                    <p className="font-semibold text-foreground">No files found in Google Drive</p>
                    <p className="text-[11px]">Use the "Upload File" button above to add notice PDFs or media files.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {filteredDriveFiles.map((file) => {
                      const isPdf = file.mimeType.includes("pdf");
                      const isImage = file.mimeType.includes("image");

                      return (
                        <div
                          key={file.id}
                          className="flex items-center justify-between gap-3 p-3 sm:px-4 text-xs hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                              isPdf 
                                ? "bg-rose-500/10 text-rose-600 border-rose-500/20" 
                                : isImage 
                                ? "bg-blue-500/10 text-blue-600 border-blue-500/20" 
                                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            }`}>
                              {isPdf ? <FileText className="h-4 w-4" /> : isImage ? <ImageIcon className="h-4 w-4" /> : <FolderOpen className="h-4 w-4" />}
                            </div>

                            <div className="min-w-0 flex-1 space-y-0.5">
                              <p className="font-semibold text-foreground truncate text-xs">
                                {file.name}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                                <span>{formatFileSize(file.size)}</span>
                                <span>•</span>
                                <span>{format(new Date(file.modifiedTime || file.createdTime), "MMM d, yyyy")}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {file.webViewLink && (
                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs px-2 text-primary"
                                title="Open in Google Drive"
                              >
                                <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                  <span className="hidden sm:inline">View</span>
                                </a>
                              </Button>
                            )}

                            {file.webViewLink && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(file.webViewLink!, "Drive link")}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                title="Copy Link"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setFileToDelete(file)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                              title="Delete from Drive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* =========================================================================
              TAB 2: GOOGLE CALENDAR
              ========================================================================= */}
          <TabsContent value="calendar" className="space-y-4 pt-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  Google Calendar Scheduling
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {calendarEvents.length} Events
                  </Badge>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Synchronize society workshops, seminars, and academic deadlines with Google Calendar.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadCalendar}
                  disabled={isLoadingCalendar || !currentUser}
                  className="h-8 text-xs gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingCalendar ? "animate-spin text-primary" : ""}`} />
                  Refresh
                </Button>

                <Button
                  size="sm"
                  onClick={() => setIsCreateEventOpen(true)}
                  disabled={!currentUser}
                  className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Event
                </Button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-12 items-start">
              {/* Left 7 cols: Google Calendar events list */}
              <div className="lg:col-span-7 space-y-3">
                <Card className="border-border shadow-xs overflow-hidden">
                  <CardHeader className="bg-muted/20 border-b pb-3 pt-3.5">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                      Upcoming Calendar Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {!currentUser ? (
                      <div className="text-center py-10 text-xs text-muted-foreground space-y-1">
                        <p className="font-semibold text-foreground">Sign in to view Google Calendar</p>
                        <p className="text-[11px]">Authorize Google access above.</p>
                      </div>
                    ) : isLoadingCalendar ? (
                      <div className="text-center py-10 text-xs text-muted-foreground space-y-2">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto text-primary" />
                        <p>Fetching Google Calendar...</p>
                      </div>
                    ) : calendarEvents.length === 0 ? (
                      <div className="text-center py-10 text-xs text-muted-foreground space-y-1">
                        <CalendarIcon className="mx-auto h-7 w-7 text-muted-foreground/30 mb-1" />
                        <p className="font-semibold text-foreground">No upcoming events scheduled</p>
                        <p className="text-[11px]">Click "New Event" or sync a CUET BMES event on the right.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/60">
                        {calendarEvents.map((evt) => {
                          const eventTime = evt.start.dateTime || evt.start.date;
                          return (
                            <div key={evt.id} className="p-3 sm:px-4 text-xs hover:bg-muted/30 transition-colors flex items-start justify-between gap-3">
                              <div className="space-y-1 min-w-0 flex-1">
                                <p className="font-semibold text-foreground truncate text-xs">{evt.summary}</p>
                                {evt.description && (
                                  <p className="text-[11px] text-muted-foreground line-clamp-1">{evt.description}</p>
                                )}
                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {eventTime ? format(new Date(eventTime), "MMM d, yyyy h:mm a") : "Time TBD"}
                                  </span>
                                  {evt.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {evt.location}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {evt.htmlLink && (
                                <Button asChild variant="ghost" size="sm" className="h-7 text-xs px-2 text-primary shrink-0">
                                  <a href={evt.htmlLink} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                    <span>Open</span>
                                  </a>
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right 5 cols: 1-Click Sync Society Events */}
              <div className="lg:col-span-5 space-y-4">
                <Card className="border-border shadow-xs">
                  <CardHeader className="bg-muted/20 border-b pb-3 pt-3.5">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      1-Click Sync BMES Society Events
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Export active society workshops, seminars, and dates to Google Calendar.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3.5 space-y-2.5">
                    {societyEvents.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-4 text-center">No society events found in database.</p>
                    ) : (
                      societyEvents.map((soc) => (
                        <div key={soc.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-border/70 bg-card hover:bg-muted/30 text-xs">
                          <div className="min-w-0 space-y-0.5 flex-1">
                            <p className="font-semibold text-foreground truncate text-xs">{soc.title}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {soc.date ? format(new Date(soc.date), "MMM d, yyyy") : "Date TBD"}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSyncSocietyEvent(soc)}
                            disabled={!currentUser || isSyncingEventId === soc.id}
                            className="h-7 text-[11px] px-2 text-primary border-primary/30 shrink-0"
                          >
                            {isSyncingEventId === soc.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <CalendarIcon className="h-3 w-3 mr-1" />
                            )}
                            Sync
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* =========================================================================
              TAB 3: GOOGLE FORMS & SUBMISSION DATA
              ========================================================================= */}
          <TabsContent value="forms" className="space-y-4 pt-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  Google Forms Surveys & Event Registrations
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {googleForms.length} Connected Forms
                  </Badge>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Collect student feedback and event registrations via embedded Google Forms, with live submission data synced to the admin dashboard.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadForms}
                  disabled={isLoadingForms || !currentUser}
                  className="h-8 text-xs gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingForms ? "animate-spin text-primary" : ""}`} />
                  Refresh
                </Button>

                <Button
                  size="sm"
                  onClick={() => setIsCreateFormOpen(true)}
                  disabled={!currentUser}
                  className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Blank Form
                </Button>
              </div>
            </div>

            {/* Quick Generator Toolbar */}
            <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <span className="font-semibold text-foreground">One-Click Form Generators:</span>{" "}
                  <span className="text-muted-foreground">Instantly create pre-populated Google Forms in your Google account.</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateFeedbackTemplate}
                  disabled={!currentUser || isGeneratingTemplate !== null}
                  className="h-7 text-xs gap-1.5 border-purple-500/30 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                >
                  {isGeneratingTemplate === "feedback" ? (
                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <MessageSquare className="h-3 w-3 mr-1" />
                  )}
                  Generate Member Feedback Form
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateEventTemplate}
                  disabled={!currentUser || isGeneratingTemplate !== null}
                  className="h-7 text-xs gap-1.5 border-blue-500/30 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                >
                  {isGeneratingTemplate === "event" ? (
                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <FileQuestion className="h-3 w-3 mr-1" />
                  )}
                  Generate Event Registration Form
                </Button>
              </div>
            </div>

            {/* Background Auto-Sync Service Bar */}
            <GoogleFormsSyncBar 
              contextTitle="Live Auto-Sync Engine: Polls responses from Google Forms directly into Contact Submissions & Event Registrations tables." 
            />

            {/* Active Embedded Forms Configuration Hub */}
            <Card className="border-border shadow-xs">
              <CardHeader className="p-4 pb-3 border-b border-border/70 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4 text-primary" />
                    Public Website Active Embedded Google Forms
                  </CardTitle>
                  <CardDescription className="text-xs">
                    These official Google Forms are embedded directly into the public website for Member Feedback and Event Registration.
                  </CardDescription>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingEmbedConfig(!isEditingEmbedConfig)}
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  <span>{isEditingEmbedConfig ? "Close Settings" : "Configure URLs"}</span>
                </Button>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {/* 2 Main Form Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Member Feedback Card */}
                  <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-foreground">Member & Student Feedback</h3>
                          <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20">
                            Embedded on /contact & /portal
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {formsConfig.memberFeedbackTitle || "BMES CUET Member Feedback"}
                        </p>
                      </div>

                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/40 text-[11px] font-mono text-muted-foreground space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Form ID:</span>
                        <span className="text-foreground truncate max-w-[200px]">
                          {formsConfig.memberFeedbackFormId || "Configured via URL"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <Button
                        size="sm"
                        onClick={() => {
                          const id = formsConfig.memberFeedbackFormId || extractGoogleFormId(formsConfig.memberFeedbackFormUrl);
                          if (!id) {
                            toast.error("Please configure a valid Google Form ID or URL first.");
                            return;
                          }
                          setSelectedFormForSubmissions({
                            id,
                            title: formsConfig.memberFeedbackTitle || "Member Feedback Survey",
                          });
                        }}
                        className="h-7 text-xs px-2.5 bg-purple-600 hover:bg-purple-700 text-white gap-1"
                      >
                        <FileSpreadsheet className="h-3 w-3" />
                        <span>View Submissions</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPreviewModal({
                            url: formsConfig.memberFeedbackFormUrl,
                            title: formsConfig.memberFeedbackTitle || "Member Feedback Form",
                          })
                        }
                        className="h-7 text-xs px-2.5 gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Test Preview</span>
                      </Button>

                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground gap-1"
                      >
                        <a
                          href={formsConfig.memberFeedbackFormUrl.replace(/[?&]embedded=true/, "")}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>Open</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>

                  {/* Event Registration Card */}
                  <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-foreground">Event Registration Form</h3>
                          <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-600 bg-blue-50 dark:bg-blue-950/20">
                            Embedded on /events
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {formsConfig.eventRegistrationTitle || "Official Event Registration via Google Forms"}
                        </p>
                      </div>

                      <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/40 text-[11px] font-mono text-muted-foreground space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Form ID:</span>
                        <span className="text-foreground truncate max-w-[200px]">
                          {formsConfig.eventRegistrationFormId || "Configured via URL"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <Button
                        size="sm"
                        onClick={() => {
                          const id = formsConfig.eventRegistrationFormId || extractGoogleFormId(formsConfig.eventRegistrationFormUrl);
                          if (!id) {
                            toast.error("Please configure a valid Google Form ID or URL first.");
                            return;
                          }
                          setSelectedFormForSubmissions({
                            id,
                            title: formsConfig.eventRegistrationTitle || "Event Registration Form",
                          });
                        }}
                        className="h-7 text-xs px-2.5 bg-purple-600 hover:bg-purple-700 text-white gap-1"
                      >
                        <FileSpreadsheet className="h-3 w-3" />
                        <span>View Submissions</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPreviewModal({
                            url: formsConfig.eventRegistrationFormUrl,
                            title: formsConfig.eventRegistrationTitle || "Event Registration Form",
                          })
                        }
                        className="h-7 text-xs px-2.5 gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Test Preview</span>
                      </Button>

                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground gap-1"
                      >
                        <a
                          href={formsConfig.eventRegistrationFormUrl.replace(/[?&]embedded=true/, "")}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>Open</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Edit Embed Config Inputs */}
                {isEditingEmbedConfig && (
                  <div className="p-4 rounded-xl border border-primary/20 bg-muted/30 space-y-3 pt-3">
                    <p className="text-xs font-semibold text-foreground">
                      Custom Google Forms Links or Form IDs:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          Member Feedback Form URL or ID:
                        </label>
                        <Input
                          value={feedbackUrlInput}
                          onChange={(e) => setFeedbackUrlInput(e.target.value)}
                          placeholder="https://docs.google.com/forms/d/e/.../viewform"
                          className="h-8 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          Event Registration Form URL or ID:
                        </label>
                        <Input
                          value={eventUrlInput}
                          onChange={(e) => setEventUrlInput(e.target.value)}
                          placeholder="https://docs.google.com/forms/d/e/.../viewform"
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingEmbedConfig(false)}
                        className="h-7 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveCustomEmbedConfig}
                        className="h-7 text-xs bg-primary text-primary-foreground"
                      >
                        Save Configuration
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Forms List Card */}
            <Card className="border-border shadow-xs overflow-hidden">
              <CardHeader className="p-4 pb-3 border-b border-border/70">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <span>Google Account Forms</span>
                  <span className="text-xs font-normal text-muted-foreground">({googleForms.length} available)</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Inspect submission responses, view question schemas, or assign any form to the public website.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                {!currentUser ? (
                  <div className="text-center py-12 text-xs text-muted-foreground space-y-2">
                    <FileCheck2 className="mx-auto h-8 w-8 text-muted-foreground/40" />
                    <p className="font-semibold text-foreground">Sign in to view Google Forms</p>
                    <p className="text-[11px]">Authorize Google access above to manage society forms.</p>
                  </div>
                ) : isLoadingForms ? (
                  <div className="text-center py-12 text-xs text-muted-foreground space-y-2">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
                    <p>Fetching Google Forms...</p>
                  </div>
                ) : googleForms.length === 0 ? (
                  <div className="text-center py-12 text-xs text-muted-foreground space-y-3 p-8">
                    <FileCheck2 className="mx-auto h-8 w-8 text-muted-foreground/30" />
                    <p className="font-semibold text-foreground">No Google Forms found in this Google account</p>
                    <p className="text-[11px] max-w-sm mx-auto">
                      Click the "Generate Member Feedback Form" or "Generate Event Registration Form" button above to auto-create official forms with standard questions.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {googleForms.map((form) => {
                      const responderUrl = `https://docs.google.com/forms/d/${form.id}/viewform`;
                      const editUrl = `https://docs.google.com/forms/d/${form.id}/edit`;
                      const isFeedbackActive = formsConfig.memberFeedbackFormId === form.id;
                      const isEventActive = formsConfig.eventRegistrationFormId === form.id;

                      return (
                        <div
                          key={form.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:px-4 text-xs hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 border border-purple-500/20 flex items-center justify-center shrink-0">
                              <FileCheck2 className="h-4 w-4" />
                            </div>

                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-foreground truncate text-xs">
                                  {form.title}
                                </p>
                                {isFeedbackActive && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20">
                                    Active Feedback
                                  </Badge>
                                )}
                                {isEventActive && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-500/30 text-blue-600 bg-blue-50 dark:bg-blue-950/20">
                                    Active Event Form
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                                <span>ID: {form.id}</span>
                                <span>•</span>
                                <span>Created: {form.createdTime ? format(new Date(form.createdTime), "MMM d, yyyy") : "N/A"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            {/* Primary Button: View Submissions */}
                            <Button
                              size="sm"
                              onClick={() =>
                                setSelectedFormForSubmissions({
                                  id: form.id,
                                  title: form.title,
                                })
                              }
                              className="h-7 text-xs px-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium gap-1"
                            >
                              <FileSpreadsheet className="h-3 w-3" />
                              <span>Submissions</span>
                            </Button>

                            {/* Assign buttons */}
                            {!isFeedbackActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAssignActiveForm("feedback", form)}
                                className="h-7 text-[11px] px-2 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                title="Set as public Member Feedback Form"
                              >
                                Set Feedback
                              </Button>
                            )}

                            {!isEventActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAssignActiveForm("event", form)}
                                className="h-7 text-[11px] px-2 text-blue-700 dark:text-blue-400 border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                                title="Set as public Event Registration Form"
                              >
                                Set Event
                              </Button>
                            )}

                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2 font-medium"
                            >
                              <a href={responderUrl} target="_blank" rel="noopener noreferrer">
                                <LinkIcon className="h-3 w-3 mr-1" />
                                <span>Fill</span>
                              </a>
                            </Button>

                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs px-2 text-primary"
                            >
                              <a href={editUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                <span>Edit</span>
                              </a>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(responderUrl, "Public Form Link")}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              title="Copy Public Form Link"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* =========================================================================
            DIALOG: CREATE CALENDAR EVENT
            ========================================================================= */}
        <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Schedule in Google Calendar</DialogTitle>
              <DialogDescription className="text-xs">
                Create an official event or meeting synced directly to your primary Google Calendar.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateEvent} className="space-y-3.5 py-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Event Title *</label>
                <Input
                  required
                  placeholder="e.g. BMES Bio-Design Hackathon Workshop"
                  value={newEvent.summary}
                  onChange={(e) => setNewEvent({ ...newEvent, summary: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Date *</label>
                  <Input
                    type="date"
                    required
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value, endDate: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Start Time</label>
                  <Input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Location</label>
                <Input
                  placeholder="CUET Auditorium / Seminar Hall"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Description</label>
                <Textarea
                  placeholder="Event agenda, keynote speaker details, or meeting notes..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="text-xs min-h-[70px]"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateEventOpen(false)} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmittingEvent} className="h-8 text-xs bg-primary text-primary-foreground">
                  {isSubmittingEvent ? "Saving..." : "Add to Google Calendar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* =========================================================================
            DIALOG: CREATE GOOGLE FORM
            ========================================================================= */}
        <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Create New Google Form</DialogTitle>
              <DialogDescription className="text-xs">
                Quickly spin up a Google Form for event registrations, attendee feedback, or recruitment.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateForm} className="space-y-3.5 py-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Form Title *</label>
                <Input
                  required
                  placeholder="e.g. Biomedical Workshop 2026 Feedback Form"
                  value={newFormTitle}
                  onChange={(e) => setNewFormTitle(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Description & Instructions</label>
                <Textarea
                  placeholder="Brief instructions for participants filling out this Google Form..."
                  value={newFormDescription}
                  onChange={(e) => setNewFormDescription(e.target.value)}
                  className="text-xs min-h-[80px]"
                />
              </div>

              <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground space-y-1 border">
                <p className="font-semibold text-foreground">💡 Form Features:</p>
                <p>• Creates an official Google Form inside your Google Drive.</p>
                <p>• You can customize additional questions, dropdowns, and file upload questions in Google Forms.</p>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateFormOpen(false)} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmittingForm} className="h-8 text-xs bg-primary text-primary-foreground">
                  {isSubmittingForm ? "Creating Form..." : "Create Form"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* =========================================================================
            MANDATORY CONFIRMATION DIALOG FOR DESTRUCTIVE OPERATIONS (DRIVE DELETE)
            Per Workspace Integration Skill Rules!
            ========================================================================= */}
        <AlertDialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete file from Google Drive?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-foreground font-mono">"{fileToDelete?.name}"</span> from your Google Drive? This operation cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting} className="text-xs h-8">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteDriveFile}
                disabled={isDeleting}
                className="text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete File"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* =========================================================================
            GOOGLE FORM SUBMISSION DATA VIEWER DIALOG
            ========================================================================= */}
        {selectedFormForSubmissions && (
          <GoogleFormSubmissionsViewer
            isOpen={!!selectedFormForSubmissions}
            formId={selectedFormForSubmissions.id}
            formTitle={selectedFormForSubmissions.title}
            onClose={() => setSelectedFormForSubmissions(null)}
          />
        )}

        {/* =========================================================================
            LIVE EMBED PREVIEW MODAL
            ========================================================================= */}
        <Dialog open={!!previewModal} onOpenChange={(open) => !open && setPreviewModal(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] p-4 flex flex-col gap-3">
            <DialogHeader className="pb-2 border-b border-border/80">
              <DialogTitle className="text-sm font-bold flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <span>Live Embed Preview: {previewModal?.title}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                This shows exactly how the embedded Google Form appears to members and visitors on the public website.
              </DialogDescription>
            </DialogHeader>

            {previewModal && (
              <div className="flex-1 overflow-hidden">
                <EmbeddedGoogleForm
                  formUrlOrId={previewModal.url}
                  title={previewModal.title}
                  defaultHeight={550}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminWorkspace;
