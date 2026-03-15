import { useEffect, useState, useRef } from "react";
import { Save, Plus, Trash, Upload } from "lucide-react";
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
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

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
      "activities_publications_pdf_url",
      "activities_gallery_json"
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      const file = event.target.files[0];
      setUploadingIndex(index);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('media').getPublicUrl(filePath);

      const currentGallery = getJsonArray("activities_gallery_json");
      const newGallery = [...currentGallery];
      newGallery[index].image_url = data.publicUrl;
      updateJsonArray("activities_gallery_json", newGallery);

      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      toast({ title: "Error uploading image", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setUploadingIndex(null);
      if (fileInputRefs.current[index]) {
        fileInputRefs.current[index]!.value = '';
      }
    }
  };

  const galleryItems = getJsonArray("activities_gallery_json");

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

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Gallery Images</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const arr = getJsonArray("activities_gallery_json");
                updateJsonArray("activities_gallery_json", [...arr, { title: "", event_name: "", date: "", image_url: "", category: "" }]);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Image
            </Button>
          </div>
          <div className="space-y-4">
            {galleryItems.map((item: { title: string; image_url: string; event_name: string; category: string; date: string }, i: number) => (
              <div key={i} className="relative rounded-md border border-border p-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    const arr = [...galleryItems];
                    arr.splice(i, 1);
                    updateJsonArray("activities_gallery_json", arr);
                  }}
                >
                  <Trash className="h-4 w-4" />
                </Button>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Title</Label>
                    <Input
                      value={item.title || ""}
                      onChange={(e) => {
                        const arr = [...galleryItems];
                        arr[i].title = e.target.value;
                        updateJsonArray("activities_gallery_json", arr);
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Event Name</Label>
                    <Input
                      value={item.event_name || ""}
                      onChange={(e) => {
                        const arr = [...galleryItems];
                        arr[i].event_name = e.target.value;
                        updateJsonArray("activities_gallery_json", arr);
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={item.date || ""}
                      onChange={(e) => {
                        const arr = [...galleryItems];
                        arr[i].date = e.target.value;
                        updateJsonArray("activities_gallery_json", arr);
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Input
                      value={item.category || ""}
                      onChange={(e) => {
                        const arr = [...galleryItems];
                        arr[i].category = e.target.value;
                        updateJsonArray("activities_gallery_json", arr);
                      }}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>Image URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={item.image_url || ""}
                        onChange={(e) => {
                          const arr = [...galleryItems];
                          arr[i].image_url = e.target.value;
                          updateJsonArray("activities_gallery_json", arr);
                        }}
                        placeholder="Paste image URL or upload file"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={(el) => (fileInputRefs.current[i] = el)}
                        onChange={(e) => handleImageUpload(e, i)}
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRefs.current[i]?.click()}
                        disabled={uploadingIndex === i}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {uploadingIndex === i ? "Uploading..." : "Upload"}
                      </Button>
                    </div>
                    {item.image_url && (
                      <img src={item.image_url} alt="Preview" className="mt-2 h-32 w-auto rounded border object-cover" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {galleryItems.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No gallery images added yet.</p>
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminActivities;
