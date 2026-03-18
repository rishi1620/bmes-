import { useEffect, useState, useCallback } from "react";
// Force update to resolve Vercel build mismatch
import { Save, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import MediaSelectorDialog from "@/components/admin/MediaSelectorDialog";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Setting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_group: string;
}

const groups: { key: string; label: string; fields: { key: string; label: string; type?: "text" | "textarea" }[] }[] = [
  {
    key: "about_tabs",
    label: "Tab Labels",
    fields: [
      { key: "about_tab_messages", label: "Messages Tab Label" },
      { key: "about_tab_dept", label: "Dept Profile Tab Label" },
      { key: "about_tab_bmes", label: "BMES Profile Tab Label" },
      { key: "about_tab_constitution", label: "Constitution Tab Label" },
    ],
  },
  {
    key: "about_hero",
    label: "Hero Section",
    fields: [
      { key: "about_hero_title", label: "Title" },
      { key: "about_hero_subtitle", label: "Subtitle", type: "textarea" },
      { key: "about_hero_bg_image", label: "Background Image URL" },
    ],
  },
  {
    key: "about_messages",
    label: "Leadership Messages",
    fields: [
      { key: "about_messages_title", label: "Section Title" },
      { key: "about_messages_desc", label: "Section Description", type: "textarea" },
      { key: "about_hod_title", label: "HOD Card Title" },
      { key: "about_hod_name", label: "HOD Name" },
      { key: "about_hod_role", label: "HOD Role" },
      { key: "about_hod_image", label: "HOD Image URL" },
      { key: "about_hod_message", label: "HOD Message", type: "textarea" },
      { key: "about_pres_title", label: "President Card Title" },
      { key: "about_pres_name", label: "President Name" },
      { key: "about_pres_role", label: "President Role" },
      { key: "about_pres_image", label: "President Image URL" },
      { key: "about_pres_message", label: "President Message", type: "textarea" },
    ],
  },
  {
    key: "about_dept",
    label: "Department Profile",
    fields: [
      { key: "about_dept_title", label: "Section Title" },
      { key: "about_dept_desc", label: "Section Description", type: "textarea" },
      { key: "about_dept_history_title", label: "History Title" },
      { key: "about_dept_history", label: "History", type: "textarea" },
      { key: "about_dept_mission_title", label: "Mission Title" },
      { key: "about_dept_mission", label: "Mission", type: "textarea" },
      { key: "about_dept_vision_title", label: "Vision Title" },
      { key: "about_dept_vision", label: "Vision", type: "textarea" },
    ],
  },
  {
    key: "about_bmes",
    label: "BMES Profile",
    fields: [
      { key: "about_bmes_title", label: "Section Title" },
      { key: "about_bmes_desc", label: "Section Description", type: "textarea" },
      { key: "about_bmes_about_title", label: "About BMES Title" },
      { key: "about_bmes_about", label: "About BMES", type: "textarea" },
      { key: "about_bmes_objectives_title", label: "Objectives Title" },
      { key: "about_bmes_objectives", label: "Objectives (One per line)", type: "textarea" },
    ],
  },
  {
    key: "about_constitution",
    label: "Constitution",
    fields: [
      { key: "about_constitution_title", label: "Section Title" },
      { key: "about_constitution_desc_main", label: "Section Description", type: "textarea" },
      { key: "about_constitution_card_title", label: "Card Title" },
      { key: "about_constitution_desc", label: "Card Description", type: "textarea" },
      { key: "about_constitution_btn_text", label: "Button Text" },
      { key: "about_constitution_pdf_url", label: "Constitution PDF URL" },
    ],
  },
];

const AdminAbout = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("site_settings").select("*").eq("setting_group", "about_page");
    const map: Record<string, string> = {};
    (data as Setting[] | null)?.forEach((s) => { map[s.setting_key] = s.setting_value; });
    setSettings(map);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    
    // First, ensure all these settings exist in the database
    const allKeys = groups.flatMap(g => g.fields.map(f => f.key));
    
    for (const key of allKeys) {
      const { data: existing } = await supabase.from("site_settings").select("id").eq("setting_key", key).maybeSingle();
      
      if (!existing) {
        await supabase.from("site_settings").insert({
          setting_group: "about_page",
          setting_key: key,
          setting_value: settings[key] || ""
        });
      } else {
        await supabase.from("site_settings").update({ setting_value: settings[key] || "" }).eq("setting_key", key);
      }
    }

    toast({ title: "About page content saved" });
    setSaving(false);
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
        <h1 className="text-2xl font-bold text-foreground">About Page Content</h1>
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
                    <div className="flex gap-2">
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
                      {field.key.includes("image") || field.key.includes("url") ? (
                        <MediaSelectorDialog 
                          onSelect={(url) => setSettings({ ...settings, [field.key]: url })}
                          trigger={<Button variant="outline" size="icon" title="Open Media Library"><ImageIcon className="h-4 w-4" /></Button>}
                        />
                      ) : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </AdminLayout>
  );
};

export default AdminAbout;
