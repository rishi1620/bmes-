import AdminCrudPage, { FieldDef } from "@/components/admin/AdminCrudPage";

const fields: FieldDef[] = [
  { key: "page_name", label: "Page Name", required: true },
  { key: "slug", label: "Slug (e.g. /about)", required: true },
  { key: "is_visible", label: "Visible", type: "boolean" },
  { key: "display_order", label: "Display Order", type: "number" },
];

const AdminPages = () => (
  <AdminCrudPage tableName="pages" title="Pages / Navigation" fields={fields} columns={["page_name", "slug", "is_visible", "display_order"]} orderBy="display_order" />
);

export default AdminPages;
