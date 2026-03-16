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

const AdminPortal = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("setting_group", "portal_page");
      const map: Record<string, string> = {};
      (data as Setting[] | null)?.forEach((s) => { map[s.setting_key] = s.setting_value; });
      setSettings(map);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    
    const keysToSave = [
      "portal_hero_title",
      "portal_hero_subtitle",
      "portal_notices_content",
      "portal_notices_json",
      "portal_library_content",
      "portal_software_json",
      "portal_membership_content",
      "portal_membership_url"
    ];
    
    for (const key of keysToSave) {
      const { data: existing } = await supabase.from("site_settings").select("id").eq("setting_key", key).single();
      
      if (!existing) {
        await supabase.from("site_settings").insert({
          setting_group: "portal_page",
          setting_key: key,
          setting_value: settings[key] || ""
        });
      } else {
        await supabase.from("site_settings").update({ setting_value: settings[key] || "" }).eq("setting_key", key);
      }
    }

    toast({ title: "Portal page content saved" });
    setSaving(false);
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getJsonArray = (key: string) => {
    try {
      return JSON.parse(settings[key] || "[]");
    } catch {
      return [];
    }
  };

  const updateJsonArray = (key: string, arr: any[]) => {
    updateSetting(key, JSON.stringify(arr));
  };

  const softwareLinks = getJsonArray("portal_software_json");
  const notices = getJsonArray("portal_notices_json");

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Portal Page Content</h1>
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
              <Input value={settings.portal_hero_title ?? ""} onChange={e => updateSetting("portal_hero_title", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Subtitle</Label>
              <Textarea value={settings.portal_hero_subtitle ?? ""} onChange={e => updateSetting("portal_hero_subtitle", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Notices & Announcements</h2>
            <Button size="sm" variant="outline" onClick={() => updateJsonArray("portal_notices_json", [{ id: Date.now().toString(), title: "New Notice", date: new Date().toISOString().split('T')[0], content: "" }, ...notices])}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Notice
            </Button>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5 mb-6">
              <Label>Notice Board Description (Optional)</Label>
              <Textarea value={settings.portal_notices_content ?? ""} onChange={e => updateSetting("portal_notices_content", e.target.value)} />
            </div>
            
            <div className="space-y-4 border-t pt-4">
              {notices.map((item: any, i: number) => (
                <div key={item.id || i} className="flex gap-4 items-start border p-4 rounded-md">
                  <div className="grid gap-3 flex-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Title</Label>
                        <Input value={item.title} onChange={e => { const arr = [...notices]; arr[i].title = e.target.value; updateJsonArray("portal_notices_json", arr); }} />
                      </div>
                      <div>
                        <Label className="text-xs">Date</Label>
                        <Input type="date" value={item.date} onChange={e => { const arr = [...notices]; arr[i].date = e.target.value; updateJsonArray("portal_notices_json", arr); }} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Content</Label>
                      <Textarea value={item.content} onChange={e => { const arr = [...notices]; arr[i].content = e.target.value; updateJsonArray("portal_notices_json", arr); }} />
                    </div>
                  </div>
                  <Button variant="destructive" size="icon" onClick={() => { const arr = notices.filter((_: any, idx: number) => idx !== i); updateJsonArray("portal_notices_json", arr); }}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {notices.length === 0 && <p className="text-sm text-muted-foreground">No notices added yet.</p>}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Resource Library</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Resource Library Content</Label>
              <Textarea value={settings.portal_library_content ?? ""} onChange={e => updateSetting("portal_library_content", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Software Links</h2>
            <Button size="sm" variant="outline" onClick={() => updateJsonArray("portal_software_json", [...softwareLinks, { title: "New Software", description: "", url: "" }])}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Software
            </Button>
          </div>
          <div className="space-y-4">
            {softwareLinks.map((item: any, i: number) => (
              <div key={i} className="flex gap-4 items-start border p-4 rounded-md">
                <div className="grid gap-3 flex-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Software Name</Label>
                      <Input value={item.title} onChange={e => { const arr = [...softwareLinks]; arr[i].title = e.target.value; updateJsonArray("portal_software_json", arr); }} />
                    </div>
                    <div>
                      <Label className="text-xs">Link URL</Label>
                      <Input value={item.url} onChange={e => { const arr = [...softwareLinks]; arr[i].url = e.target.value; updateJsonArray("portal_software_json", arr); }} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea value={item.description} onChange={e => { const arr = [...softwareLinks]; arr[i].description = e.target.value; updateJsonArray("portal_software_json", arr); }} />
                  </div>
                </div>
                <Button variant="destructive" size="icon" onClick={() => { const arr = softwareLinks.filter((_: any, idx: number) => idx !== i); updateJsonArray("portal_software_json", arr); }}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {softwareLinks.length === 0 && <p className="text-sm text-muted-foreground">No software links added yet.</p>}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Membership Portal</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Membership Content</Label>
              <Textarea value={settings.portal_membership_content ?? ""} onChange={e => updateSetting("portal_membership_content", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Registration/Renewal Form URL</Label>
              <Input value={settings.portal_membership_url ?? ""} onChange={e => updateSetting("portal_membership_url", e.target.value)} />
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminPortal;
