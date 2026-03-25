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
import MediaSelectorDialog from "@/components/admin/MediaSelectorDialog";
import { AcademicStructure, Semester, Course, AcademicResource } from "@/types/academic";
import { Plus, Trash2, FileText, Image as ImageIcon, Film, ExternalLink } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { MembershipManagement } from "@/components/admin/MembershipManagement";

interface SoftwareLink {
  title: string;
  url: string;
  description: string;
}
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

  // Dialog States
  const [isAddSemesterOpen, setIsAddSemesterOpen] = useState(false);
  const [newSemesterName, setNewSemesterName] = useState("");

  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [targetSemesterId, setTargetSemesterId] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseCode, setNewCourseCode] = useState("");

  const [isAddTagOpen, setIsAddTagOpen] = useState(false);
  const [tagContext, setTagContext] = useState<{sId: string, cId: string, rId: string} | null>(null);
  const [newTagName, setNewTagName] = useState("");

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState<{title: string, desc: string, onConfirm: () => void} | null>(null);

  const [isAddSoftwareOpen, setIsAddSoftwareOpen] = useState(false);
  const [newSoftware, setNewSoftware] = useState({ title: "", url: "", description: "" });

  const load = useCallback(async () => {
    const { data } = await supabase.from("site_settings").select("*");
    const map: Record<string, string> = {};
    (data as Setting[] | null)?.forEach((s) => { 
      // Only care about portal_page group or specific keys
      if (s.setting_group === "portal_page" || s.setting_key.startsWith("portal_")) {
        map[s.setting_key] = s.setting_value || ""; 
      }
    });
    setSettings(map);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    
    const keysToSave = [
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
        // Skip if value is undefined and not in settings (to avoid overwriting with empty string if not loaded)
        if (settings[key] === undefined) continue;

        const { data: existing, error } = await supabase.from("site_settings").select("id").eq("setting_key", key).maybeSingle();
        
        if (error) {
          console.error("Error fetching setting:", key, error);
          continue;
        }

        const value = settings[key] || "";

        if (!existing) {
          await supabase.from("site_settings").insert({
            setting_group: "portal_page",
            setting_key: key,
            setting_value: value
          });
        } else {
          await supabase.from("site_settings").update({ 
            setting_value: value,
            setting_group: "portal_page" 
          }).eq("setting_key", key);
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

  const softwareLinks = useMemo(() => {
    try {
      const links = JSON.parse(settings.portal_software_json || "[]") as SoftwareLink[];
      // If empty, return the defaults as a hint or just empty
      return links;
    } catch {
      return [];
    }
  }, [settings.portal_software_json]);

  const updateAcademicStructure = (newStructure: AcademicStructure) => {
    updateSetting("portal_academic_structure_json", JSON.stringify(newStructure));
  };

  const updateSoftwareLinks = (newLinks: SoftwareLink[]) => {
    updateSetting("portal_software_json", JSON.stringify(newLinks));
  };

  const addSoftware = () => {
    if (!newSoftware.title || !newSoftware.url) {
      toast({ title: "Title and URL are required", variant: "destructive" });
      return;
    }
    const newLinks = [...softwareLinks, newSoftware];
    updateSoftwareLinks(newLinks);
    setNewSoftware({ title: "", url: "", description: "" });
    setIsAddSoftwareOpen(false);
  };

  const resetSoftwareToDefaults = () => {
    const defaults = [
      { title: "MATLAB", url: "https://www.mathworks.com/products/matlab.html", description: "Numerical computing environment and programming language." },
      { title: "SolidWorks", url: "https://www.solidworks.com/", description: "Solid modeling computer-aided design and engineering program." },
      { title: "LabVIEW", url: "https://www.ni.com/en-us/shop/labview.html", description: "Systems engineering software for applications that require test, measurement, and control." }
    ];
    updateSoftwareLinks(defaults);
    toast({ title: "Software links reset to defaults" });
  };

  // Academic Management Helpers
  const addSemester = () => {
    if (!newSemesterName.trim()) return;
    const newSemester: Semester = { id: uuidv4(), name: newSemesterName.trim(), courses: [] };
    updateAcademicStructure({ semesters: [...academicStructure.semesters, newSemester] });
    setNewSemesterName("");
    setIsAddSemesterOpen(false);
  };

  const confirmRemoveSemester = (id: string) => {
    setDeleteConfig({
      title: "Remove Semester?",
      desc: "Are you sure you want to remove this semester and all its courses? This action cannot be undone.",
      onConfirm: () => {
        updateAcademicStructure({ semesters: academicStructure.semesters.filter(s => s.id !== id) });
        setIsConfirmDeleteOpen(false);
      }
    });
    setIsConfirmDeleteOpen(true);
  };

  const addCourse = () => {
    if (!newCourseName.trim() || !targetSemesterId) return;
    const newCourse: Course = { id: uuidv4(), name: newCourseName.trim(), code: newCourseCode.trim() || "", resources: [] };
    const newSemesters = academicStructure.semesters.map(s => 
      s.id === targetSemesterId ? { ...s, courses: [...s.courses, newCourse] } : s
    );
    updateAcademicStructure({ semesters: newSemesters });
    setNewCourseName("");
    setNewCourseCode("");
    setIsAddCourseOpen(false);
  };

  const confirmRemoveCourse = (semesterId: string, courseId: string) => {
    setDeleteConfig({
      title: "Remove Course?",
      desc: "Are you sure you want to remove this course and all its resources?",
      onConfirm: () => {
        const newSemesters = academicStructure.semesters.map(s => 
          s.id === semesterId ? { ...s, courses: s.courses.filter(c => c.id !== courseId) } : s
        );
        updateAcademicStructure({ semesters: newSemesters });
        setIsConfirmDeleteOpen(false);
      }
    });
    setIsConfirmDeleteOpen(true);
  };

  const addResource = (semesterId: string, courseId: string, url: string) => {
    const fileName = url.split('/').pop() || "Resource";
    const isImage = fileName.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i);
    const isVideo = fileName.match(/\.(mp4|webm|mov|avi)$/i);
    const isPdf = fileName.match(/\.(pdf)$/i);
    
    const type: AcademicResource["type"] = isImage ? "image" : isVideo ? "video" : isPdf ? "pdf" : "other";
    
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

  const addTag = () => {
    if (!newTagName.trim() || !tagContext) return;
    const { sId, cId, rId } = tagContext;
    updateResourceTags(sId, cId, rId, [...academicStructure.semesters.find(s => s.id === sId)?.courses.find(c => c.id === cId)?.resources.find(r => r.id === rId)?.tags || [], newTagName.trim()]);
    setNewTagName("");
    setIsAddTagOpen(false);
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Academic Resource Library</CardTitle>
            <Button onClick={() => setIsAddSemesterOpen(true)} size="sm" variant="outline" className="gap-2">
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
                        <Button size="sm" variant="ghost" onClick={() => {
                          setTargetSemesterId(semester.id);
                          setIsAddCourseOpen(true);
                        }} className="h-8 gap-1">
                          <Plus className="h-3 w-3" /> Add Course
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => confirmRemoveSemester(semester.id)} className="h-8 text-destructive hover:text-destructive">
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
                            <Button size="sm" variant="ghost" onClick={() => confirmRemoveCourse(semester.id, course.id)} className="h-8 text-destructive">
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
                                     res.type === "video" ? <Film className="h-4 w-4" /> : 
                                     res.name.match(/\.(doc|docx)$/i) ? <FileText className="h-4 w-4 text-blue-500" /> :
                                     <ExternalLink className="h-4 w-4" />}
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
                                          setTagContext({ sId: semester.id, cId: course.id, rId: res.id });
                                          setIsAddTagOpen(true);
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
                              <MediaSelectorDialog onSelect={(url) => addResource(semester.id, course.id, url)} />
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Software Management</CardTitle>
            <div className="flex gap-2">
              <Button onClick={resetSoftwareToDefaults} size="sm" variant="ghost" className="text-xs">
                Reset to Defaults
              </Button>
              <Button onClick={() => setIsAddSoftwareOpen(true)} size="sm" variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> Add Software
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {softwareLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No software links added.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {softwareLinks.map((sw, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-card group">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{sw.title}</h4>
                      <p className="text-[10px] text-muted-foreground truncate">{sw.url}</p>
                      {sw.description && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{sw.description}</p>}
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" 
                      onClick={() => {
                        const newLinks = [...softwareLinks];
                        newLinks.splice(idx, 1);
                        updateSoftwareLinks(newLinks);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
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
            <div className="pt-6 border-t">
              <MembershipManagement />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Dialogs */}
      <Dialog open={isAddSemesterOpen} onOpenChange={setIsAddSemesterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Semester</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Semester Name</Label>
              <Input 
                placeholder="e.g., Level-1 Term-1" 
                value={newSemesterName} 
                onChange={e => setNewSemesterName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSemester()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSemesterOpen(false)}>Cancel</Button>
            <Button onClick={addSemester}>Add Semester</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddCourseOpen} onOpenChange={setIsAddCourseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Course Name</Label>
              <Input 
                placeholder="e.g., Anatomy & Physiology" 
                value={newCourseName} 
                onChange={e => setNewCourseName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Course Code (Optional)</Label>
              <Input 
                placeholder="e.g., BME 1101" 
                value={newCourseCode} 
                onChange={e => setNewCourseCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCourse()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCourseOpen(false)}>Cancel</Button>
            <Button onClick={addCourse}>Add Course</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddTagOpen} onOpenChange={setIsAddTagOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tag</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Tag Name</Label>
              <Input 
                placeholder="e.g., Lecture Notes" 
                value={newTagName} 
                onChange={e => setNewTagName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTagOpen(false)}>Cancel</Button>
            <Button onClick={addTag}>Add Tag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddSoftwareOpen} onOpenChange={setIsAddSoftwareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Software</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Software Title</Label>
              <Input 
                placeholder="e.g., MATLAB" 
                value={newSoftware.title} 
                onChange={e => setNewSoftware(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Download/Info URL</Label>
              <Input 
                placeholder="https://..." 
                value={newSoftware.url} 
                onChange={e => setNewSoftware(prev => ({ ...prev, url: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea 
                placeholder="Brief description of the software..." 
                value={newSoftware.description} 
                onChange={e => setNewSoftware(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSoftwareOpen(false)}>Cancel</Button>
            <Button onClick={addSoftware}>Add Software</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteConfig?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfig?.desc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteConfig?.onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminPortal;
