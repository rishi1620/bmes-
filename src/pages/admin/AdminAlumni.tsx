import AdminCrudPage, { FieldDef } from "@/components/admin/AdminCrudPage";

const fields: FieldDef[] = [
  { key: "name", label: "Name", required: true },
  { key: "batch", label: "Batch" },
  { key: "current_position", label: "Current Position" },
  { key: "organization", label: "Organization" },
  { key: "location", label: "Location" },
  { key: "linkedin", label: "LinkedIn URL" },
  { key: "testimonial", label: "Testimonial", type: "textarea" },
  { key: "photo", label: "Photo URL" },
  { key: "is_featured", label: "Featured", type: "boolean" },
  { key: "display_order", label: "Display Order", type: "number" },
];

const AdminAlumni = () => (
  <AdminCrudPage tableName="alumni" title="Alumni" fields={fields} columns={["name", "batch", "current_position", "organization", "is_featured"]} orderBy="display_order" />
);

export default AdminAlumni;
