import { useEffect, useState, useCallback } from "react";
import { Save, Plus, Trash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Setting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_group: string;
}

interface Notice {
  id: string;
  title: string;
  date: string;
  content: string;
  category?: "departmental" | "club";
}

const AdminNotices = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("site_settings").select("*").eq("setting_group", "portal_page");
    const map: Record<string, string> = {};
    (data as Setting[] | null)?.forEach((s) => { map[s.setting_key] = s.setting_value; });
    setSettings(map);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    
    const keysToSave = [
      "portal_dept_notices_title",
      "portal_club_news_title",
      "portal_notices_content",
      "portal_notices_json"
    ];
    
    try {
      for (const key of keysToSave) {
        const { data: existing, error } = await supabase.from("site_settings").select("id").eq("setting_key", key).maybeSingle();
        
        if (error) {
          console.error("Error fetching setting:", key, error);
          continue;
        }

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

      toast({ title: "Notices saved successfully" });
    } catch (e) {
      console.error(e);
      toast({ title: "Error saving notices", variant: "destructive" });
    } finally {
      setSaving(false);
    }
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

  const updateJsonArray = (key: string, arr: unknown[]) => {
    updateSetting(key, JSON.stringify(arr));
  };

  const notices: Notice[] = getJsonArray("portal_notices_json");

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Notice Board Management</h1>
        <Button onClick={handleSave} size="sm" disabled={saving}>
          <Save className="mr-1.5 h-4 w-4" /> {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Notices</CardTitle>
            <Button size="sm" variant="outline" onClick={() => updateJsonArray("portal_notices_json", [{ id: Date.now().toString(), title: "New Notice", date: new Date().toISOString().split('T')[0], content: "", category: "departmental" }, ...notices])}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Notice
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Departmental Notices Title</Label>
                <Input placeholder="Departmental Notices" value={settings.portal_dept_notices_title ?? ""} onChange={e => updateSetting("portal_dept_notices_title", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Club News Title</Label>
                <Input placeholder="Club News" value={settings.portal_club_news_title ?? ""} onChange={e => updateSetting("portal_club_news_title", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5 mb-6">
              <Label>Notice Board Description (Optional)</Label>
              <Textarea placeholder="Official announcements and academic updates." value={settings.portal_notices_content ?? ""} onChange={e => updateSetting("portal_notices_content", e.target.value)} />
            </div>
            
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Manage Notices</h3>
                <div className="flex gap-2">
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600">
                    Dept
                  </span>
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                    Club
                  </span>
                </div>
              </div>
              {notices.map((item: Notice, i: number) => (
                <div key={item.id || i} className={`flex gap-4 items-start border p-4 rounded-md transition-colors ${item.category === 'club' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-border bg-card'}`}>
                  <div className="grid gap-3 flex-1">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Title</Label>
                        <Input value={item.title} onChange={e => { const arr = [...notices]; arr[i].title = e.target.value; updateJsonArray("portal_notices_json", arr); }} />
                      </div>
                      <div>
                        <Label className="text-xs">Date</Label>
                        <Input type="date" value={item.date} onChange={e => { const arr = [...notices]; arr[i].date = e.target.value; updateJsonArray("portal_notices_json", arr); }} />
                      </div>
                      <div>
                        <Label className="text-xs">Category</Label>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={item.category || "departmental"}
                          onChange={e => { const arr = [...notices]; arr[i].category = e.target.value as "departmental" | "club"; updateJsonArray("portal_notices_json", arr); }}
                        >
                          <option value="departmental">Departmental</option>
                          <option value="club">Club News</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Content</Label>
                      <Textarea value={item.content} onChange={e => { const arr = [...notices]; arr[i].content = e.target.value; updateJsonArray("portal_notices_json", arr); }} />
                    </div>
                  </div>
                  <Button variant="destructive" size="icon" onClick={() => { const arr = notices.filter((_: unknown, idx: number) => idx !== i); updateJsonArray("portal_notices_json", arr); }}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {notices.length === 0 && <p className="text-sm text-muted-foreground">No notices added yet.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminNotices;
