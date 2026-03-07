import AdminCrudPage, { FieldDef } from "@/components/admin/AdminCrudPage";

const fields: FieldDef[] = [
  { key: "title", label: "Title", required: true },
  { key: "description", label: "Description", type: "textarea" },
  { key: "status", label: "Status", type: "select", options: ["In Progress", "Planning", "Completed", "Paused"] },
  { key: "progress", label: "Progress (%)", type: "progress" },
  { key: "lead", label: "Project Lead" },
  { key: "team_members", label: "Team Members", type: "list" },
  { key: "category", label: "Category" },
  { key: "image_url", label: "Image URL", type: "image" },
];

const AdminProjects = () => (
  <AdminCrudPage 
    tableName="projects" 
    title="Projects" 
    fields={fields} 
    columns={["title", "status", "progress", "lead"]} 
    defaultValues={{ status: "Planning" }}
  />
);

export default AdminProjects;
