import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

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
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("site_settings").select("*");
      const map: Record<string, string> = {};
      (data as Setting[] | null)?.forEach((s) => { map[s.setting_key] = s.setting_value; });
      setSettings(map);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([setting_key, setting_value]) =>
        supabase.from("site_settings").update({ setting_value }).eq("setting_key", setting_key)
      );
      const results = await Promise.all(updates);
      const hasError = results.some((r) => r.error);
      if (hasError) toast({ title: "Some settings failed to save", variant: "destructive" });
      else toast({ title: "Settings saved" });
    } catch (error: any) {
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Site Settings</h1>
        <Button onClick={handleSave} size="sm" disabled={saving}>
          <Save className="mr-1.5 h-4 w-4" /> {saving ? "Saving…" : "Save All"}
        </Button>
      </div>

      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group.key} className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-4 text-lg font-semibold text-foreground">{group.label}</h2>
            <div className="space-y-4">
              {group.fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label>{field.label}</Label>
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
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
