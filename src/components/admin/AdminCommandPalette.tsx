import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Navigation,
  Home,
  Image,
  Settings,
  Users,
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
  UserCog,
  ExternalLink,
  Search,
  ArrowRight,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { AppRole } from "@/context/AuthContext";

interface AdminPageItem {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ElementType;
  category: "Overview" | "Site Structure" | "Core Content" | "Community" | "Engagement" | "User Data" | "Administration";
  keywords: string[];
  roles?: AppRole[];
  external?: boolean;
}

const ADMIN_PAGES: AdminPageItem[] = [
  // Overview
  {
    id: "dashboard",
    title: "Dashboard Overview",
    description: "Main administrative metrics, recent activities, and system summary",
    path: "/admin",
    icon: LayoutDashboard,
    category: "Overview",
    keywords: ["home", "stats", "metrics", "analytics", "summary", "overview", "kpi"],
  },

  // Site Structure
  {
    id: "pages",
    title: "Pages & Navigation",
    description: "Configure site navigation menu, custom header items, and page routing",
    path: "/admin/pages",
    icon: Navigation,
    category: "Site Structure",
    keywords: ["menu", "header", "navbar", "routing", "links", "structure", "footer"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "home-sections",
    title: "Home Page Sections",
    description: "Edit hero banners, featured stats, call-to-action blocks, and home content",
    path: "/admin/home",
    icon: Home,
    category: "Site Structure",
    keywords: ["hero", "banner", "landing", "welcome", "slider", "cta", "featured"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "media-library",
    title: "Media Library",
    description: "Manage uploaded images, videos, documents, storage CDN links, and diagnostics",
    path: "/admin/media",
    icon: Image,
    category: "Site Structure",
    keywords: ["images", "photos", "files", "storage", "upload", "cdn", "bucket", "documents", "gallery", "assets"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "site-settings",
    title: "Site Settings",
    description: "Branding, logos, theme defaults, SEO meta, social links, and contact parameters",
    path: "/admin/settings",
    icon: Settings,
    category: "Site Structure",
    keywords: ["logo", "branding", "theme", "config", "contact", "email", "metadata", "social"],
    roles: ["admin", "super_admin"],
  },
  {
    id: "user-management",
    title: "User Management & Roles",
    description: "Assign user roles (Admin, Editor, Manager), invite staff, and manage permissions",
    path: "/admin/users",
    icon: UserCog,
    category: "Administration",
    keywords: ["users", "accounts", "permissions", "roles", "admin", "super_admin", "security", "access"],
    roles: ["admin", "super_admin"],
  },

  // Core Content
  {
    id: "about-page",
    title: "About BMES",
    description: "Manage organizational mission, history, core values, and executive leadership",
    path: "/admin/about",
    icon: FileText,
    category: "Core Content",
    keywords: ["history", "mission", "vision", "leadership", "story", "executives", "organization"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "academics",
    title: "Academics & Curriculum",
    description: "Manage syllabus, academic tracks, laboratory curricula, and degree courses",
    path: "/admin/academics",
    icon: GraduationCap,
    category: "Core Content",
    keywords: ["courses", "syllabus", "curriculum", "bme", "studies", "classes", "education"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "research",
    title: "Research & Labs",
    description: "Showcase biomedical engineering laboratories, active research projects, and publications",
    path: "/admin/research",
    icon: Microscope,
    category: "Core Content",
    keywords: ["papers", "publications", "labs", "science", "biomedical", "grants", "innovation"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "portal",
    title: "Student & Member Portal",
    description: "Manage portal landing page, quick access cards, and member resource directories",
    path: "/admin/portal",
    icon: FileText,
    category: "Core Content",
    keywords: ["portal", "students", "downloads", "resources", "library", "links"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "notices",
    title: "Notices & Announcements",
    description: "Publish urgent alerts, department news, official circulars, and notifications",
    path: "/admin/notices",
    icon: Bell,
    category: "Core Content",
    keywords: ["news", "announcements", "circulars", "alerts", "updates", "broadcasts"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "faq",
    title: "Frequently Asked Questions",
    description: "Manage categorized Q&A items, student help center, and admission FAQs",
    path: "/admin/faq",
    icon: HelpCircle,
    category: "Core Content",
    keywords: ["questions", "answers", "help", "support", "inquiries", "knowledgebase"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },

  // Community
  {
    id: "people",
    title: "Faculty & Members Directory",
    description: "Manage faculty profiles, student executive committee, advisors, and general members",
    path: "/admin/people",
    icon: Users,
    category: "Community",
    keywords: ["faculty", "professors", "committee", "executives", "team", "members", "staff"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "alumni",
    title: "Alumni Network",
    description: "Manage alumni spotlights, career trajectories, graduation cohorts, and stories",
    path: "/admin/alumni",
    icon: GraduationCap,
    category: "Community",
    keywords: ["graduates", "careers", "industry", "alumni", "network", "success"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "blog",
    title: "Blog & Articles",
    description: "Write, draft, and publish biomedical engineering articles, interviews, and posts",
    path: "/admin/blog",
    icon: FileText,
    category: "Community",
    keywords: ["articles", "posts", "writing", "editor", "stories", "biomedical", "newsletter"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },

  // Engagement
  {
    id: "events",
    title: "Events & Workshops",
    description: "Organize symposiums, guest lectures, technical workshops, and upcoming meetups",
    path: "/admin/events",
    icon: Calendar,
    category: "Engagement",
    keywords: ["workshops", "webinars", "calendar", "symposium", "conference", "meetups", "seminars"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "projects",
    title: "Student & Department Projects",
    description: "Showcase biomedical devices, design projects, innovations, and capstone work",
    path: "/admin/projects",
    icon: FolderOpen,
    category: "Engagement",
    keywords: ["devices", "hardware", "software", "prototypes", "innovation", "capstone", "portfolio"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "achievements",
    title: "Achievements & Awards",
    description: "Highlight national competitions, hackathon awards, student recognitions, and honors",
    path: "/admin/achievements",
    icon: Trophy,
    category: "Engagement",
    keywords: ["awards", "competitions", "hackathons", "honors", "recognition", "medals", "prizes"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },
  {
    id: "activities",
    title: "Club Activities",
    description: "Record industrial visits, outreach programs, volunteer sessions, and social drives",
    path: "/admin/activities",
    icon: CalendarDays,
    category: "Engagement",
    keywords: ["visits", "tours", "outreach", "drives", "social", "extracurricular"],
    roles: ["admin", "super_admin", "editor", "content_manager"],
  },

  // User Data
  {
    id: "contact-submissions",
    title: "Contact Inquiries & Submissions",
    description: "Review messages sent via contact forms, inquiries, and inbound messages",
    path: "/admin/submissions",
    icon: Inbox,
    category: "User Data",
    keywords: ["messages", "inquiries", "inbox", "feedback", "leads", "contact form"],
    roles: ["admin", "super_admin", "user", "editor", "content_manager"],
  },
  {
    id: "event-registrations",
    title: "Event Registrations",
    description: "Track RSVPs, ticket bookings, attendee rosters, and check-in records",
    path: "/admin/registrations",
    icon: CalendarDays,
    category: "User Data",
    keywords: ["attendees", "rsvps", "tickets", "participants", "bookings", "signups"],
    roles: ["admin", "super_admin", "user", "editor", "content_manager"],
  },
  {
    id: "membership-applications",
    title: "Membership Applications",
    description: "Process new student membership forms, verify departments, and approve candidates",
    path: "/admin/membership",
    icon: UserCheck,
    category: "User Data",
    keywords: ["applications", "recruitment", "candidates", "approvals", "members", "forms"],
    roles: ["admin", "super_admin", "user", "editor", "content_manager"],
  },
];

interface AdminCommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerClassName?: string;
  showTriggerButton?: boolean;
}

export const AdminCommandPalette: React.FC<AdminCommandPaletteProps> = ({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  triggerClassName,
  showTriggerButton = true,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { hasRole, isAdmin } = useAuth();

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? setControlledOpen! : setInternalOpen;

  // Detect OS for keyboard shortcut representation (⌘K for Mac, Ctrl+K for others)
  const isMac = useMemo(() => {
    return typeof window !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  }, []);

  // Global Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsOpen]);

  // Filter accessible pages based on authenticated role
  const accessiblePages = useMemo(() => {
    return ADMIN_PAGES.filter((page) => {
      if (!page.roles) return true;
      if (isAdmin) return true;
      return hasRole(page.roles);
    });
  }, [hasRole, isAdmin]);

  // Group pages by category
  const categories = useMemo(() => {
    const groups: { [key: string]: AdminPageItem[] } = {};
    accessiblePages.forEach((page) => {
      if (!groups[page.category]) {
        groups[page.category] = [];
      }
      groups[page.category].push(page);
    });
    return groups;
  }, [accessiblePages]);

  const handleSelectPage = (path: string, external?: boolean) => {
    setIsOpen(false);
    setSearchQuery("");
    if (external) {
      window.open(path, "_blank", "noopener,noreferrer");
    } else {
      navigate(path);
    }
  };

  return (
    <>
      {showTriggerButton && (
        <button
          type="button"
          id="admin-global-search-trigger"
          onClick={() => setIsOpen(true)}
          className={
            triggerClassName ||
            `flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-card hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-48 sm:w-64 md:w-72 justify-between`
          }
          title="Search admin management pages (Ctrl + K)"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">Search admin pages...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
            {isMac ? "⌘" : "Ctrl+"}K
          </kbd>
        </button>
      )}

      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <CommandInput
            placeholder="Type a page name, section, or keyword (e.g. media, users, events, logo)..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded bg-muted"
            >
              Clear
            </button>
          )}
        </div>

        <CommandList className="max-h-[380px] overflow-y-auto p-2">
          <CommandEmpty className="py-8 text-center text-sm">
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Search className="h-8 w-8 text-muted-foreground/40" />
              <p className="font-medium text-foreground">No matching admin pages found</p>
              <p className="text-xs max-w-xs text-muted-foreground">
                Try searching for terms like "media", "users", "events", "research", or "settings".
              </p>
            </div>
          </CommandEmpty>

          {/* Quick Actions Group */}
          <CommandGroup heading="⚡ Quick Navigation & Actions">
            <CommandItem
              value="view-public-site-home"
              onSelect={() => handleSelectPage("/", true)}
              className="flex items-center justify-between cursor-pointer py-2.5 px-3 rounded-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <ExternalLink className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium text-sm text-foreground flex items-center gap-1.5">
                    <span>View Public Website</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal">
                      New Tab
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Open the live public BMES website in a new window</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/60" />
            </CommandItem>

            <CommandItem
              value="view-public-portal-directory"
              onSelect={() => handleSelectPage("/portal", true)}
              className="flex items-center justify-between cursor-pointer py-2.5 px-3 rounded-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/60 text-accent-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium text-sm text-foreground">Open Student & Member Portal</div>
                  <p className="text-xs text-muted-foreground">Quick access to member downloads and public resources</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/60" />
            </CommandItem>
          </CommandGroup>

          <CommandSeparator className="my-2" />

          {/* Render All Admin Categories */}
          {Object.entries(categories).map(([categoryName, pages]) => (
            <CommandGroup key={categoryName} heading={categoryName}>
              {pages.map((page) => {
                const IconComponent = page.icon;
                return (
                  <CommandItem
                    key={page.id}
                    value={`${page.title} ${page.path} ${page.keywords.join(" ")} ${page.description}`}
                    onSelect={() => handleSelectPage(page.path)}
                    className="flex items-center justify-between cursor-pointer py-2.5 px-3 rounded-md group hover:bg-accent"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-foreground flex items-center gap-2">
                          <span className="truncate">{page.title}</span>
                          <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 px-1 rounded">
                            {page.path}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-md">
                          {page.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>

        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-muted-foreground bg-muted/30">
          <div className="flex items-center gap-2">
            <span>Use</span>
            <kbd className="rounded border bg-background px-1 py-0.5 font-mono text-[10px]">↑</kbd>
            <kbd className="rounded border bg-background px-1 py-0.5 font-mono text-[10px]">↓</kbd>
            <span>to navigate</span>
            <kbd className="rounded border bg-background px-1 py-0.5 font-mono text-[10px]">↵</kbd>
            <span>to select</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="rounded border bg-background px-1 py-0.5 font-mono text-[10px]">ESC</kbd>
            <span>to close</span>
          </div>
        </div>
      </CommandDialog>
    </>
  );
};

export default AdminCommandPalette;
