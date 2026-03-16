import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Save, Eye, EyeOff, Pencil, Plus, Trash, ArrowUp, ArrowDown, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import MediaSelectorDialog from "@/components/admin/MediaSelectorDialog";
import { motion } from "framer-motion";

interface HomeSection {
  id: string;
  section_key: string;
  section_data: Record<string, unknown>;
  is_visible: boolean;
  display_order: number;
}

const sectionLabels: Record<string, string> = {
  hero: "Hero Section",
  quick_links: "Quick Links",
  announcements: "Latest Announcements",
  upcoming_events: "Upcoming Events",
  recent_achievements: "Recent Achievements",
  featured_projects: "Featured Projects",
  recent_blog: "Latest from the Blog",
  stats: "Statistics (Legacy)",
  features: "Features (Legacy)",
  cta: "Call to Action (Legacy)",
  notice: "Notice Board (Legacy)",
};

const AdminHomeSections = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [editing, setEditing] = useState<HomeSection | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [saving, setSaving] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newKey, setNewKey] = useState("");

  const load = async () => {
    const { data } = await supabase.from("home_sections").select("*").order("display_order");
    const loadedSections = (data as HomeSection[]) ?? [];
    setSections(loadedSections);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const sectionToOpen = searchParams.get("section");
    if (sectionToOpen && sections.length > 0) {
      const targetSection = sections.find(s => s.section_key === sectionToOpen);
      if (targetSection && !editing) {
        openEdit(targetSection);
        setSearchParams({});
      }
    }
  }, [searchParams, sections, editing, setSearchParams]);

  const toggleVisibility = async (s: HomeSection) => {
    await supabase.from("home_sections").update({ is_visible: !s.is_visible }).eq("id", s.id);
    toast({ title: s.is_visible ? "Section hidden" : "Section visible" });
    load();
  };

  const openEdit = (s: HomeSection) => {
    setEditing(s);
    setJsonText(JSON.stringify(s.section_data, null, 2));
  };

  const saveSection = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const parsed = JSON.parse(jsonText);
      if (editing.id === "new") {
        const { error } = await supabase.from("home_sections").insert({
          section_key: editing.section_key,
          section_data: parsed,
          is_visible: true,
          display_order: sections.length + 1
        });
        if (error) throw error;
        toast({ title: "Section created" });
      } else {
        const { error } = await supabase.from("home_sections").update({ section_data: parsed }).eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Section updated" });
      }
      setEditing(null);
      load();
    } catch (e: unknown) {
      const err = e as Error;
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const deleteSection = async (id: string) => {
    if (!confirm("Are you sure you want to delete this section?")) return;
    const { error } = await supabase.from("home_sections").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Section deleted" }); load(); }
  };

  const moveSection = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;

    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap display_order values
    const tempOrder = newSections[index].display_order;
    newSections[index].display_order = newSections[targetIndex].display_order;
    newSections[targetIndex].display_order = tempOrder;

    // Update both in database
    await Promise.all([
      supabase.from("home_sections").update({ display_order: newSections[index].display_order }).eq("id", newSections[index].id),
      supabase.from("home_sections").update({ display_order: newSections[targetIndex].display_order }).eq("id", newSections[targetIndex].id)
    ]);
    
    load();
  };

  const handleAddNew = () => {
    if (!newKey.trim()) return;
    setEditing({
      id: "new",
      section_key: newKey.trim().toLowerCase().replace(/\s+/g, '_'),
      section_data: {},
      is_visible: true,
      display_order: sections.length + 1
    });
    setJsonText("{}");
    setAddingNew(false);
    setNewKey("");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <AdminLayout>
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex items-center justify-between"
      >
        <h1 className="text-2xl font-bold text-foreground">Home Page Sections</h1>
        <Button onClick={() => setAddingNew(true)} size="sm"><Plus className="mr-1.5 h-4 w-4" /> Add Section</Button>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {sections.map((s, index) => (
          <motion.div variants={itemVariants} key={s.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div>
              <h3 className="font-semibold text-foreground">{sectionLabels[s.section_key] || s.section_key}</h3>
              <p className="text-xs text-muted-foreground">Key: {s.section_key} · Order: {s.display_order} · {s.is_visible ? "Visible" : "Hidden"}</p>
            </div>
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 mr-2">
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === 0} onClick={() => moveSection(index, 'up')}><ArrowUp className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === sections.length - 1} onClick={() => moveSection(index, 'down')}><ArrowDown className="h-3 w-3" /></Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => toggleVisibility(s)} title={s.is_visible ? "Hide Section" : "Show Section"}>
                {s.is_visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={() => openEdit(s)} title="Edit Section">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => deleteSection(s.id)} title="Delete Section" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ))}
        {sections.length === 0 && <p className="text-center text-muted-foreground py-8">No home sections found.</p>}
      </motion.div>

      <Dialog open={addingNew} onOpenChange={setAddingNew}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Section Key</Label>
              <Input 
                placeholder="e.g. hero, quick_links, custom_section" 
                value={newKey} 
                onChange={e => setNewKey(e.target.value)} 
              />
              <p className="text-xs text-muted-foreground">Use lowercase and underscores. Standard keys: hero, quick_links, announcements, upcoming_events, recent_achievements, featured_projects, recent_blog.</p>
            </div>
            <Button onClick={handleAddNew} className="w-full" disabled={!newKey.trim()}>Continue to Edit</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit {sectionLabels[editing?.section_key ?? ""] || editing?.section_key}</DialogTitle>
          </DialogHeader>

          {editing?.section_key === "hero" && (() => {
            let data: Record<string, string> = {};
            try { data = JSON.parse(jsonText); } catch (e) { console.error(e); }
            const update = (key: string, val: string) => {
              const d = { ...data, [key]: val };
              setJsonText(JSON.stringify(d, null, 2));
            };
            return (
              <div className="space-y-4 py-2">
                <div className="space-y-1.5"><Label>Title</Label><Input value={data.title ?? ""} onChange={e => update("title", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Subtitle</Label><Input value={data.subtitle ?? ""} onChange={e => update("subtitle", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Description</Label><Textarea value={data.description ?? ""} onChange={e => update("description", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Button Text</Label><Input value={data.button_text ?? ""} onChange={e => update("button_text", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Button Link</Label><Input value={data.button_link ?? ""} onChange={e => update("button_link", e.target.value)} /></div>
                <div className="space-y-1.5">
                  <Label>Background Image URL</Label>
                  <div className="flex gap-2">
                    <Input value={data.background_image ?? ""} onChange={e => update("background_image", e.target.value)} />
                    <MediaSelectorDialog 
                      onSelect={(url) => update("background_image", url)}
                      trigger={<Button variant="outline" size="icon" title="Open Media Library"><ImageIcon className="h-4 w-4" /></Button>}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {editing?.section_key === "cta" && (() => {
            let data: Record<string, string> = {};
            try { data = JSON.parse(jsonText); } catch (e) { console.error(e); }
            const update = (key: string, val: string) => {
              const d = { ...data, [key]: val };
              setJsonText(JSON.stringify(d, null, 2));
            };
            return (
              <div className="space-y-4 py-2">
                <div className="space-y-1.5"><Label>Title</Label><Input value={data.title ?? ""} onChange={e => update("title", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Description</Label><Textarea value={data.description ?? ""} onChange={e => update("description", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Button Text</Label><Input value={data.button_text ?? ""} onChange={e => update("button_text", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Button Link</Label><Input value={data.button_link ?? ""} onChange={e => update("button_link", e.target.value)} /></div>
              </div>
            );
          })()}

          {editing?.section_key === "notice" && (() => {
            let data: Record<string, string> = {};
            try { data = JSON.parse(jsonText); } catch (e) { console.error(e); }
            const update = (key: string, val: string) => {
              const d = { ...data, [key]: val };
              setJsonText(JSON.stringify(d, null, 2));
            };
            return (
              <div className="space-y-4 py-2">
                <div className="space-y-1.5"><Label>Notice Title</Label><Input value={data.title ?? ""} onChange={e => update("title", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Notice Content</Label><Textarea value={data.content ?? ""} onChange={e => update("content", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Link Text (Optional)</Label><Input value={data.link_text ?? ""} onChange={e => update("link_text", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Link URL (Optional)</Label><Input value={data.link_url ?? ""} onChange={e => update("link_url", e.target.value)} /></div>
              </div>
            );
          })()}

          {editing?.section_key === "quick_links" && (() => {
            let data: any = { links: [] };
            try { data = JSON.parse(jsonText); } catch (e) { console.error(e); }
            if (!data.links) data.links = [];
            
            const updateLinks = (newLinks: any[]) => {
              setJsonText(JSON.stringify({ ...data, links: newLinks }, null, 2));
            };
            
            return (
              <div className="space-y-4 py-2">
                <div className="flex justify-between items-center">
                  <Label>Quick Links</Label>
                  <Button size="sm" onClick={() => updateLinks([...data.links, { label: "New Link", url: "/" }])}><Plus className="h-4 w-4 mr-1"/> Add Link</Button>
                </div>
                {data.links.map((link: any, i: number) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input value={link.label} onChange={e => {
                      const newLinks = [...data.links];
                      newLinks[i].label = e.target.value;
                      updateLinks(newLinks);
                    }} placeholder="Label" />
                    <Input value={link.url} onChange={e => {
                      const newLinks = [...data.links];
                      newLinks[i].url = e.target.value;
                      updateLinks(newLinks);
                    }} placeholder="URL" />
                    <Button variant="destructive" size="icon" onClick={() => {
                      const newLinks = data.links.filter((_: any, idx: number) => idx !== i);
                      updateLinks(newLinks);
                    }}><Trash className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            );
          })()}

          {editing?.section_key === "announcements" && (() => {
            let data: any = { dept_title: "", club_title: "", dept_notices: [], club_news: [] };
            try { data = JSON.parse(jsonText); } catch (e) { console.error(e); }
            if (!data.dept_notices) data.dept_notices = [];
            if (!data.club_news) data.club_news = [];

            const update = (key: string, val: unknown) => {
              const d = { ...data, [key]: val };
              setJsonText(JSON.stringify(d, null, 2));
            };

            return (
              <div className="space-y-6 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Department Notices Title</Label><Input value={data.dept_title ?? ""} onChange={e => update("dept_title", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Club News Title</Label><Input value={data.club_title ?? ""} onChange={e => update("club_title", e.target.value)} /></div>
                </div>
                
                <div className="space-y-3 border p-4 rounded-md">
                  <div className="flex justify-between items-center">
                    <Label>Department Notices</Label>
                    <Button size="sm" variant="outline" onClick={() => update("dept_notices", [...data.dept_notices, { title: "New Notice", date: "", url: "" }])}><Plus className="h-4 w-4 mr-1"/> Add Notice</Button>
                  </div>
                  {data.dept_notices.map((item: any, i: number) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="grid gap-2 flex-1">
                        <Input value={item.title} onChange={e => { const arr = [...data.dept_notices]; arr[i].title = e.target.value; update("dept_notices", arr); }} placeholder="Notice Title" />
                        <div className="flex gap-2">
                          <Input value={item.date} onChange={e => { const arr = [...data.dept_notices]; arr[i].date = e.target.value; update("dept_notices", arr); }} placeholder="Date (e.g. Oct 12, 2026)" className="w-1/3" />
                          <Input value={item.url} onChange={e => { const arr = [...data.dept_notices]; arr[i].url = e.target.value; update("dept_notices", arr); }} placeholder="Link URL" className="flex-1" />
                        </div>
                      </div>
                      <Button variant="destructive" size="icon" onClick={() => { const arr = data.dept_notices.filter((_: any, idx: number) => idx !== i); update("dept_notices", arr); }}><Trash className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border p-4 rounded-md">
                  <div className="flex justify-between items-center">
                    <Label>Club News</Label>
                    <Button size="sm" variant="outline" onClick={() => update("club_news", [...data.club_news, { title: "New News", date: "", url: "" }])}><Plus className="h-4 w-4 mr-1"/> Add News</Button>
                  </div>
                  {data.club_news.map((item: any, i: number) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="grid gap-2 flex-1">
                        <Input value={item.title} onChange={e => { const arr = [...data.club_news]; arr[i].title = e.target.value; update("club_news", arr); }} placeholder="News Title" />
                        <div className="flex gap-2">
                          <Input value={item.date} onChange={e => { const arr = [...data.club_news]; arr[i].date = e.target.value; update("club_news", arr); }} placeholder="Date (e.g. Oct 12, 2026)" className="w-1/3" />
                          <Input value={item.url} onChange={e => { const arr = [...data.club_news]; arr[i].url = e.target.value; update("club_news", arr); }} placeholder="Link URL" className="flex-1" />
                        </div>
                      </div>
                      <Button variant="destructive" size="icon" onClick={() => { const arr = data.club_news.filter((_: any, idx: number) => idx !== i); update("club_news", arr); }}><Trash className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {(editing?.section_key === "upcoming_events" || editing?.section_key === "recent_achievements" || editing?.section_key === "featured_projects" || editing?.section_key === "recent_blog") && (() => {
            let data: any = { title: "", description: "" };
            try { data = JSON.parse(jsonText); } catch (e) { console.error(e); }

            const update = (key: string, val: unknown) => {
              const d = { ...data, [key]: val };
              setJsonText(JSON.stringify(d, null, 2));
            };

            return (
              <div className="space-y-6 py-2">
                <div className="space-y-1.5"><Label>Section Title</Label><Input value={data.title ?? ""} onChange={e => update("title", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Section Description</Label><Textarea value={data.description ?? ""} onChange={e => update("description", e.target.value)} /></div>
                <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                  <p><strong>Note:</strong> The content for this section is fetched dynamically from the <strong>{
                    editing.section_key === "upcoming_events" ? "Events" :
                    editing.section_key === "recent_achievements" ? "Achievements" :
                    editing.section_key === "featured_projects" ? "Projects" :
                    "Blog"
                  }</strong> module. You can manage the actual items there.</p>
                </div>
              </div>
            );
          })()}

          {editing?.section_key === "stats" && (() => {
            let data: any = { items: [] };
            try { data = JSON.parse(jsonText); } catch (e) { console.error(e); }
            if (!data.items || !Array.isArray(data.items)) data.items = [];
            
            const updateItems = (newItems: any[]) => {
              setJsonText(JSON.stringify({ ...data, items: newItems }, null, 2));
            };
            
            return (
              <div className="space-y-4 py-2">
                <div className="flex justify-between items-center">
                  <Label>Statistics</Label>
                  <Button size="sm" onClick={() => updateItems([...data.items, { label: "New Stat", value: "0" }])}><Plus className="h-4 w-4 mr-1"/> Add Stat</Button>
                </div>
                {data.items.map((item: any, i: number) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input value={item.label || ""} onChange={e => {
                      const newItems = [...data.items];
                      newItems[i].label = e.target.value;
                      updateItems(newItems);
                    }} placeholder="Label (e.g. Active Members)" />
                    <Input value={item.value || ""} onChange={e => {
                      const newItems = [...data.items];
                      newItems[i].value = e.target.value;
                      updateItems(newItems);
                    }} placeholder="Value (e.g. 150+)" />
                    <Button variant="destructive" size="icon" onClick={() => {
                      const newItems = data.items.filter((_: any, idx: number) => idx !== i);
                      updateItems(newItems);
                    }}><Trash className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            );
          })()}

          {editing?.section_key === "features" && (() => {
            let data: any = { items: [] };
            try { data = JSON.parse(jsonText); } catch (e) { console.error(e); }
            if (!data.items || !Array.isArray(data.items)) data.items = [];
            
            const update = (key: string, val: unknown) => {
              const d = { ...data, [key]: val };
              setJsonText(JSON.stringify(d, null, 2));
            };

            const updateItems = (newItems: any[]) => {
              setJsonText(JSON.stringify({ ...data, items: newItems }, null, 2));
            };
            
            return (
              <div className="space-y-6 py-2">
                <div className="space-y-1.5"><Label>Badge</Label><Input value={data.badge ?? ""} onChange={e => update("badge", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Title</Label><Input value={data.title ?? ""} onChange={e => update("title", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Description</Label><Textarea value={data.description ?? ""} onChange={e => update("description", e.target.value)} /></div>
                
                <div className="space-y-4 border-t pt-4">
                  <div className="flex justify-between items-center">
                    <Label>Feature Items</Label>
                    <Button size="sm" onClick={() => updateItems([...data.items, { title: "New Feature", desc: "Description", icon: "FlaskConical" }])}><Plus className="h-4 w-4 mr-1"/> Add Item</Button>
                  </div>
                  {data.items.map((item: any, i: number) => (
                    <div key={i} className="space-y-2 border p-3 rounded-md relative">
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/10" onClick={() => {
                        const newItems = data.items.filter((_: any, idx: number) => idx !== i);
                        updateItems(newItems);
                      }}><Trash className="h-4 w-4" /></Button>
                      
                      <div className="grid grid-cols-2 gap-2 pr-8">
                        <div className="space-y-1">
                          <Label className="text-xs">Title</Label>
                          <Input value={item.title} onChange={e => {
                            const newItems = [...data.items];
                            newItems[i].title = e.target.value;
                            updateItems(newItems);
                          }} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Icon Key</Label>
                          <Input value={item.icon} onChange={e => {
                            const newItems = [...data.items];
                            newItems[i].icon = e.target.value;
                            updateItems(newItems);
                          }} placeholder="e.g. Users, Calendar" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Textarea value={item.desc} onChange={e => {
                          const newItems = [...data.items];
                          newItems[i].desc = e.target.value;
                          updateItems(newItems);
                        }} className="h-20" />
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">Available Icons: FlaskConical, Users, Calendar, BookOpen, Award, Microscope</p>
                </div>
              </div>
            );
          })()}

          {(editing?.section_key !== "hero" && editing?.section_key !== "cta" && editing?.section_key !== "notice" && editing?.section_key !== "quick_links" && editing?.section_key !== "announcements" && editing?.section_key !== "upcoming_events" && editing?.section_key !== "recent_achievements" && editing?.section_key !== "featured_projects" && editing?.section_key !== "recent_blog" && editing?.section_key !== "stats" && editing?.section_key !== "features") && (
            <div className="space-y-1.5 py-2">
              <Label>Section Data (JSON)</Label>
              <Textarea className="min-h-[300px] font-mono text-xs" value={jsonText} onChange={e => setJsonText(e.target.value)} />
            </div>
          )}

          <Button onClick={saveSection} disabled={saving} className="w-full">
            <Save className="mr-1.5 h-4 w-4" /> {saving ? "Saving…" : "Save Changes"}
          </Button>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminHomeSections;
