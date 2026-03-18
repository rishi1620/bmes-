import { useEffect, useState, useCallback } from "react";
import { Save, FileText, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import MediaSelectorDialog from "@/components/admin/MediaSelectorDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Setting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_group: string;
}

interface BatchResource {
  id: string;
  title: string;
  category: "calendar" | "routine" | "exam";
  batch: string;
  semester?: string;
  fileUrl: string;
  fileType: "pdf" | "image" | "link";
}

const groups: { key: string; label: string; fields: { key: string; label: string; type?: string }[] }[] = [
  {
    key: "academics_hero",
    label: "Hero Section",
    fields: [
      { key: "academics_hero_title", label: "Title" },
      { key: "academics_hero_subtitle", label: "Subtitle", type: "textarea" },
    ],
  },
  {
    key: "academics_undergrad",
    label: "Undergraduate Program (B.Sc.)",
    fields: [
      { key: "academics_undergrad_overview", label: "Program Overview", type: "textarea" },
      { key: "academics_undergrad_admission", label: "Admission Requirements", type: "textarea" },
      { key: "academics_undergrad_pdf_url", label: "Undergraduate Guidelines PDF", type: "file" },
    ],
  },
  {
    key: "academics_syllabus",
    label: "Syllabus & Curriculum",
    fields: [
      { key: "academics_syllabus_content", label: "Syllabus Details", type: "textarea" },
      ...Array.from({ length: 4 }, (_, l) => 
        Array.from({ length: 2 }, (_, t) => ({
          key: `academics_syllabus_l${l + 1}t${t + 1}_pdf`,
          label: `Level ${l + 1} Term ${t + 1} Syllabus PDF`,
          type: "file" as const
        }))
      ).flat(),
      ...Array.from({ length: 4 }, (_, l) => 
        Array.from({ length: 2 }, (_, t) => ({
          key: `academics_syllabus_l${l + 1}t${t + 1}_media`,
          label: `Level ${l + 1} Term ${t + 1} Media`,
          type: "file" as const
        }))
      ).flat(),
    ],
  },
  {
    key: "academics_postgrad",
    label: "Postgraduate Program",
    fields: [
      { key: "academics_postgrad_content", label: "Postgraduate Details", type: "textarea" },
      { key: "academics_postgrad_pdf_url", label: "Postgraduate Guidelines PDF", type: "file" },
    ],
  },
];

const AdminAcademics = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [batchResources, setBatchResources] = useState<BatchResource[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("site_settings").select("*").eq("setting_group", "academics_page");
    const map: Record<string, string> = {};
    (data as Setting[] | null)?.forEach((s) => { map[s.setting_key] = s.setting_value; });
    setSettings(map);

    if (map.academics_batch_resources) {
      try {
        setBatchResources(JSON.parse(map.academics_batch_resources));
      } catch (e) {
        console.error("Failed to parse batch resources", e);
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const allKeys = groups.flatMap(g => g.fields.map(f => f.key));
      
      for (const key of allKeys) {
        const { data: existing } = await supabase.from("site_settings").select("id").eq("setting_key", key).maybeSingle();
        
        if (!existing) {
          await supabase.from("site_settings").insert({
            setting_group: "academics_page",
            setting_key: key,
            setting_value: settings[key] || ""
          });
        } else {
          await supabase.from("site_settings").update({ setting_value: settings[key] || "" }).eq("setting_key", key);
        }
      }

      // Save batch resources
      const { data: existingBatch } = await supabase.from("site_settings").select("id").eq("setting_key", "academics_batch_resources").maybeSingle();
      if (!existingBatch) {
        await supabase.from("site_settings").insert({
          setting_group: "academics_page",
          setting_key: "academics_batch_resources",
          setting_value: JSON.stringify(batchResources)
        });
      } else {
        await supabase.from("site_settings").update({ setting_value: JSON.stringify(batchResources) }).eq("setting_key", "academics_batch_resources");
      }

      toast({ title: "Academics page content saved" });
    } catch (error) {
      toast({ title: "Error saving content", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addBatchResource = () => {
    setBatchResources([
      ...batchResources,
      {
        id: Date.now().toString(),
        title: "",
        category: "calendar",
        batch: new Date().getFullYear().toString(),
        semester: "",
        fileUrl: "",
        fileType: "pdf"
      }
    ]);
  };

  const updateBatchResource = (id: string, field: keyof BatchResource, value: string) => {
    setBatchResources(batchResources.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeBatchResource = (id: string) => {
    setBatchResources(batchResources.filter(r => r.id !== id));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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
        <h1 className="text-2xl font-bold text-foreground">Academics Page Content</h1>
        <Button onClick={handleSave} size="sm" disabled={saving}>
          <Save className="mr-1.5 h-4 w-4" /> {saving ? "Saving…" : "Save All"}
        </Button>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {groups.map((group) => (
          <motion.div variants={itemVariants} key={group.key}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{group.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.fields.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label>{field.label}</Label>
                    {field.type === "textarea" ? (
                      <Textarea
                        className="min-h-[100px]"
                        value={settings[field.key] ?? ""}
                        onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                      />
                    ) : field.type === "file" ? (
                      <div className="flex gap-2">
                        <Input
                          value={settings[field.key] ?? ""}
                          onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                          placeholder="Enter URL or upload a file"
                          className="flex-1"
                        />
                        <MediaSelectorDialog
                          onSelect={(url) => setSettings({ ...settings, [field.key]: url })}
                          trigger={
                            <Button variant="outline">
                              <FileText className="h-4 w-4 mr-2" />
                              Select PDF
                            </Button>
                          }
                        />
                      </div>
                    ) : (
                      <Input
                        value={settings[field.key] ?? ""}
                        onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Batch-wise Academic Resources</CardTitle>
              <Button onClick={addBatchResource} size="sm" variant="outline">
                <Plus className="mr-1.5 h-4 w-4" /> Add Resource
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {batchResources.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No batch resources added yet.</p>
              ) : (
                batchResources.map((resource) => (
                  <div key={resource.id} className="p-4 border border-border rounded-md relative bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                      onClick={() => removeBatchResource(resource.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8">
                      <div className="space-y-1.5">
                        <Label>Title</Label>
                        <Input 
                          value={resource.title} 
                          onChange={(e) => updateBatchResource(resource.id, "title", e.target.value)} 
                          placeholder="e.g. Fall 2023 Calendar"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label>Batch</Label>
                        <Input 
                          value={resource.batch} 
                          onChange={(e) => updateBatchResource(resource.id, "batch", e.target.value)} 
                          placeholder="e.g. 2021"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label>Semester</Label>
                        <Select 
                          value={resource.semester || "all"} 
                          onValueChange={(val) => updateBatchResource(resource.id, "semester", val === "all" ? "" : val)}
                        >
                          <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Semesters / General</SelectItem>
                            <SelectItem value="Level-1 Term-1">Level-1 Term-1</SelectItem>
                            <SelectItem value="Level-1 Term-2">Level-1 Term-2</SelectItem>
                            <SelectItem value="Level-2 Term-1">Level-2 Term-1</SelectItem>
                            <SelectItem value="Level-2 Term-2">Level-2 Term-2</SelectItem>
                            <SelectItem value="Level-3 Term-1">Level-3 Term-1</SelectItem>
                            <SelectItem value="Level-3 Term-2">Level-3 Term-2</SelectItem>
                            <SelectItem value="Level-4 Term-1">Level-4 Term-1</SelectItem>
                            <SelectItem value="Level-4 Term-2">Level-4 Term-2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label>Category</Label>
                        <Select 
                          value={resource.category} 
                          onValueChange={(val) => updateBatchResource(resource.id, "category", val)}
                        >
                          <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="calendar">Academic Calendar</SelectItem>
                            <SelectItem value="routine">Class Routine</SelectItem>
                            <SelectItem value="exam">Exam Schedule</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label>File Type</Label>
                        <Select 
                          value={resource.fileType} 
                          onValueChange={(val) => updateBatchResource(resource.id, "fileType", val)}
                        >
                          <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="Select file type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="image">Image</SelectItem>
                            <SelectItem value="link">External Link</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-1.5 md:col-span-2">
                        <Label>File URL</Label>
                        <div className="flex gap-2">
                          <Input 
                            value={resource.fileUrl} 
                            onChange={(e) => updateBatchResource(resource.id, "fileUrl", e.target.value)} 
                            placeholder="Enter URL or select from media"
                            className="flex-1"
                          />
                          <MediaSelectorDialog
                            onSelect={(url) => updateBatchResource(resource.id, "fileUrl", url)}
                            trigger={
                              <Button variant="outline">
                                <FileText className="h-4 w-4 mr-2" />
                                Select File
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminAcademics;
