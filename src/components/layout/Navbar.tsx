import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User as UserIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import defaultLogo from "@/assets/logo.png";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  const { data: pages } = useQuery({
    queryKey: ["nav-pages"],
    queryFn: async () => {
      const { data } = await supabase.from("pages").select("*").eq("is_visible", true).order("display_order");
      return data ?? [];
    },
    staleTime: 60000
  });

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings-nav"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("setting_key, setting_value").in("setting_key", ["logo_url", "site_title"]);
      const map: Record<string, string> = {};
      data?.forEach((s) => {map[s.setting_key] = s.setting_value ?? "";});
      return map;
    },
    staleTime: 60000
  });

  const logoUrl = siteSettings?.logo_url || "";
  const siteName = siteSettings?.site_title || "CUET BMES";

  const navLinks = pages?.length ? pages.map((p) => ({ label: p.page_name, path: p.slug })) : [
    { label: "Home", path: "/" },
    { label: "About", path: "/about" },
    { label: "Academics", path: "/academics" },
    { label: "People", path: "/people" },
    { label: "Research", path: "/research" },
    { label: "Activities", path: "/activities" },
    { label: "Achievements", path: "/achievements" },
    { label: "Blog", path: "/blog" },
    { label: "Portal", path: "/portal" },
    { label: "Alumni", path: "/alumni" },
    { label: "Contact", path: "/contact" }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src={logoUrl || defaultLogo}
            alt={siteName}
            className="h-12 w-auto object-contain" />
          
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-tight text-foreground">{siteName}</span>
            <span className="text-[10px] leading-tight text-muted-foreground"> Biomedical Engineering Society</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) =>
            <Link
              key={link.path}
              to={link.path}
              className={`group relative rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === link.path ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
              <span className={`absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-primary transition-transform duration-300 ${
                location.pathname === link.path ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              }`} />
            </Link>
          )}
          
          {isAdmin && (
            <Link
              to="/admin"
              className={`group relative rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary ${
                location.pathname.startsWith("/admin") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Admin
              <span className={`absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-primary transition-transform duration-300 ${
                location.pathname.startsWith("/admin") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              }`} />
            </Link>
          )}

          {user ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="ml-2 gap-2 text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="ml-2 gap-2 text-muted-foreground hover:text-foreground">
                <UserIcon className="h-4 w-4" />
                Login
              </Button>
            </Link>
          )}
        </nav>

        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <AnimatePresence>
        {mobileOpen &&
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="border-t border-border bg-background lg:hidden overflow-hidden"
        >
            <nav className="container flex flex-col gap-1 py-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {navLinks.map((link) =>
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:translate-x-1 border-l-2 ${
                    location.pathname === link.path ? "text-primary bg-primary/5 border-primary" : "text-muted-foreground border-transparent"
                  }`}
                >
                  {link.label}
                </Link>
              )}
            
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:translate-x-1 border-l-2 ${
                  location.pathname.startsWith("/admin") ? "text-primary bg-primary/5 border-primary" : "text-muted-foreground border-transparent"
                }`}
              >
                Admin Dashboard
              </Link>
            )}

            {user ? (
              <button
                onClick={() => {
                  handleSignOut();
                  setMobileOpen(false);
                }}
                className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <UserIcon className="h-4 w-4" />
                Login
              </Link>
            )}
            </nav>
          </motion.div>
        }
      </AnimatePresence>
    </header>);

};

export default Navbar;