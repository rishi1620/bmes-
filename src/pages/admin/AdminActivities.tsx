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
    try {
      const keysToSave = [
        "activities_hero_title",
        "activities_hero_subtitle",
        "activities_flagship_json",
        "activities_seminars_json",
        "activities_gallery_content",
        "activities_publications_content",
        "activities_publications_pdf_url"
      ];
      
      for (const key of keysToSave) {
        const { data: existing } = await supabase.from("site_settings").select("id").eq("setting_key", key).maybeSingle();
        
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
    } catch (error: any) {
      toast({ title: "Error saving content", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
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

  const flagshipEvents = getJsonArray("activities_flagship_json");
  const seminars = getJsonArray("activities_seminars_json");

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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Flagship Events</h2>
            <Button size="sm" variant="outline" onClick={() => updateJsonArray("activities_flagship_json", [...flagshipEvents, { title: "New Event", description: "" }])}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Event
            </Button>
          </div>
          <div className="space-y-4">
            {flagshipEvents.map((item: Record<string, unknown>, i: number) => (
              <div key={i} className="flex gap-4 items-start border p-4 rounded-md">
                <div className="grid gap-3 flex-1">
                  <div>
                    <Label className="text-xs">Event Title</Label>
                    <Input value={item.title} onChange={e => { const arr = [...flagshipEvents]; arr[i].title = e.target.value; updateJsonArray("activities_flagship_json", arr); }} />
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea value={item.description} onChange={e => { const arr = [...flagshipEvents]; arr[i].description = e.target.value; updateJsonArray("activities_flagship_json", arr); }} />
                  </div>
                </div>
                <Button variant="destructive" size="icon" onClick={() => { const arr = flagshipEvents.filter((_: Record<string, unknown>, idx: number) => idx !== i); updateJsonArray("activities_flagship_json", arr); }}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {flagshipEvents.length === 0 && <p className="text-sm text-muted-foreground">No flagship events added yet.</p>}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Seminars & Workshops</h2>
            <Button size="sm" variant="outline" onClick={() => updateJsonArray("activities_seminars_json", [...seminars, { title: "New Seminar", description: "" }])}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Seminar
            </Button>
          </div>
          <div className="space-y-4">
            {seminars.map((item: Record<string, unknown>, i: number) => (
              <div key={i} className="flex gap-4 items-start border p-4 rounded-md">
                <div className="grid gap-3 flex-1">
                  <div>
                    <Label className="text-xs">Seminar Title</Label>
                    <Input value={item.title} onChange={e => { const arr = [...seminars]; arr[i].title = e.target.value; updateJsonArray("activities_seminars_json", arr); }} />
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea value={item.description} onChange={e => { const arr = [...seminars]; arr[i].description = e.target.value; updateJsonArray("activities_seminars_json", arr); }} />
                  </div>
                </div>
                <Button variant="destructive" size="icon" onClick={() => { const arr = seminars.filter((_: Record<string, unknown>, idx: number) => idx !== i); updateJsonArray("activities_seminars_json", arr); }}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {seminars.length === 0 && <p className="text-sm text-muted-foreground">No seminars added yet.</p>}
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
