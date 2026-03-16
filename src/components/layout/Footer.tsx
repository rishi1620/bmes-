import { Link } from "react-router-dom";
import { Dna, Mail, MapPin, Phone, Facebook, Linkedin, Youtube } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NowCard } from "@/components/shared/NowCard";

const Footer = () => {
  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("setting_key, setting_value");
      const map: Record<string, string> = {};
      data?.forEach((s) => { map[s.setting_key] = s.setting_value ?? ""; });
      return map;
    },
  });

  const footerLogo = settings?.footer_logo_url || settings?.logo_url;

  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              {footerLogo ? (
                <img src={footerLogo} alt="CUET BMES" className="h-12 w-auto object-contain" />
              ) : (
                <>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                    <Dna className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-bold text-foreground">CUET BMES</span>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Advancing biomedical engineering through research, innovation, and community at Chittagong University of Engineering & Technology.
            </p>
            <div className="mt-6">
              <NowCard />
            </div>
            <div className="mt-6 flex gap-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Quick Links</h4>
            <div className="flex flex-col gap-2">
              {[
                { label: "About Us", path: "/about" },
                { label: "Academics", path: "/academics" },
                { label: "People", path: "/people" },
                { label: "Research", path: "/research" },
              ].map((l) => (
                <Link key={l.path} to={l.path} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Resources</h4>
            <div className="flex flex-col gap-2">
              {[
                { label: "Activities & Events", path: "/activities" },
                { label: "Achievements", path: "/achievements" },
                { label: "Blog & News", path: "/blog" },
                { label: "Student Portal", path: "/portal" },
                { label: "Alumni", path: "/alumni" },
                { label: "Contact Us", path: "/contact" },
              ].map((l) => (
                <Link key={l.path} to={l.path} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Contact</h4>
            <div className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /> CUET, Chittagong, Bangladesh</span>
              <span className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> bmes@cuet.ac.bd</span>
              <span className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> +880 1XXX-XXXXXX</span>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground flex flex-col md:flex-row justify-center items-center gap-4">
          <span>&copy; {new Date().getFullYear()} CUET Biomedical Engineering Society. All rights reserved.</span>
          <Link to="/admin" className="hover:text-primary transition-colors">Admin</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
