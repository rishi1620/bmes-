import { useEffect, useState } from "react";
import { Save } from "lucide-react";
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

const groups: { key: string; label: string; fields: { key: string; label: string; type?: "text" | "textarea" }[] }[] = [
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
    ],
  },
  {
    key: "academics_syllabus",
    label: "Syllabus & Curriculum",
    fields: [
      { key: "academics_syllabus_content", label: "Syllabus Details", type: "textarea" },
      { key: "academics_syllabus_pdf_url", label: "Syllabus PDF URL" },
    ],
  },
  {
    key: "academics_resources",
    label: "Academic Resources (URLs)",
    fields: [
      { key: "academics_calendar_url", label: "Academic Calendar URL" },
      { key: "academics_routine_url", label: "Class Routine URL" },
      { key: "academics_exam_url", label: "Exam Schedule URL" },
    ],
  },
  {
    key: "academics_postgrad",
    label: "Postgraduate Program",
    fields: [
      { key: "academics_postgrad_content", label: "Postgraduate Details", type: "textarea" },
    ],
  },
];

const AdminAcademics = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

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

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Academics Page Content</h1>
        <Button onClick={handleSave} size="sm" disabled={saving}>
          <Save className="mr-1.5 h-4 w-4" /> {saving ? "Saving…" : "Save All"}
        </Button>
      </div>

      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group.key} className="rounded-lg border border-border bg-card p-5">
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
                  ) : (
                    <Input
                      value={settings[field.key] ?? ""}
                      onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminAcademics;
