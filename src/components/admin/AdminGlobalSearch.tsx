import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Users, 
  Mail, 
  Settings, 
  LayoutDashboard, 
  Navigation, 
  Home, 
  Image, 
  FileText, 
  GraduationCap, 
  Microscope, 
  Bell, 
  HelpCircle, 
  Calendar, 
  FolderOpen, 
  Trophy, 
  CalendarDays, 
  Inbox, 
  UserCheck, 
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface AdminPageItem {
  id: string;
  title: string;
  path: string;
  description: string;
  icon: React.ElementType;
  category: "Overview" | "Communications & Users" | "Site & Configuration" | "Engagement & Activities" | "Content & Academics";
  keywords: string[];
  roles?: AppRole[];
  highlight?: boolean;
}

const adminPages: AdminPageItem[] = [
  // Overview
  {
    id: "dashboard",
    title: "Dashboard Overview",
    path: "/admin",
    description: "System stats, registry sync, real-time counters & quick links",
    icon: LayoutDashboard,
    category: "Overview",
    keywords: ["dashboard", "home", "stats", "overview", "analytics", "sync", "metrics"],
    highlight: true,
  },

  // Communications & Users
  {
    id: "bulk-email",
    title: "Bulk Email Broadcast",
    path: "/admin/bulk-email",
    description: "Compose & broadcast emails to members, advisors, EC, and attendees",
    icon: Mail,
    category: "Communications & Users",
    keywords: ["bulk email", "email", "mail", "newsletter", "broadcast", "announcement", "send mail", "mailer", "smtp"],
    roles: ["admin", "super_admin"],
    highlight: true,
  },
  {
    id: "users",
    title: "User Roles & Management",
    path: "/admin/users",
    description: "Manage admin permissions, assign roles & oversee system access",
    icon: Users,
    category: "Communications & Users",
    keywords: ["users", "user management", "roles", "permissions", "super admin", "access", "staff", "editor", "credentials"],
    roles: ["admin", "super_admin"],
    highlight: true,
  },
  {
    id: "membership",
    title: "Membership & Virtual ID Cards",
    path: "/admin/membership",
    description: "Review member registrations, generate virtual ID cards, batch tags & printable profiles",
    icon: UserCheck,
    category: "Communications & Users",
    keywords: ["membership", "members", "virtual id", "id card", "batch tag", "print id", "registry", "applications", "approvals", "students", "payments", "bkash", "nagad"],
    roles: ["admin", "super_admin", "user", "editor", "content_manager"],
  },
  {
    id: "registrations",
    title: "Event Registrations",
    path: "/admin/registrations",
    description: "Track event ticket signups, participant list & attendee info",
    icon: CalendarDays,
    category: "Communications & Users",
    keywords: ["event registrations", "tickets", "attendees", "participants", "signups", "workshops"],
    roles: ["admin", "super_admin", "user", "editor", "content_manager"],
  },
  {
    id: "submissions",
    title: "Contact Form Submissions",
    path: "/admin/submissions",
    description: "Inbound contact inquiries, visitor messages & support requests",
    icon: Inbox,
    category: "Communications & Users",
    keywords: ["submissions", "contact", "inbox", "messages", "inquiries", "feedback", "support"],
    roles: ["admin", "super_admin", "user", "editor", "content_manager"],
  },

  // Site & Configuration
  {
    id: "settings",
    title: "Site Settings & Configuration",
    path: "/admin/settings",
    description: "Global website branding, logos, contact info, email settings & SEO",
    icon: Settings,
    category: "Site & Configuration",
    keywords: ["settings", "site settings", "configuration", "logo", "branding", "seo", "contact info", "footer"],
    roles: ["admin", "super_admin"],
    highlight: true,
  },
  {
    id: "pages",
    title: "Pages & Navigation",
    path: "/admin/pages",
    description: "Manage custom pages, navigation menus, and header link order",
    icon: Navigation,
    category: "Site & Configuration",
    keywords: ["pages", "navigation", "menu", "header", "navbar", "links", "routes"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "home",
    title: "Home Page Sections",
    path: "/admin/home",
    description: "Hero banner, highlights, featured sections & call-to-actions",
    icon: Home,
    category: "Site & Configuration",
    keywords: ["home", "homepage", "hero", "sections", "banner", "call to action"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "media",
    title: "Media Library",
    path: "/admin/media",
    description: "Upload and manage website images, logos, banners & document assets",
    icon: Image,
    category: "Site & Configuration",
    keywords: ["media", "images", "assets", "photos", "gallery", "uploads", "storage"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },

  // Engagement & Activities
  {
    id: "events",
    title: "Events & Workshops",
    path: "/admin/events",
    description: "Create and publish upcoming seminars, conferences & workshops",
    icon: Calendar,
    category: "Engagement & Activities",
    keywords: ["events", "workshops", "seminars", "conferences", "webinars", "competitions", "hackathons"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "projects",
    title: "Projects Showcase",
    path: "/admin/projects",
    description: "Biomedical engineering student innovations & faculty research projects",
    icon: FolderOpen,
    category: "Engagement & Activities",
    keywords: ["projects", "engineering", "innovations", "biomedical projects", "lab", "showcase"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "achievements",
    title: "Achievements & Awards",
    path: "/admin/achievements",
    description: "Competition awards, academic honors & university milestones",
    icon: Trophy,
    category: "Engagement & Activities",
    keywords: ["achievements", "awards", "honors", "prizes", "competitions", "medals", "recognition"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "activities",
    title: "Society Activities",
    path: "/admin/activities",
    description: "Club activities, medical camps, industrial visits & study circles",
    icon: CalendarDays,
    category: "Engagement & Activities",
    keywords: ["activities", "camps", "visits", "sessions", "programs", "outreach"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },

  // Content & Academics
  {
    id: "people",
    title: "People (EC Panel, Advisors & Staff)",
    path: "/admin/people",
    description: "Manage Executive Committee members, faculty advisors & department staff",
    icon: Users,
    category: "Content & Academics",
    keywords: ["people", "faculty", "executive committee", "ec", "advisors", "staff", "members", "mentors"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "alumni",
    title: "Alumni Directory",
    path: "/admin/alumni",
    description: "Graduated members, workplace profiles & alumni network directory",
    icon: GraduationCap,
    category: "Content & Academics",
    keywords: ["alumni", "graduates", "past members", "directory", "careers", "jobs"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "notices",
    title: "Notices & Announcements",
    path: "/admin/notices",
    description: "Official society notices, circulars & urgent member announcements",
    icon: Bell,
    category: "Content & Academics",
    keywords: ["notices", "announcements", "circulars", "news", "updates", "alerts"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "portal",
    title: "Member Portal Content",
    path: "/admin/portal",
    description: "Exclusive student resources, study materials & download repository",
    icon: FileText,
    category: "Content & Academics",
    keywords: ["portal", "student resources", "materials", "downloads", "books", "notes", "repository"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "research",
    title: "Research & Publications",
    path: "/admin/research",
    description: "Research papers, journal publications & faculty scientific outputs",
    icon: Microscope,
    category: "Content & Academics",
    keywords: ["research", "publications", "papers", "journals", "scientific", "articles"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "academics",
    title: "Academics Curriculum",
    path: "/admin/academics",
    description: "Academic curriculum, course outlines & semester syllabi",
    icon: GraduationCap,
    category: "Content & Academics",
    keywords: ["academics", "curriculum", "courses", "syllabus", "degree", "education"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "about",
    title: "About BMES Page",
    path: "/admin/about",
    description: "Society mission, vision, history, Constitution & leadership",
    icon: FileText,
    category: "Content & Academics",
    keywords: ["about", "mission", "vision", "history", "society", "constitution"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "blog",
    title: "Blog & Technical Articles",
    path: "/admin/blog",
    description: "Technical articles, student opinion pieces & BME news posts",
    icon: FileText,
    category: "Content & Academics",
    keywords: ["blog", "articles", "posts", "stories", "editorials"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "faq",
    title: "Frequently Asked Questions (FAQ)",
    path: "/admin/faq",
    description: "Questions & answers for prospective students and applicants",
    icon: HelpCircle,
    category: "Content & Academics",
    keywords: ["faq", "questions", "answers", "help", "support", "frequently asked questions"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
];

export const AdminGlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  // Handle Ctrl+K / Cmd+K keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName))) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback((path: string) => {
    setOpen(false);
    navigate(path);
  }, [navigate]);

  // Filter accessible pages by role
  const accessiblePages = adminPages.filter((page) => {
    if (!page.roles) return true;
    return hasRole(page.roles);
  });

  const categories: AdminPageItem["category"][] = [
    "Communications & Users",
    "Site & Configuration",
    "Overview",
    "Engagement & Activities",
    "Content & Academics"
  ];

  return (
    <>
      {/* Global Search Bar Trigger in Header */}
      <button
        type="button"
        id="admin-global-search-trigger"
        onClick={() => setOpen(true)}
        className="group relative flex items-center justify-between gap-2.5 h-9 w-full sm:w-64 md:w-72 lg:w-80 px-3 rounded-lg border border-border/70 bg-card/60 hover:bg-muted/70 hover:border-primary/40 text-muted-foreground hover:text-foreground text-xs transition-all duration-150 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Search admin pages"
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="truncate text-muted-foreground/90 group-hover:text-foreground text-[13px]">
            Quick jump to page...
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border/80 bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-[11px]">⌘</span>K
          </kbd>
        </div>
      </button>

      {/* Command Palette Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="relative">
          <CommandInput 
            placeholder="Type to search admin pages (e.g. users, bulk email, settings, events)..." 
            className="text-sm h-12"
          />
        </div>

        <CommandList className="max-h-[380px] p-2">
          <CommandEmpty className="py-8 text-center text-xs text-muted-foreground">
            <div className="max-w-xs mx-auto space-y-1">
              <p className="font-semibold text-foreground">No admin pages found</p>
              <p>Try searching for "users", "bulk email", "settings", or "events".</p>
            </div>
          </CommandEmpty>

          {/* Quick Highlighted / Priority Pages */}
          <CommandGroup heading="⚡ Top Destinations">
            {accessiblePages.filter((p) => p.highlight).map((page) => {
              const Icon = page.icon;
              return (
                <CommandItem
                  key={page.id}
                  value={`${page.title} ${page.keywords.join(" ")} ${page.path}`}
                  onSelect={() => handleSelect(page.path)}
                  className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground text-xs truncate">{page.title}</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary/30 text-primary shrink-0">
                          {page.category}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{page.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-muted-foreground text-[10px] font-mono">
                    <span className="hidden sm:inline">{page.path}</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandSeparator className="my-1.5" />

          {/* Categorized Admin Pages */}
          {categories.map((category) => {
            const items = accessiblePages.filter((p) => p.category === category && !p.highlight);
            if (items.length === 0) return null;

            return (
              <CommandGroup key={category} heading={category}>
                {items.map((page) => {
                  const Icon = page.icon;
                  return (
                    <CommandItem
                      key={page.id}
                      value={`${page.title} ${page.keywords.join(" ")} ${page.path}`}
                      onSelect={() => handleSelect(page.path)}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-6 w-6 rounded bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium text-foreground text-xs truncate block">{page.title}</span>
                          <p className="text-[11px] text-muted-foreground truncate">{page.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 text-muted-foreground text-[10px] font-mono">
                        <span className="hidden sm:inline">{page.path}</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            );
          })}
        </CommandList>

        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-muted-foreground bg-muted/20">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Search by page name, keyword, or path</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span>Navigate <kbd className="px-1 py-0.5 rounded bg-muted border">↑</kbd><kbd className="px-1 py-0.5 rounded bg-muted border">↓</kbd></span>
            <span>Open <kbd className="px-1 py-0.5 rounded bg-muted border">↵</kbd></span>
            <span>Close <kbd className="px-1 py-0.5 rounded bg-muted border">esc</kbd></span>
          </div>
        </div>
      </CommandDialog>
    </>
  );
};
export default AdminGlobalSearch;
