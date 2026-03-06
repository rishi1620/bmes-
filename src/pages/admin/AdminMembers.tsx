import AdminCrudPage, { FieldDef } from "@/components/admin/AdminCrudPage";

const fields: FieldDef[] = [
  { key: "name", label: "Name", required: true },
  { key: "role", label: "Role (e.g. President)" },
  { key: "department", label: "Department" },
  { key: "team", label: "Team", type: "select", options: ["Executive Committee", "Technical Team", "Operations Team", ""] },
  { key: "email", label: "Email" },
  { key: "linkedin", label: "LinkedIn URL" },
  { key: "bio", label: "Bio", type: "textarea" },
  { key: "image_url", label: "Image URL" },
  { key: "is_active", label: "Active", type: "boolean" },
  { key: "display_order", label: "Display Order", type: "number" },
];

const AdminMembers = () => (
  <AdminCrudPage tableName="members" title="Members" fields={fields} columns={["name", "role", "team", "is_active"]} />
);

export default AdminMembers;
