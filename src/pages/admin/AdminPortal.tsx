import { useEffect, useState, useCallback, useMemo } from "react";
import { Save, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import MediaSelector from "@/components/admin/MediaSelector";
import { AcademicStructure, Semester, Course, AcademicResource } from "@/types/academic";
import { Plus, Trash2, FileText, Image as ImageIcon, Film, ExternalLink } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';

// ... (rest of the file)

interface Setting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_group: string;
}

const AdminPortal = () => {
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
      "portal_hero_title",
      "portal_hero_subtitle",
      "portal_hero_bg_image",
      "portal_academic_structure_json",
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

  const academicStructure: AcademicStructure = useMemo(() => {
    try {
      return JSON.parse(settings.portal_academic_structure_json || '{"semesters": []}');
    } catch {
      return { semesters: [] };
    }
  }, [settings.portal_academic_structure_json]);

  const updateAcademicStructure = (newStructure: AcademicStructure) => {
    updateSetting("portal_academic_structure_json", JSON.stringify(newStructure));
  };

  // Academic Management Helpers
  const addSemester = () => {
    const name = prompt("Enter Semester Name (e.g., Level-1 Term-1)");
    if (!name) return;
    const newSemester: Semester = { id: uuidv4(), name, courses: [] };
    updateAcademicStructure({ semesters: [...academicStructure.semesters, newSemester] });
  };

  const removeSemester = (id: string) => {
    if (!confirm("Are you sure you want to remove this semester and all its courses?")) return;
    updateAcademicStructure({ semesters: academicStructure.semesters.filter(s => s.id !== id) });
  };

  const addCourse = (semesterId: string) => {
    const name = prompt("Enter Course Name");
    const code = prompt("Enter Course Code (optional)");
    if (!name) return;
    const newCourse: Course = { id: uuidv4(), name, code: code || "", resources: [] };
    const newSemesters = academicStructure.semesters.map(s => 
      s.id === semesterId ? { ...s, courses: [...s.courses, newCourse] } : s
    );
    updateAcademicStructure({ semesters: newSemesters });
  };

  const removeCourse = (semesterId: string, courseId: string) => {
    if (!confirm("Are you sure you want to remove this course?")) return;
    const newSemesters = academicStructure.semesters.map(s => 
      s.id === semesterId ? { ...s, courses: s.courses.filter(c => c.id !== courseId) } : s
    );
    updateAcademicStructure({ semesters: newSemesters });
  };

  const addResource = (semesterId: string, courseId: string, url: string) => {
    const fileName = url.split('/').pop() || "Resource";
    const type: AcademicResource["type"] = fileName.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) ? "image" : 
                                           fileName.match(/\.(mp4|webm|mov|avi)$/i) ? "video" : 
                                           fileName.match(/\.(pdf)$/i) ? "pdf" : "other";
    
    const newResource: AcademicResource = {
      id: uuidv4(),
      name: fileName,
      url,
      type,
      tags: [],
      created_at: new Date().toISOString()
    };

    const newSemesters = academicStructure.semesters.map(s => {
      if (s.id !== semesterId) return s;
      return {
        ...s,
        courses: s.courses.map(c => 
          c.id === courseId ? { ...c, resources: [...c.resources, newResource] } : c
        )
      };
    });
    updateAcademicStructure({ semesters: newSemesters });
  };

  const removeResource = (semesterId: string, courseId: string, resourceId: string) => {
    const newSemesters = academicStructure.semesters.map(s => {
      if (s.id !== semesterId) return s;
      return {
        ...s,
        courses: s.courses.map(c => 
          c.id === courseId ? { ...c, resources: c.resources.filter(r => r.id !== resourceId) } : c
        )
      };
    });
    updateAcademicStructure({ semesters: newSemesters });
  };

  const updateResourceTags = (semesterId: string, courseId: string, resourceId: string, tags: string[]) => {
    const newSemesters = academicStructure.semesters.map(s => {
      if (s.id !== semesterId) return s;
      return {
        ...s,
        courses: s.courses.map(c => 
          c.id === courseId ? { ...c, resources: c.resources.map(r => r.id === resourceId ? { ...r, tags } : r) } : c
        )
      };
    });
    updateAcademicStructure({ semesters: newSemesters });
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hero Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Hero Title</Label>
              <Input value={settings.portal_hero_title ?? ""} onChange={e => updateSetting("portal_hero_title", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Hero Subtitle</Label>
              <Textarea value={settings.portal_hero_subtitle ?? ""} onChange={e => updateSetting("portal_hero_subtitle", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Background Image</Label>
              <Input value={settings.portal_hero_bg_image ?? ""} onChange={e => updateSetting("portal_hero_bg_image", e.target.value)} />
              <MediaSelector onSelect={(url) => updateSetting("portal_hero_bg_image", url)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Academic Resource Library</CardTitle>
            <Button onClick={addSemester} size="sm" variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Add Semester
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {academicStructure.semesters.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                No semesters added yet. Click "Add Semester" to begin.
              </div>
            ) : (
              academicStructure.semesters.map(semester => (
                <Collapsible key={semester.id} className="border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-3">
                    <CollapsibleTrigger className="flex items-center gap-2 font-bold flex-1 text-left">
                      <ChevronDown className="h-4 w-4" />
                      {semester.name}
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => addCourse(semester.id)} className="h-8 gap-1">
                        <Plus className="h-3 w-3" /> Add Course
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => removeSemester(semester.id)} className="h-8 text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <CollapsibleContent className="p-4 space-y-4">
                    {semester.courses.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No courses in this semester.</p>
                    ) : (
                      semester.courses.map(course => (
                        <div key={course.id} className="border rounded-md p-4 space-y-4 bg-card">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{course.name}</h4>
                              {course.code && <p className="text-xs text-muted-foreground">{course.code}</p>}
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => removeCourse(semester.id, course.id)} className="h-8 text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Resources</Label>
                            <div className="grid gap-2">
                              {course.resources.map(res => (
                                <div key={res.id} className="flex items-center gap-3 p-2 border rounded-md bg-muted/30 group">
                                  <div className="text-emerald-500">
                                    {res.type === "pdf" ? <FileText className="h-4 w-4" /> : 
                                     res.type === "image" ? <ImageIcon className="h-4 w-4" /> : 
                                     res.type === "video" ? <Film className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{res.name}</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {res.tags.map((tag, idx) => (
                                        <span key={idx} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded flex items-center gap-1">
                                          {tag}
                                          <button onClick={() => updateResourceTags(semester.id, course.id, res.id, res.tags.filter(t => t !== tag))}>
                                            ×
                                          </button>
                                        </span>
                                      ))}
                                      <button 
                                        onClick={() => {
                                          const tag = prompt("Enter tag name");
                                          if (tag) updateResourceTags(semester.id, course.id, res.id, [...res.tags, tag]);
                                        }}
                                        className="text-[10px] border border-dashed px-1.5 py-0.5 rounded hover:bg-muted"
                                      >
                                        + Tag
                                      </button>
                                    </div>
                                  </div>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeResource(semester.id, course.id, res.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <div className="pt-2">
                              <Label className="text-[10px] text-muted-foreground mb-1 block">Add Resource from Media</Label>
                              <MediaSelector onSelect={(url) => addResource(semester.id, course.id, url)} />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </CardContent>
        </Card>
        
        {/* ... (Membership section) ... */}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Membership Portal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Membership Content</Label>
              <Textarea placeholder="### Why Join CUET BMES?..." className="min-h-[150px]" value={settings.portal_membership_content ?? ""} onChange={e => updateSetting("portal_membership_content", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Registration/Renewal Form URL</Label>
              <Input value={settings.portal_membership_url ?? ""} onChange={e => updateSetting("portal_membership_url", e.target.value)} />
            </div>
          </CardContent>
        </Card>

      </div>
    </AdminLayout>
  );
};

export default AdminPortal;
