import { useEffect, useState, useRef } from "react";
import { Save, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface Setting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_group: string;
}

const groups: { key: string; label: string; fields: { key: string; label: string; type?: "text" | "textarea" | "file" }[] }[] = [
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
    key: "academics_batches",
    label: "Batch-wise Syllabus & Resources",
    fields: [
      ...[2021, 2022, 2023, 2024, 2025, 2026].map(year => [
        { key: `academics_batch_${year}_enabled`, label: `Enable Batch ${year}`, type: "checkbox" as const },
        { key: `academics_batch_${year}_syllabus_pdf`, label: `Batch ${year} Syllabus PDF`, type: "file" as const },
        { key: `academics_batch_${year}_resources_pdf`, label: `Batch ${year} Resource PDF`, type: "file" as const },
        { key: `academics_batch_${year}_resources_media`, label: `Batch ${year} Resource Media`, type: "file" as const },
      ]).flat(),
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
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("setting_group", "academics_page");
      const map: Record<string, string> = {};
      (data as Setting[] | null)?.forEach((s) => { map[s.setting_key] = s.setting_value; });
      setSettings(map);
    };
    load();
  }, []);

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

      toast({ title: "Academics page content saved" });
    } catch (error) {
      toast({ title: "Error saving content", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, fieldKey: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldKey);
    try {
      const name = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error } = await supabase.storage.from("media").upload(name, file);
      
      if (error) {
        toast({ title: `Failed to upload ${file.name}`, description: error.message, variant: "destructive" });
      } else {
        const { data } = supabase.storage.from("media").getPublicUrl(name);
        setSettings({ ...settings, [fieldKey]: data.publicUrl });
        toast({ title: "File uploaded successfully" });
      }
    } catch (error) {
      toast({ title: "Upload error", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setUploadingField(null);
      if (fileInputRefs.current[fieldKey]) {
        fileInputRefs.current[fieldKey]!.value = '';
      }
    }
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
          <motion.div variants={itemVariants} key={group.key} className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-4 text-lg font-semibold text-foreground">{group.label}</h2>
            <div className="space-y-4">
              {group.fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label>{field.label}</Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      className="min-h-[100px]"
                      value={settings[field.key] ?? ""}
                      onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                    />
                  ) : field.type === "checkbox" ? (
                    <input
                      type="checkbox"
                      checked={settings[field.key] === "true"}
                      onChange={(e) => setSettings({ ...settings, [field.key]: e.target.checked ? "true" : "false" })}
                      className="h-5 w-5"
                    />
                  ) : field.type === "file" ? (
                    <div className="flex gap-2">
                      <Input
                        value={settings[field.key] ?? ""}
                        onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                        placeholder="Enter URL or upload a file"
                        className="flex-1"
                      />
                      <input
                        type="file"
                        accept="application/pdf,image/*,video/*"
                        className="hidden"
                        ref={(el) => fileInputRefs.current[field.key] = el}
                        onChange={(e) => handleFileUpload(e, field.key)}
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => fileInputRefs.current[field.key]?.click()}
                        disabled={uploadingField === field.key}
                      >
                        {uploadingField === field.key ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Upload PDF
                      </Button>
                    </div>
                  ) : (
                    <Input
                      value={settings[field.key] ?? ""}
                      onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </AdminLayout>
  );
};

export default AdminAcademics;
