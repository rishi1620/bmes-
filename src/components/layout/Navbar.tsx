import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import defaultLogo from "@/assets/logo.png";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

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
  { label: "Portal", path: "/portal" },
  { label: "Alumni", path: "/alumni" },
  { label: "Contact", path: "/contact" }];


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
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground ${
            location.pathname === link.path ? "text-primary" : "text-muted-foreground"}`
            }>
            
              {link.label}
            </Link>
          )}
        </nav>

        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen &&
      <div className="border-t border-border bg-background lg:hidden">
          <nav className="container flex flex-col gap-1 py-4">
            {navLinks.map((link) =>
          <Link
            key={link.path}
            to={link.path}
            onClick={() => setMobileOpen(false)}
            className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted ${
            location.pathname === link.path ? "text-primary bg-muted" : "text-muted-foreground"}`
            }>
            
                {link.label}
              </Link>
          )}
          </nav>
        </div>
      }
    </header>);

};

export default Navbar;