import AdminCrudPage, { FieldDef } from "@/components/admin/AdminCrudPage";

const fields: FieldDef[] = [
  { key: "title", label: "Title", required: true },
  { key: "description", label: "Description", type: "textarea" },
  { key: "date", label: "Event Date & Time", type: "datetime" },
  { key: "location", label: "Location" },
  { key: "type", label: "Type", type: "select", options: ["workshop", "seminar", "competition", "meetup", "conference"] },
  { key: "image_url", label: "Event Image", type: "image" },
  { key: "is_upcoming", label: "Is Upcoming Event?", type: "boolean" },
];

const AdminEvents = () => (
  <AdminCrudPage 
    tableName="events" 
    title="Events" 
    fields={fields} 
    columns={["title", "type", "location", "is_upcoming"]} 
  />
);

export default AdminEvents;
