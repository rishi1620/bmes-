import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
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
  const [settings, setSettings] = useState({ 
    logo_url: "", 
    site_title: "", 
    dashboard_logo_url: "", 
    footer_logo_url: "",
    contact_address: "",
    contact_email: "",
    contact_phone: "",
    contact_map_iframe: "",
    social_facebook: "",
    social_linkedin: "",
    social_youtube: "",
    footer_description: ""
  });

  const loadSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from("site_settings").select("setting_key, setting_value");
    const map: Record<string, string> = {};
    data?.forEach((s) => { map[s.setting_key] = s.setting_value ?? ""; });
    setSettings({
      logo_url: map.logo_url || "",
      site_title: map.site_title || "CUET BMES",
      dashboard_logo_url: map.dashboard_logo_url || "",
      footer_logo_url: map.footer_logo_url || "",
      contact_address: map.contact_address || "Dept. of BME, CUET, Chittagong-4349, Bangladesh",
      contact_email: map.contact_email || "bmes@cuet.ac.bd",
      contact_phone: map.contact_phone || "+880 1XXX-XXXXXX",
      contact_map_iframe: map.contact_map_iframe || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3688.086300185984!2d91.96884391535497!3d22.46337583990666!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30ad2fca34ae5549%3A0x35c88a37b3e90e97!2sChittagong%20University%20of%20Engineering%20and%20Technology%20(CUET)!5e0!3m2!1sen!2sbd!4v1625000000000!5m2!1sen!2sbd",
      social_facebook: map.social_facebook || "https://facebook.com",
      social_linkedin: map.social_linkedin || "https://linkedin.com",
      social_youtube: map.social_youtube || "https://youtube.com",
      footer_description: map.footer_description || "Advancing biomedical engineering through research, innovation, and community at Chittagong University of Engineering & Technology."
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
        <div className="max-w-xl space-y-6 rounded-lg border border-border bg-card p-6">
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

          <div className="space-y-2">
            <Label>Footer Description</Label>
            <Input value={settings.footer_description} onChange={e => setSettings({...settings, footer_description: e.target.value})} />
          </div>

          <div className="space-y-2">
            <Label>Contact Address</Label>
            <Input value={settings.contact_address} onChange={e => setSettings({...settings, contact_address: e.target.value})} />
          </div>

          <div className="space-y-2">
            <Label>Contact Email</Label>
            <Input type="email" value={settings.contact_email} onChange={e => setSettings({...settings, contact_email: e.target.value})} />
          </div>

          <div className="space-y-2">
            <Label>Contact Phone</Label>
            <Input value={settings.contact_phone} onChange={e => setSettings({...settings, contact_phone: e.target.value})} />
          </div>

          <div className="space-y-2">
            <Label>Contact Map Iframe URL</Label>
            <Input value={settings.contact_map_iframe} onChange={e => setSettings({...settings, contact_map_iframe: e.target.value})} />
          </div>

          <div className="space-y-2">
            <Label>Facebook URL</Label>
            <Input value={settings.social_facebook} onChange={e => setSettings({...settings, social_facebook: e.target.value})} />
          </div>

          <div className="space-y-2">
            <Label>LinkedIn URL</Label>
            <Input value={settings.social_linkedin} onChange={e => setSettings({...settings, social_linkedin: e.target.value})} />
          </div>

          <div className="space-y-2">
            <Label>YouTube URL</Label>
            <Input value={settings.social_youtube} onChange={e => setSettings({...settings, social_youtube: e.target.value})} />
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
