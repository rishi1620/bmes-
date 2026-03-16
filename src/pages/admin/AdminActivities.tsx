import { useEffect, useState } from "react";
import { Save, Plus, Trash } from "lucide-react";
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

const AdminActivities = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("setting_group", "activities_page");
      const map: Record<string, string> = {};
      (data as Setting[] | null)?.forEach((s) => { map[s.setting_key] = s.setting_value; });
      setSettings(map);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    
    const keysToSave = [
      "activities_hero_title",
      "activities_hero_subtitle",
      "activities_gallery_content",
      "activities_publications_content",
      "activities_publications_pdf_url"
    ];
    
    for (const key of keysToSave) {
      const { data: existing } = await supabase.from("site_settings").select("id").eq("setting_key", key).single();
      
      if (!existing) {
        await supabase.from("site_settings").insert({
          setting_group: "activities_page",
          setting_key: key,
          setting_value: settings[key] || ""
        });
      } else {
        await supabase.from("site_settings").update({ setting_value: settings[key] || "" }).eq("setting_key", key);
      }
    }

    toast({ title: "Activities page content saved" });
    setSaving(false);
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Helper for JSON arrays
  const getJsonArray = (key: string) => {
    try {
      return JSON.parse(settings[key] || "[]");
    } catch {
      return [];
    }
  };

  const updateJsonArray = (key: string, arr: Record<string, unknown>[]) => {
    updateSetting(key, JSON.stringify(arr));
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Activities Page Content</h1>
        <Button onClick={handleSave} size="sm" disabled={saving}>
          <Save className="mr-1.5 h-4 w-4" /> {saving ? "Saving…" : "Save All"}
        </Button>
      </div>

      <div className="space-y-8">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Hero Section</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={settings.activities_hero_title ?? ""} onChange={e => updateSetting("activities_hero_title", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Subtitle</Label>
              <Textarea value={settings.activities_hero_subtitle ?? ""} onChange={e => updateSetting("activities_hero_subtitle", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Gallery & Publications</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Gallery Content Text</Label>
              <Textarea value={settings.activities_gallery_content ?? ""} onChange={e => updateSetting("activities_gallery_content", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Publications Content Text</Label>
              <Textarea value={settings.activities_publications_content ?? ""} onChange={e => updateSetting("activities_publications_content", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Magazine/Newsletter PDF URL</Label>
              <Input value={settings.activities_publications_pdf_url ?? ""} onChange={e => updateSetting("activities_publications_pdf_url", e.target.value)} />
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminActivities;
