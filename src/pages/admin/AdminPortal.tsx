import { useEffect, useState, useRef } from "react";
import { Save, Plus, Trash, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Setting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_group: string;
}

const AdminPortal = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

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
      "portal_library_content",
      "portal_library_json",
      "portal_software_json",
      "portal_membership_content",
      "portal_membership_url"
    ];
    
    for (const key of keysToSave) {
      const { data: existing } = await supabase.from("site_settings").select("id").eq("setting_key", key).maybeSingle();
      
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

  const updateJsonArray = (key: string, arr: Record<string, unknown>[]) => {
    updateSetting(key, JSON.stringify(arr));
  };

  const softwareLinks = getJsonArray("portal_software_json");
  const libraryLinks = getJsonArray("portal_library_json");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    try {
      const name = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error } = await supabase.storage.from("media").upload(name, file);
      
      if (error) {
        toast({ title: `Failed to upload ${file.name}`, description: error.message, variant: "destructive" });
      } else {
        const { data } = supabase.storage.from("media").getPublicUrl(name);
        const arr = [...libraryLinks];
        arr[index].url = data.publicUrl;
        updateJsonArray("portal_library_json", arr);
        toast({ title: "File uploaded successfully" });
      }
    } catch (error) {
      toast({ title: "Upload error", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setUploadingIndex(null);
      if (fileInputRefs.current[index]) {
        fileInputRefs.current[index]!.value = '';
      }
    }
  };

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
            <h2 className="text-lg font-semibold text-foreground">Resource Library</h2>
            <Button size="sm" variant="outline" onClick={() => updateJsonArray("portal_library_json", [...libraryLinks, { title: "New Resource", description: "", url: "", category: "Document" }])}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Resource
            </Button>
          </div>
          <div className="space-y-4 mb-6">
            <div className="space-y-1.5">
              <Label>Resource Library Intro Content</Label>
              <Textarea value={settings.portal_library_content ?? ""} onChange={e => updateSetting("portal_library_content", e.target.value)} />
            </div>
          </div>
          <div className="space-y-4">
            {libraryLinks.map((item: Record<string, unknown>, i: number) => (
              <div key={i} className="flex gap-4 items-start border p-4 rounded-md">
                <div className="grid gap-3 flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Resource Title</Label>
                      <Input value={item.title as string} onChange={e => { const arr = [...libraryLinks]; arr[i].title = e.target.value; updateJsonArray("portal_library_json", arr); }} />
                    </div>
                    <div>
                      <Label className="text-xs">Category</Label>
                      <Select value={(item.category as string) || "Document"} onValueChange={(val) => { const arr = [...libraryLinks]; arr[i].category = val; updateJsonArray("portal_library_json", arr); }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Document">Document</SelectItem>
                          <SelectItem value="Research Paper">Research Paper</SelectItem>
                          <SelectItem value="Lecture Notes">Lecture Notes</SelectItem>
                          <SelectItem value="Question Bank">Question Bank</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">File URL</Label>
                      <div className="flex gap-2">
                        <Input value={item.url as string} onChange={e => { const arr = [...libraryLinks]; arr[i].url = e.target.value; updateJsonArray("portal_library_json", arr); }} placeholder="URL or upload" />
                        <input
                          type="file"
                          accept="application/pdf,.doc,.docx,.ppt,.pptx"
                          className="hidden"
                          ref={(el) => fileInputRefs.current[i] = el}
                          onChange={(e) => handleFileUpload(e, i)}
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => fileInputRefs.current[i]?.click()}
                          disabled={uploadingIndex === i}
                          title="Upload File"
                        >
                          {uploadingIndex === i ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea value={item.description as string} onChange={e => { const arr = [...libraryLinks]; arr[i].description = e.target.value; updateJsonArray("portal_library_json", arr); }} />
                  </div>
                </div>
                <Button variant="destructive" size="icon" onClick={() => { const arr = libraryLinks.filter((_: Record<string, unknown>, idx: number) => idx !== i); updateJsonArray("portal_library_json", arr); }}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {libraryLinks.length === 0 && <p className="text-sm text-muted-foreground">No resources added yet.</p>}
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
            {softwareLinks.map((item: Record<string, unknown>, i: number) => (
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
                <Button variant="destructive" size="icon" onClick={() => { const arr = softwareLinks.filter((_: Record<string, unknown>, idx: number) => idx !== i); updateJsonArray("portal_software_json", arr); }}>
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
