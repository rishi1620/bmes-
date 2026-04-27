import { useEffect, useState } from "react";
import AdminCrudPage, { FieldDef } from "@/components/admin/AdminCrudPage";
import { supabase } from "@/integrations/supabase/client";

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
    { key: "event_id", label: "Event", required: true, render: (val) => eventMap[val as string] || String(val) },
    { key: "name", label: "Name", required: true },
    { key: "email", label: "Email", required: true },
    { key: "created_at", label: "Date", type: "datetime" },
  ];

  return (
    <AdminCrudPage 
      tableName="event_registrations" 
      title="Event Registrations" 
      fields={fields} 
      columns={["name", "email", "event_id", "created_at"]} 
    />
  );
};

export default AdminRegistrations;
