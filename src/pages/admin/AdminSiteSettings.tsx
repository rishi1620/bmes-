import { useEffect, useState, useCallback } from "react";
import { Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import MediaSelectorDialog from "@/components/admin/MediaSelectorDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminSiteSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({ logo_url: "", site_title: "", dashboard_logo_url: "", footer_logo_url: "" });

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("site_settings").select("setting_key, setting_value");
    const map: Record<string, string> = {};
    data?.forEach((s) => { map[s.setting_key] = s.setting_value ?? ""; });
    setSettings({
      logo_url: map.logo_url || "",
      site_title: map.site_title || "CUET BMES",
      dashboard_logo_url: map.dashboard_logo_url || "",
      footer_logo_url: map.footer_logo_url || ""
    });
    setLoading(false);
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

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
    } catch (e) {
      toast({ title: "Error updating settings", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
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
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="text-lg">Site Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Site Title</Label>
              <Input value={settings.site_title} onChange={e => setSettings({...settings, site_title: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Logo URL (Main Site)</Label>
              <div className="flex gap-2">
                <Input value={settings.logo_url} onChange={e => setSettings({...settings, logo_url: e.target.value})} />
                <MediaSelectorDialog 
                  onSelect={(url) => setSettings({...settings, logo_url: url})} 
                  trigger={<Button variant="outline">Select</Button>}
                />
              </div>
              {settings.logo_url && (
                <img src={settings.logo_url} alt="Logo Preview" className="mt-2 h-16 w-auto rounded border p-1" />
              )}
            </div>

            <div className="space-y-2">
              <Label>Dashboard Logo URL (Admin Panel)</Label>
              <div className="flex gap-2">
                <Input value={settings.dashboard_logo_url} onChange={e => setSettings({...settings, dashboard_logo_url: e.target.value})} />
                <MediaSelectorDialog 
                  onSelect={(url) => setSettings({...settings, dashboard_logo_url: url})} 
                  trigger={<Button variant="outline">Select</Button>}
                />
              </div>
              {settings.dashboard_logo_url && (
                <img src={settings.dashboard_logo_url} alt="Dashboard Logo Preview" className="mt-2 h-16 w-auto rounded border p-1" />
              )}
            </div>

            <div className="space-y-2">
              <Label>Footer Logo URL</Label>
              <div className="flex gap-2">
                <Input value={settings.footer_logo_url} onChange={e => setSettings({...settings, footer_logo_url: e.target.value})} />
                <MediaSelectorDialog 
                  onSelect={(url) => setSettings({...settings, footer_logo_url: url})} 
                  trigger={<Button variant="outline">Select</Button>}
                />
              </div>
              {settings.footer_logo_url && (
                <img src={settings.footer_logo_url} alt="Footer Logo Preview" className="mt-2 h-16 w-auto rounded border p-1" />
              )}
            </div>
            <Button onClick={saveSettings} disabled={saving}>
              <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Settings"}
            </Button>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
};

export default AdminSiteSettings;
