import AdminCrudPage, { FieldDef } from "@/components/admin/AdminCrudPage";

const fields: FieldDef[] = [
  { key: "title", label: "Title", required: true },
  { key: "image_url", label: "Photo / Image", type: "image" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "category", label: "Category", type: "select", options: ["competition", "publication", "grant", "media", "award", "event"] },
  { key: "year", label: "Year" },
  { key: "team", label: "Team" },
  { key: "place", label: "Place / Award" },
  { key: "journal", label: "Journal" },
  { key: "authors", label: "Authors" },
  { key: "doi", label: "DOI" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
  { key: "outlet", label: "Media Outlet" },
  { key: "date_text", label: "Date Text" },
  { key: "media_type", label: "Media Type" },
];

const AdminAchievements = () => (
  <AdminCrudPage tableName="achievements" title="Achievements" fields={fields} columns={["title", "category", "year", "place"]} />
);

export default AdminAchievements;
