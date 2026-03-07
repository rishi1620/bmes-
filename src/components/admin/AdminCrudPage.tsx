import AdminLayout from "@/components/layout/AdminLayout";
import AdminCrudTable, { FieldDef, TableName } from "./AdminCrudTable";

interface Props {
  tableName: TableName;
  title: string;
  fields: FieldDef[];
  columns: string[];
  orderBy?: string;
  filter?: (row: Record<string, unknown>) => boolean;
  defaultValues?: Record<string, unknown>;
  hiddenFields?: string[];
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
