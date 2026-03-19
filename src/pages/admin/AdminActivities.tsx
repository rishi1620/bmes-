import { useEffect, useState, useCallback } from "react";
import { Save, Plus, Trash2, FileText, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MediaSelectorDialog from "@/components/admin/MediaSelectorDialog";

interface Setting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_group: string;
}

const AdminActivities = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("setting_group", "activities_page");
      
      if (error) throw error;

      const map: Record<string, string> = {};
      (data as Setting[] | null)?.forEach((s) => { 
        map[s.setting_key] = s.setting_value || ""; 
      });
      setSettings(map);
      
      if (map.activities_gallery_images) {
        try {
          setGalleryImages(JSON.parse(map.activities_gallery_images));
        } catch {
          setGalleryImages([]);
        }
      }
    } catch (error: unknown) {
      toast({
        title: "Error loading settings",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const keysToSave = [
        "activities_hero_title",
        "activities_hero_subtitle",
        "activities_gallery_content",
        "activities_publications_content",
        "activities_publications_pdf_url",
        "activities_gallery_images"
      ];
      
      const finalSettings = {
        ...settings,
        activities_gallery_images: JSON.stringify(galleryImages)
      };
      
      // Fetch all existing settings for this group to know what to update vs insert
      const { data: existingSettings } = await supabase
        .from("site_settings")
        .select("id, setting_key")
        .eq("setting_group", "activities_page");

      const existingMap = new Map(existingSettings?.map(s => [s.setting_key, s.id]));

      const promises = keysToSave.map(key => {
        const value = finalSettings[key] || "";
        const id = existingMap.get(key);

        if (id) {
          return supabase
            .from("site_settings")
            .update({ setting_value: value })
            .eq("id", id);
        } else {
          return supabase
            .from("site_settings")
            .insert({
              setting_group: "activities_page",
              setting_key: key,
              setting_value: value
            });
        }
      });

      const results = await Promise.all(promises);
      const firstError = results.find(r => r.error)?.error;
      
      if (firstError) throw firstError;

      toast({ title: "Activities page content saved successfully" });
    } catch (error: unknown) {
      toast({
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const addGalleryImage = (url: string) => {
    setGalleryImages(prev => [...prev, url]);
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
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
        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-xl border bg-card">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        ) : (
          <>
            <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hero Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={settings.activities_hero_title ?? ""} onChange={e => updateSetting("activities_hero_title", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Subtitle</Label>
              <Textarea value={settings.activities_hero_subtitle ?? ""} onChange={e => updateSetting("activities_hero_subtitle", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gallery & Publications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Gallery Content Text</Label>
              <Textarea value={settings.activities_gallery_content ?? ""} onChange={e => updateSetting("activities_gallery_content", e.target.value)} />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Gallery Images</Label>
                  <MediaSelectorDialog onSelect={addGalleryImage} trigger={
                    <Button variant="outline" size="sm">
                      <Plus className="mr-1.5 h-4 w-4" /> Add Image
                    </Button>
                  } />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {galleryImages.map((url, idx) => (
                    <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                      <img src={url} alt={`Gallery ${idx}`} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => removeGalleryImage(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {galleryImages.length === 0 && (
                    <div className="col-span-full flex h-24 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                      No images added to gallery.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-1.5">
                <Label>Publications Content Text</Label>
                <Textarea value={settings.activities_publications_content ?? ""} onChange={e => updateSetting("activities_publications_content", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Magazine/Newsletter PDF URL</Label>
                <div className="flex gap-2">
                  <Input value={settings.activities_publications_pdf_url ?? ""} onChange={e => updateSetting("activities_publications_pdf_url", e.target.value)} />
                  <MediaSelectorDialog onSelect={url => updateSetting("activities_publications_pdf_url", url)} trigger={
                    <Button variant="outline" size="icon">
                      <FileText className="h-4 w-4" />
                    </Button>
                  } />
                </div>
                {settings.activities_publications_pdf_url && (
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2 text-xs">
                    <Download className="h-3.5 w-3.5" />
                    <span className="truncate flex-1">{settings.activities_publications_pdf_url}</span>
                    <a href={settings.activities_publications_pdf_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">View</a>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </>
    )}
  </div>
</AdminLayout>
  );
};

export default AdminActivities;
