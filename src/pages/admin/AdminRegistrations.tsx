import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminCrudTable, { FieldDef } from "@/components/admin/AdminCrudTable";
import GoogleFormsSyncBar from "@/components/admin/GoogleFormsSyncBar";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { FileCheck2, Globe } from "lucide-react";

const AdminRegistrations = () => {
  const [eventMap, setEventMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase.from("events").select("id, title");
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(e => map[e.id] = e.title);
        setEventMap(map);
      }
    };
    fetchEvents();
  }, []);

  const fields: FieldDef[] = [
    { 
      key: "source", 
      label: "Source", 
      render: (_, row) => {
        const details = typeof row.details === "string" ? row.details : "";
        const isGForm = details.includes("Google Form") || details.includes("[gform:");
        return isGForm ? (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 text-[10px] gap-1 px-1.5 whitespace-nowrap">
            <FileCheck2 className="h-3 w-3 text-purple-600" /> Google Form
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] text-muted-foreground px-1.5 gap-1">
            <Globe className="h-3 w-3 text-muted-foreground" /> Website
          </Badge>
        );
      }
    },
    { key: "event_id", label: "Event", required: true, render: (val) => eventMap[val as string] || String(val) },
    { key: "name", label: "Name", required: true },
    { key: "email", label: "Email", required: true },
    { key: "student_id", label: "Student ID" },
    { key: "batch", label: "Batch" },
    { key: "department", label: "Department" },
    { key: "created_at", label: "Date", type: "datetime" },
    { key: "details", label: "Registration Notes / Form Data", type: "textarea" },
  ];

  return (
    <AdminLayout>
      <GoogleFormsSyncBar 
        contextTitle="Event registrations submitted through official Google Forms automatically synchronize into this table."
        formType="registration"
      />
      <AdminCrudTable 
        tableName="event_registrations" 
        title="Event Registrations" 
        description="View and manage participant registrations from both the website and embedded Google Forms."
        fields={fields} 
        columns={["name", "email", "student_id", "batch", "department", "event_id", "details", "created_at"]} 
      />
    </AdminLayout>
  );
};

export default AdminRegistrations;
