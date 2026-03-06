import AdminLayout from "@/components/layout/AdminLayout";
import AdminCrudTable, { FieldDef } from "./AdminCrudTable";

type TableName = "members" | "events" | "projects" | "achievements" | "advisors" | "alumni" | "pages" | "faqs" | "event_registrations";

interface Props {
  tableName: TableName;
  title: string;
  fields: FieldDef[];
  columns: string[];
  orderBy?: string;
}

const AdminCrudPage = (props: Props) => {
  return (
    <AdminLayout>
      <AdminCrudTable {...props} />
    </AdminLayout>
  );
};

export type { FieldDef };
export default AdminCrudPage;
