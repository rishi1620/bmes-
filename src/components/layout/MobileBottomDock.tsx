import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Bell,
  Sparkles,
  Users,
  Compass,
  Search,
  BookOpen,
  Calendar,
  Microscope,
  Award,
  Layers,
  FileText,
  Mail,
  GraduationCap,
  Info,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

const primaryNavItems: NavItem[] = [
  { label: "Home", path: "/", icon: Home },
  { label: "Notices", path: "/notices", icon: Bell },
  { label: "Portal", path: "/portal", icon: Sparkles },
  { label: "People", path: "/people", icon: Users },
];

const secondaryNavCategories = [
  {
    title: "Academic & Research",
    items: [
      { label: "Academics", path: "/academics", icon: BookOpen, desc: "Curriculum, syllabus & courses" },
      { label: "Research & Labs", path: "/research", icon: Microscope, desc: "Laboratories & publications" },
      { label: "Featured Projects", path: "/projects", icon: Layers, desc: "Student innovations & bionics" },
    ],
  },
  {
    title: "Events & Community",
    items: [
      { label: "Events & Workshops", path: "/events", icon: Calendar, desc: "Bootcamps, hackathons & seminars" },
      { label: "Activities", path: "/activities", icon: Layers, desc: "Club programs & outreach" },
      { label: "Achievements", path: "/achievements", icon: Award, desc: "Competitions, awards & grants" },
      { label: "Alumni Network", path: "/alumni", icon: GraduationCap, desc: "Global graduates & testimonials" },
      { label: "Blog & News", path: "/blog", icon: FileText, desc: "Articles & scientific perspectives" },
    ],
  },
  {
    title: "Society & Help",
    items: [
      { label: "About BMES", path: "/about", icon: Info, desc: "Vision, mission & constitution" },
      { label: "Contact Us", path: "/contact", icon: Mail, desc: "Location & departmental office" },
    ],
  },
];

export const MobileBottomDock: React.FC = () => {
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Check if current path matches
  const isPathActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const isMoreActive = !primaryNavItems.some((item) => isPathActive(item.path));

  const handleOpenSearch = () => {
    setSheetOpen(false);
    // Slight delay to ensure sheet close animation doesn't collide
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("bmes:open-search"));
    }, 150);
  };

  return (
    <nav
      aria-label="Mobile navigation dock"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden pointer-events-none"
    >
      <div className="mx-auto px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-1 w-full max-w-lg pointer-events-auto">
        <div className="relative flex items-center justify-around rounded-2xl border border-border/80 bg-background/90 px-1.5 py-1 shadow-[0_-4px_20px_rgba(0,0,0,0.06),0_10px_30px_rgba(0,0,0,0.1)] backdrop-blur-xl dark:bg-background/90 dark:border-border/60 dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = isPathActive(item.path);
            const isPortal = item.path === "/portal";

            if (isPortal) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className="group relative flex flex-col items-center justify-center -mt-4 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-300 active:scale-95 ${
                      active
                        ? "bg-primary text-primary-foreground shadow-primary/30 ring-4 ring-primary/20 scale-105"
                        : "bg-gradient-to-tr from-primary via-primary/90 to-accent text-primary-foreground shadow-primary/20 hover:scale-105"
                    }`}
                  >
                    <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                  </div>
                  <span
                    className={`mt-1 text-[11px] font-semibold tracking-tight transition-colors ${
                      active ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className="group relative flex flex-1 flex-col items-center justify-center py-1.5 px-1 text-center transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`h-5 w-5 transition-all duration-200 ${
                      active
                        ? "text-primary scale-110 stroke-[2.5]"
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                  {active && (
                    <motion.div
                      layoutId="mobile-dock-active-pill"
                      className="absolute -inset-1.5 -z-10 rounded-xl bg-primary/10 dark:bg-primary/20"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </div>
                <span
                  className={`mt-1 text-[10px] tracking-tight leading-none transition-colors ${
                    active ? "font-semibold text-primary" : "font-medium text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More / Explore Sheet Trigger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="More navigation options"
                className="group relative flex flex-1 flex-col items-center justify-center py-1.5 px-1 text-center transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
              >
                <div className="relative flex items-center justify-center">
                  <Compass
                    className={`h-5 w-5 transition-all duration-200 ${
                      isMoreActive
                        ? "text-primary scale-110 stroke-[2.5]"
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                  {isMoreActive && (
                    <motion.div
                      layoutId="mobile-dock-active-pill"
                      className="absolute -inset-1.5 -z-10 rounded-xl bg-primary/10 dark:bg-primary/20"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </div>
                <span
                  className={`mt-1 text-[10px] tracking-tight leading-none transition-colors ${
                    isMoreActive ? "font-semibold text-primary" : "font-medium text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  Explore
                </span>
              </button>
            </SheetTrigger>

            <SheetContent
              side="bottom"
              className="max-h-[85vh] rounded-t-3xl border-t border-border/80 bg-background/95 backdrop-blur-2xl px-5 pt-3 pb-8 overflow-y-auto"
            >
              <SheetHeader className="text-left pb-3 border-b border-border/60">
                {/* Pull handle indicator */}
                <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-muted-foreground/20" />
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-lg font-bold text-foreground">
                    Explore CUET BMES
                  </SheetTitle>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Quick access to all society departments, resources & portals
                </p>
              </SheetHeader>

              {/* Quick Action Search Bar */}
              <div className="pt-4 pb-2">
                <Button
                  variant="outline"
                  onClick={handleOpenSearch}
                  className="w-full justify-between h-11 px-3.5 bg-muted/40 hover:bg-muted/70 border-border/80 text-muted-foreground rounded-xl"
                >
                  <div className="flex items-center gap-2.5">
                    <Search className="h-4 w-4 text-primary" />
                    <span className="text-sm font-normal text-foreground">Search pages, notices, events...</span>
                  </div>
                  <kbd className="pointer-events-none rounded border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                    ⌘K
                  </kbd>
                </Button>
              </div>

              {/* Nav Categories */}
              <div className="space-y-5 pt-2">
                {secondaryNavCategories.map((category) => (
                  <div key={category.title} className="space-y-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 px-1">
                      {category.title}
                    </h4>
                    <div className="grid grid-cols-1 gap-1.5">
                      {category.items.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const active = isPathActive(subItem.path);

                        return (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            onClick={() => setSheetOpen(false)}
                            className={`flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200 active:scale-[0.99] ${
                              active
                                ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                                : "hover:bg-muted/60 text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                                  active
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                <SubIcon className="h-4 w-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium leading-tight">
                                  {subItem.label}
                                </span>
                                <span className="text-[11px] text-muted-foreground line-clamp-1">
                                  {subItem.desc}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default MobileBottomDock;
