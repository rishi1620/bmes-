import { useEffect, useState, useCallback } from "react";
import { Save, RefreshCw, Image as ImageIcon, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import MediaSelectorDialog from "@/components/admin/MediaSelectorDialog";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

interface Setting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_group: string;
}

const groups: { key: string; label: string; fields: { key: string; label: string; type?: "text" | "textarea" }[] }[] = [
  {
    key: "branding",
    label: "Branding",
    fields: [
      { key: "site_title", label: "Site Title" },
      { key: "logo_url", label: "Logo URL" },
      { key: "dashboard_logo_url", label: "Dashboard Logo URL" },
      { key: "footer_logo_url", label: "Footer Logo URL" },
      { key: "favicon_url", label: "Favicon URL" },
      { key: "footer_text", label: "Footer Text", type: "textarea" },
    ],
  },
  {
    key: "seo",
    label: "SEO",
    fields: [
      { key: "meta_description", label: "Meta Description", type: "textarea" },
    ],
  },
  {
    key: "general",
    label: "Contact Info",
    fields: [
      { key: "contact_email", label: "Email" },
      { key: "contact_phone", label: "Phone" },
      { key: "contact_address", label: "Address" },
    ],
  },
  {
    key: "home_hero",
    label: "Home Page Hero",
    fields: [
      { key: "home_hero_title", label: "Hero Title" },
      { key: "home_hero_subtitle", label: "Hero Subtitle" },
      { key: "home_hero_description", label: "Hero Description", type: "textarea" },
      { key: "home_hero_bg_image", label: "Background Image URL" },
      { key: "home_hero_button_text", label: "Button Text" },
      { key: "home_hero_button_link", label: "Button Link" },
    ],
  },
  {
    key: "social",
    label: "Social Links",
    fields: [
      { key: "facebook_url", label: "Facebook" },
      { key: "instagram_url", label: "Instagram" },
      { key: "linkedin_url", label: "LinkedIn" },
      { key: "twitter_url", label: "Twitter / X" },
      { key: "youtube_url", label: "YouTube" },
    ],
  },
];

const AdminSettings = () => {
  const { isAdmin, hasRole } = useAuth();
  const canManageSettings = isAdmin || hasRole(["admin", "super_admin"]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!canManageSettings) return;
    setLoading(true);
    try {
      const { data } = await supabase.from("site_settings").select("*");
      const map: Record<string, string> = {};
      (data as Setting[] | null)?.forEach((s) => { map[s.setting_key] = s.setting_value; });
      setSettings(map);
    } finally {
      setLoading(false);
    }
  }, [canManageSettings]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    const updates = groups.flatMap(group => 
      group.fields.map(field => {
        const value = settings[field.key] || "";
        return supabase.from("site_settings").upsert({ 
          setting_key: field.key, 
          setting_value: value,
          setting_group: group.key
        }, { onConflict: "setting_key" });
      })
    );
    const results = await Promise.all(updates);
    const hasError = results.some((r) => r.error);
    if (hasError) toast({ title: "Some settings failed to save", variant: "destructive" });
    else toast({ title: "Settings saved" });
    setSaving(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  if (!canManageSettings) {
    return (
      <AdminLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground mt-2">You don't have permission to manage site settings.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex items-center justify-between"
      >
        <h1 className="text-2xl font-bold text-foreground">Site Settings</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button onClick={handleSave} size="sm" disabled={saving}>
            <Save className="mr-1.5 h-4 w-4" /> {saving ? "Saving…" : "Save All"}
          </Button>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {groups.map((group) => (
          <motion.div variants={itemVariants} key={group.key} className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-4 text-lg font-semibold text-foreground">{group.label}</h2>
            <div className="space-y-4">
              {group.fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label>{field.label}</Label>
                  <div className="flex gap-2">
                    {field.type === "textarea" ? (
                      <Textarea
                        value={settings[field.key] ?? ""}
                        onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                      />
                    ) : (
                      <Input
                        value={settings[field.key] ?? ""}
                        onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                      />
                    )}
                    {(field.key.includes("url") || field.key.includes("image")) && (
                      <MediaSelectorDialog 
                        onSelect={(url) => setSettings({ ...settings, [field.key]: url })}
                        trigger={<Button variant="outline" size="icon" title="Open Media Library"><ImageIcon className="h-4 w-4" /></Button>}
                      />
                    )}
                  </div>
                  {(field.key.includes("url") || field.key.includes("image")) && settings[field.key] && (
                    <div className="mt-2">
                      <img 
                        src={settings[field.key]} 
                        alt={field.label} 
                        className="h-20 w-auto rounded border object-contain bg-muted" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </AdminLayout>
  );
};

export default AdminSettings;
