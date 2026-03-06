import AdminCrudPage, { FieldDef } from "@/components/admin/AdminCrudPage";

const fields: FieldDef[] = [
  { key: "name", label: "Name", required: true },
  { key: "designation", label: "Designation" },
  { key: "department", label: "Department" },
  { key: "role_type", label: "Role Type", type: "select", options: ["Advisor", "Moderator"] },
  { key: "bio", label: "Bio", type: "textarea" },
  { key: "email", label: "Email" },
  { key: "linkedin", label: "LinkedIn URL" },
  { key: "photo", label: "Photo URL" },
  { key: "display_order", label: "Display Order", type: "number" },
  { key: "is_active", label: "Active", type: "boolean" },
];

const AdminAdvisors = () => (
  <AdminCrudPage tableName="advisors" title="Advisors & Moderators" fields={fields} columns={["name", "designation", "role_type", "is_active"]} orderBy="display_order" />
);

export default AdminAdvisors;
