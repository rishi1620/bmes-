import { useEffect, useState } from "react";
import { Save, Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import MediaSelectorDialog from "@/components/admin/MediaSelectorDialog";

const AdminSiteSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({ logo_url: "", site_title: "" });

  const loadSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from("site_settings").select("setting_key, setting_value");
    const map: Record<string, string> = {};
    data?.forEach((s) => { map[s.setting_key] = s.setting_value ?? ""; });
    setSettings({
      logo_url: map.logo_url || "",
      site_title: map.site_title || "CUET BMES"
    });
    setLoading(false);
  };

  useEffect(() => { loadSettings(); }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from("site_settings")
          .upsert({ setting_key: key, setting_value: value }, { onConflict: "setting_key" });
        if (error) throw error;
      }
      toast({ title: "Settings updated successfully" });
    } catch (e: any) {
      toast({ title: "Error updating settings", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Site Settings</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="max-w-xl space-y-6 rounded-lg border border-border bg-card p-6">
          <div className="space-y-2">
            <Label>Site Title</Label>
            <Input value={settings.site_title} onChange={e => setSettings({...settings, site_title: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <div className="flex gap-2">
              <Input value={settings.logo_url} onChange={e => setSettings({...settings, logo_url: e.target.value})} />
              <MediaSelectorDialog 
                onSelect={(url) => setSettings({...settings, logo_url: url})} 
                trigger={<Button variant="outline">Select from Media</Button>}
              />
            </div>
            {settings.logo_url && (
              <img src={settings.logo_url} alt="Logo Preview" className="mt-2 h-16 w-auto rounded border p-1" />
            )}
          </div>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSiteSettings;
