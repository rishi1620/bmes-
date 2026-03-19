import { useEffect, useState, useCallback } from "react";
import { Save, Plus, Trash2, Microscope, FlaskConical, BookOpen, Layout, FileText } from "lucide-react";
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

interface Lab {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
}

interface ResearchArea {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
}

interface Publication {
  id: string;
  title: string;
  authors: string;
  source: string;
  year: string;
  link?: string;
}

const AdminResearch = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [labs, setLabs] = useState<Lab[]>([]);
  const [areas, setAreas] = useState<ResearchArea[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("site_settings").select("*").eq("setting_group", "research_page");
    const map: Record<string, string> = {};
    (data as Setting[] | null)?.forEach((s) => { map[s.setting_key] = s.setting_value; });
    setSettings(map);

    if (map.research_labs_json) {
      try { setLabs(JSON.parse(map.research_labs_json)); } catch (e) { console.error("Failed to parse labs", e); }
    }
    if (map.research_areas_json) {
      try { setAreas(JSON.parse(map.research_areas_json)); } catch (e) { console.error("Failed to parse areas", e); }
    }
    if (map.research_publications_json) {
      try { setPublications(JSON.parse(map.research_publications_json)); } catch (e) { console.error("Failed to parse publications", e); }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const heroKeys = ["research_hero_title", "research_hero_subtitle"];
      
      for (const key of heroKeys) {
        const { data: existing } = await supabase.from("site_settings").select("id").eq("setting_key", key).maybeSingle();
        if (!existing) {
          await supabase.from("site_settings").insert({
            setting_group: "research_page",
            setting_key: key,
            setting_value: settings[key] || ""
          });
        } else {
          await supabase.from("site_settings").update({ setting_value: settings[key] || "" }).eq("setting_key", key);
        }
      }

      const jsonSettings = [
        { key: "research_labs_json", value: labs },
        { key: "research_areas_json", value: areas },
        { key: "research_publications_json", value: publications }
      ];

      for (const item of jsonSettings) {
        const { data: existing } = await supabase.from("site_settings").select("id").eq("setting_key", item.key).maybeSingle();
        if (!existing) {
          await supabase.from("site_settings").insert({
            setting_group: "research_page",
            setting_key: item.key,
            setting_value: JSON.stringify(item.value)
          });
        } else {
          await supabase.from("site_settings").update({ setting_value: JSON.stringify(item.value) }).eq("setting_key", item.key);
        }
      }

      toast({ title: "Research page content saved" });
    } catch (error) {
      toast({ title: "Error saving content", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addItem = (type: 'lab' | 'area' | 'publication') => {
    const id = Date.now().toString();
    if (type === 'lab') setLabs([...labs, { id, title: "", description: "" }]);
    else if (type === 'area') setAreas([...areas, { id, title: "", description: "" }]);
    else setPublications([...publications, { id, title: "", authors: "", source: "", year: new Date().getFullYear().toString() }]);
  };

  const removeItem = (type: 'lab' | 'area' | 'publication', id: string) => {
    if (type === 'lab') setLabs(labs.filter(i => i.id !== id));
    else if (type === 'area') setAreas(areas.filter(i => i.id !== id));
    else setPublications(publications.filter(i => i.id !== id));
  };

  const updateItem = (type: 'lab' | 'area' | 'publication', id: string, field: string, value: string) => {
    if (type === 'lab') setLabs(labs.map(i => i.id === id ? { ...i, [field]: value } : i));
    else if (type === 'area') setAreas(areas.map(i => i.id === id ? { ...i, [field]: value } : i));
    else setPublications(publications.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Research Page Management</h1>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5 text-primary" />
              Hero Section
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Hero Title</Label>
              <Input 
                value={settings.research_hero_title || ""} 
                onChange={(e) => setSettings({...settings, research_hero_title: e.target.value})}
                placeholder="Highlighting Technical Capabilities"
              />
            </div>
            <div className="space-y-2">
              <Label>Hero Subtitle</Label>
              <Textarea 
                value={settings.research_hero_subtitle || ""} 
                onChange={(e) => setSettings({...settings, research_hero_subtitle: e.target.value})}
                placeholder="Explore our laboratories, research areas, publications, and ongoing projects."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              Laboratories
            </CardTitle>
            <Button onClick={() => addItem('lab')} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" /> Add Lab
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {labs.map((lab) => (
              <div key={lab.id} className="p-4 border rounded-lg relative bg-muted/30">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 text-destructive"
                  onClick={() => removeItem('lab', lab.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid gap-4 mr-8">
                  <div className="space-y-2">
                    <Label>Lab Name</Label>
                    <Input 
                      value={lab.title} 
                      onChange={(e) => updateItem('lab', lab.id, 'title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      value={lab.description} 
                      onChange={(e) => updateItem('lab', lab.id, 'description', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Image (Optional)</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={lab.imageUrl || ""} 
                        onChange={(e) => updateItem('lab', lab.id, 'imageUrl', e.target.value)}
                        placeholder="Image URL"
                      />
                      <MediaSelectorDialog 
                        onSelect={(url) => updateItem('lab', lab.id, 'imageUrl', url)}
                        trigger={
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" /> Select
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Microscope className="h-5 w-5 text-primary" />
              Research Areas
            </CardTitle>
            <Button onClick={() => addItem('area')} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" /> Add Area
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {areas.map((area) => (
              <div key={area.id} className="p-4 border rounded-lg relative bg-muted/30">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 text-destructive"
                  onClick={() => removeItem('area', area.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid gap-4 mr-8">
                  <div className="space-y-2">
                    <Label>Area Title</Label>
                    <Input 
                      value={area.title} 
                      onChange={(e) => updateItem('area', area.id, 'title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      value={area.description} 
                      onChange={(e) => updateItem('area', area.id, 'description', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Image (Optional)</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={area.imageUrl || ""} 
                        onChange={(e) => updateItem('area', area.id, 'imageUrl', e.target.value)}
                        placeholder="Image URL"
                      />
                      <MediaSelectorDialog 
                        onSelect={(url) => updateItem('area', area.id, 'imageUrl', url)}
                        trigger={
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" /> Select
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Publications
            </CardTitle>
            <Button onClick={() => addItem('publication')} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" /> Add Publication
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {publications.map((pub) => (
              <div key={pub.id} className="p-4 border rounded-lg relative bg-muted/30">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 text-destructive"
                  onClick={() => removeItem('publication', pub.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Title</Label>
                    <Input 
                      value={pub.title} 
                      onChange={(e) => updateItem('publication', pub.id, 'title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Authors</Label>
                    <Input 
                      value={pub.authors} 
                      onChange={(e) => updateItem('publication', pub.id, 'authors', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Source (Journal/Conference)</Label>
                    <Input 
                      value={pub.source} 
                      onChange={(e) => updateItem('publication', pub.id, 'source', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input 
                      value={pub.year} 
                      onChange={(e) => updateItem('publication', pub.id, 'year', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Link (Optional)</Label>
                    <Input 
                      value={pub.link || ""} 
                      onChange={(e) => updateItem('publication', pub.id, 'link', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminResearch;
