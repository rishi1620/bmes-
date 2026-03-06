import AdminCrudPage, { FieldDef } from "@/components/admin/AdminCrudPage";

const fields: FieldDef[] = [
  { key: "event_id", label: "Event ID", required: true },
  { key: "name", label: "Name", required: true },
  { key: "email", label: "Email", required: true },
  { key: "details", label: "Additional Details", type: "textarea" },
];

const AdminRegistrations = () => (
  <AdminCrudPage 
    tableName="event_registrations" 
    title="Event Registrations" 
    fields={fields} 
    columns={["name", "email", "event_id", "created_at"]} 
  />
);

export default AdminRegistrations;
