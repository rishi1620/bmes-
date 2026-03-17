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

interface Notice {
  id: string;
  title: string;
  date: string;
  content: string;
  category?: "departmental" | "club";
}

interface SoftwareLink {
  id: string;
  title: string;
  url: string;
  description: string;
}

interface CustomTable {
  id: string;
  title: string;
  headers: string[];
  rows: string[][];
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
      "portal_custom_tables_json",
      "portal_resource_semesters_json",
      "portal_software_json",
      "portal_membership_content",
      "portal_membership_url"
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

      toast({ title: "Portal page content saved" });
    } catch (e) {
      console.error(e);
      toast({ title: "Error saving portal content", variant: "destructive" });
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateJsonArray = (key: string, arr: any[]) => {
    updateSetting(key, JSON.stringify(arr));
  };

  const softwareLinks: SoftwareLink[] = getJsonArray("portal_software_json");
  const notices: Notice[] = getJsonArray("portal_notices_json");
  const customTables: CustomTable[] = getJsonArray("portal_custom_tables_json");
  const resourceSemesters = JSON.parse(settings.portal_resource_semesters_json || "{}");
  const [mediaFiles, setMediaFiles] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    const fetchMedia = async () => {
      const { data } = await supabase.storage.from("media").list();
      if (data) setMediaFiles(data.filter(f => f.name !== ".emptyFolderPlaceholder"));
    };
    fetchMedia();
  }, []);

  const updateResourceSemester = (fileName: string, semester: string) => {
    console.log("Updating semester for", fileName, "to", semester);
    const newSemesters = { ...resourceSemesters, [fileName]: semester };
    console.log("New semesters:", newSemesters);
    updateSetting("portal_resource_semesters_json", JSON.stringify(newSemesters));
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
              <Input placeholder="Academic Hub" value={settings.portal_hero_title ?? ""} onChange={e => updateSetting("portal_hero_title", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Subtitle</Label>
              <Textarea placeholder="Your central destination for lecture notes, software, and AI-powered study assistance." value={settings.portal_hero_subtitle ?? ""} onChange={e => updateSetting("portal_hero_subtitle", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Notices & Announcements</h2>
            <Button size="sm" variant="outline" onClick={() => updateJsonArray("portal_notices_json", [{ id: Date.now().toString(), title: "New Notice", date: new Date().toISOString().split('T')[0], content: "", category: "departmental" }, ...notices])}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Notice
            </Button>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5 mb-6">
              <Label>Notice Board Description (Optional)</Label>
              <Textarea placeholder="Official announcements and academic updates." value={settings.portal_notices_content ?? ""} onChange={e => updateSetting("portal_notices_content", e.target.value)} />
            </div>
            
            <div className="space-y-4 border-t pt-4">
              {notices.map((item: Notice, i: number) => (
                <div key={item.id || i} className="flex gap-4 items-start border p-4 rounded-md">
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
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Resource Library</h2>
            <Button size="sm" variant="outline" onClick={() => updateJsonArray("portal_custom_tables_json", [...customTables, { id: Date.now().toString(), title: "New Table", headers: ["Column 1", "Column 2"], rows: [["", ""]] }])}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Custom Table
            </Button>
          </div>
          <div className="space-y-6">
            <div className="space-y-1.5">
              <Label>Resource Library Description</Label>
              <Textarea placeholder="Access lecture notes, reference books, and question banks." value={settings.portal_library_content ?? ""} onChange={e => updateSetting("portal_library_content", e.target.value)} />
            </div>

            {customTables.length > 0 && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium text-sm text-muted-foreground">Custom Tables</h3>
                {customTables.map((table: CustomTable, tableIndex: number) => (
                  <div key={table.id} className="border rounded-md p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                      <Input 
                        className="max-w-xs font-semibold" 
                        value={table.title} 
                        onChange={e => {
                          const newTables = [...customTables];
                          newTables[tableIndex].title = e.target.value;
                          updateJsonArray("portal_custom_tables_json", newTables);
                        }} 
                      />
                      <Button variant="destructive" size="icon" onClick={() => {
                        updateJsonArray("portal_custom_tables_json", customTables.filter((t: CustomTable) => t.id !== table.id));
                      }}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Columns (comma separated)</Label>
                      <Input 
                        value={table.headers.join(", ")} 
                        onChange={e => {
                          const newTables = [...customTables];
                          const newHeaders = e.target.value.split(",").map((h: string) => h.trim());
                          newTables[tableIndex].headers = newHeaders;
                          newTables[tableIndex].rows = newTables[tableIndex].rows.map((row: string[]) => {
                            const newRow = [...row];
                            while (newRow.length < newHeaders.length) newRow.push("");
                            return newRow.slice(0, newHeaders.length);
                          });
                          updateJsonArray("portal_custom_tables_json", newTables);
                        }} 
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Rows</Label>
                        <Button size="sm" variant="secondary" onClick={() => {
                          const newTables = [...customTables];
                          newTables[tableIndex].rows.push(new Array(table.headers.length).fill(""));
                          updateJsonArray("portal_custom_tables_json", newTables);
                        }}>
                          <Plus className="h-3 w-3 mr-1" /> Add Row
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {table.rows.map((row: string[], rowIndex: number) => (
                          <div key={rowIndex} className="flex gap-2 items-center">
                            {row.map((cell: string, colIndex: number) => (
                              <Input 
                                key={colIndex}
                                value={cell}
                                placeholder={table.headers[colIndex] || `Column ${colIndex + 1}`}
                                onChange={e => {
                                  const newTables = [...customTables];
                                  newTables[tableIndex].rows[rowIndex][colIndex] = e.target.value;
                                  updateJsonArray("portal_custom_tables_json", newTables);
                                }}
                              />
                            ))}
                            <Button variant="ghost" size="icon" onClick={() => {
                              const newTables = [...customTables];
                              newTables[tableIndex].rows.splice(rowIndex, 1);
                              updateJsonArray("portal_custom_tables_json", newTables);
                            }}>
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                        {table.rows.length === 0 && <p className="text-xs text-muted-foreground">No rows added.</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            {softwareLinks.map((item: { title: string; url: string; description: string }, i: number) => (
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
                <Button variant="destructive" size="icon" onClick={() => { const arr = softwareLinks.filter((_: unknown, idx: number) => idx !== i); updateJsonArray("portal_software_json", arr); }}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {softwareLinks.length === 0 && <p className="text-sm text-muted-foreground">No software links added yet.</p>}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Resource Semesters</h2>
          <div className="space-y-4">
            {mediaFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between gap-4 p-3 border rounded-md">
                <span className="text-sm truncate flex-1">{file.name}</span>
                <select 
                  className="text-sm border rounded p-1"
                  value={resourceSemesters[file.name] || "all"}
                  onChange={(e) => updateResourceSemester(file.name, e.target.value)}
                >
                  <option value="all">All Semesters</option>
                  {[1, 2, 3, 4].map(level => [1, 2].map(term => (
                    <option key={`${level}-${term}`} value={`Level-${level} Term-${term}`}>Level-{level} Term-${term}</option>
                  )))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Membership Portal</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Membership Content</Label>
              <Textarea placeholder="### Why Join CUET BMES?..." className="min-h-[150px]" value={settings.portal_membership_content ?? ""} onChange={e => updateSetting("portal_membership_content", e.target.value)} />
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
