import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home,
  BookOpen,
  Users,
  GraduationCap,
  Microscope,
  Calendar,
  Bell,
  Sparkles,
  FolderOpen,
  FileText,
  Mail,
  UserCheck,
  LayoutDashboard,
  Settings,
  Image,
  Inbox,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "event" | "blog" | "person";
  url: string;
}

export const GlobalCommandSearch = () => {
  const [open, setOpen] = useState(false);
  const [dbResults, setDbResults] = useState<SearchResultItem[]>([]);
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { user, hasRole } = useAuth();

  // Listen for Cmd+K / Ctrl+K and custom event
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    const handleCustomOpen = () => setOpen(true);

    document.addEventListener("keydown", down);
    window.addEventListener("bmes:open-search", handleCustomOpen);

    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("bmes:open-search", handleCustomOpen);
    };
  }, []);

  // Fetch quick searchable content (Events, Blogs, People)
  const fetchSearchData = useCallback(async () => {
    try {
      const [eventsRes, blogRes, peopleRes] = await Promise.all([
        supabase.from("events").select("id, title, date").order("date", { ascending: false }).limit(5),
        supabase.from("blog_posts").select("id, title, slug").limit(5),
        supabase.from("members").select("id, name, role").limit(5),
      ]);

      const items: SearchResultItem[] = [];

      if (eventsRes.data) {
        eventsRes.data.forEach((ev) => {
          items.push({
            id: `ev-${ev.id}`,
            title: ev.title,
            subtitle: ev.date || "Event",
            category: "event",
            url: "/events",
          });
        });
      }

      if (blogRes.data) {
        blogRes.data.forEach((b) => {
          items.push({
            id: `blog-${b.id}`,
            title: b.title,
            subtitle: "Article / News",
            category: "blog",
            url: b.slug ? `/blog/${b.slug}` : "/blog",
          });
        });
      }

      if (peopleRes.data) {
        peopleRes.data.forEach((p) => {
          items.push({
            id: `person-${p.id}`,
            title: p.name,
            subtitle: p.role || "Member",
            category: "person",
            url: "/people",
          });
        });
      }

      setDbResults(items);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchSearchData();
    }
  }, [open, fetchSearchData]);

  const handleSelect = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  const isAdmin = user && hasRole(["admin", "super_admin", "editor", "content_manager"]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search pages, notices, events..." />
      <CommandList className="max-h-[380px]">
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Public Navigation */}
        <CommandGroup heading="Public Pages">
          <CommandItem onSelect={() => handleSelect(() => navigate("/"))}>
            <Home className="mr-2 h-4 w-4 text-primary" />
            <span>Home</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/about"))}>
            <BookOpen className="mr-2 h-4 w-4 text-primary" />
            <span>About BMES</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/academics"))}>
            <GraduationCap className="mr-2 h-4 w-4 text-primary" />
            <span>Academics & Curriculum</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/people"))}>
            <Users className="mr-2 h-4 w-4 text-primary" />
            <span>Faculty & Team Members</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/research"))}>
            <Microscope className="mr-2 h-4 w-4 text-primary" />
            <span>Research & Laboratories</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/events"))}>
            <Calendar className="mr-2 h-4 w-4 text-primary" />
            <span>Events & Workshops</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/projects"))}>
            <FolderOpen className="mr-2 h-4 w-4 text-primary" />
            <span>Student Projects</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/notices"))}>
            <Bell className="mr-2 h-4 w-4 text-primary" />
            <span>Official Notices</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/portal"))}>
            <UserCheck className="mr-2 h-4 w-4 text-primary" />
            <span>Student Portal & Membership Form</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/blog"))}>
            <FileText className="mr-2 h-4 w-4 text-primary" />
            <span>Blog & Publications</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/achievements"))}>
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            <span>Achievements & Awards</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/alumni"))}>
            <GraduationCap className="mr-2 h-4 w-4 text-primary" />
            <span>Alumni Network</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/contact"))}>
            <Mail className="mr-2 h-4 w-4 text-primary" />
            <span>Contact Us</span>
          </CommandItem>
        </CommandGroup>

        {/* Dynamic Database Items */}
        {dbResults.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Latest Content">
              {dbResults.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleSelect(() => navigate(item.url))}
                >
                  {item.category === "event" && <Calendar className="mr-2 h-4 w-4 text-purple-500" />}
                  {item.category === "blog" && <FileText className="mr-2 h-4 w-4 text-blue-500" />}
                  {item.category === "person" && <Users className="mr-2 h-4 w-4 text-emerald-500" />}
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{item.title}</span>
                    {item.subtitle && <span className="text-xs text-muted-foreground">{item.subtitle}</span>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Admin Shortcuts (Visible for Admin Users) */}
        {isAdmin && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Admin Dashboard & Controls">
              <CommandItem onSelect={() => handleSelect(() => navigate("/admin"))}>
                <LayoutDashboard className="mr-2 h-4 w-4 text-amber-500" />
                <span>Admin Dashboard</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect(() => navigate("/admin/membership"))}>
                <UserCheck className="mr-2 h-4 w-4 text-emerald-500" />
                <span>Membership Applications</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect(() => navigate("/admin/submissions"))}>
                <Inbox className="mr-2 h-4 w-4 text-blue-500" />
                <span>Contact Submissions</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect(() => navigate("/admin/registrations"))}>
                <Calendar className="mr-2 h-4 w-4 text-purple-500" />
                <span>Event Registrations</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect(() => navigate("/admin/media"))}>
                <Image className="mr-2 h-4 w-4 text-teal-500" />
                <span>Media Library</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect(() => navigate("/admin/settings"))}>
                <Settings className="mr-2 h-4 w-4 text-zinc-500" />
                <span>Site Settings</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {/* Quick Utilities */}
        <CommandSeparator />
        <CommandGroup heading="Quick Preferences">
          <CommandItem onSelect={() => handleSelect(() => setTheme("light"))}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Set Light Theme</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => setTheme("dark"))}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Set Dark Theme</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => setTheme("system"))}>
            <Laptop className="mr-2 h-4 w-4" />
            <span>Use System Theme</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
