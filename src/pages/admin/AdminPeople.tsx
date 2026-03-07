import AdminLayout from "@/components/layout/AdminLayout";
import AdminCrudTable, { FieldDef } from "@/components/admin/AdminCrudTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const advisorFields: FieldDef[] = [
  { key: "name", label: "Name", required: true },
  { key: "designation", label: "Designation" },
  { key: "department", label: "Department" },
  { key: "role_type", label: "Role Type", type: "select", options: ["Advisor", "Moderator", "Faculty"] },
  { key: "bio", label: "Bio", type: "textarea" },
  { key: "email", label: "Email" },
  { key: "linkedin", label: "LinkedIn URL" },
  { key: "photo", label: "Photo", type: "image" },
  { key: "display_order", label: "Display Order", type: "number" },
  { key: "is_active", label: "Active", type: "boolean" },
];

const memberFields: FieldDef[] = [
  { key: "name", label: "Name", required: true },
  { key: "role", label: "Role (e.g. President)" },
  { key: "department", label: "Department" },
  { key: "team", label: "Team", type: "select", options: ["Executive Committee", "Technical Team", "Operations Team", "Staff", ""] },
  { key: "email", label: "Email" },
  { key: "linkedin", label: "LinkedIn URL" },
  { key: "bio", label: "Bio", type: "textarea" },
  { key: "image_url", label: "Photo", type: "image" },
  { key: "is_active", label: "Active", type: "boolean" },
  { key: "display_order", label: "Display Order", type: "number" },
];

const AdminPeople = () => {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">People Management</h1>
      
      <Tabs defaultValue="faculty" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="faculty">Faculty</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="ec">BMES EC & Members</TabsTrigger>
          <TabsTrigger value="advisory">Advisory</TabsTrigger>
        </TabsList>
        
        <TabsContent value="faculty">
          <AdminCrudTable 
            tableName="advisors" 
            title="Faculty" 
            fields={advisorFields} 
            columns={["name", "designation", "department", "is_active"]} 
            orderBy="display_order"
            filter={(row) => row.role_type === 'Faculty'}
            defaultValues={{ role_type: 'Faculty' }}
            hiddenFields={['role_type']}
          />
        </TabsContent>
        
        <TabsContent value="staff">
          <AdminCrudTable 
            tableName="members" 
            title="Staff" 
            fields={memberFields} 
            columns={["name", "role", "department", "is_active"]} 
            orderBy="display_order"
            filter={(row) => row.team === 'Staff'}
            defaultValues={{ team: 'Staff' }}
            hiddenFields={['team']}
          />
        </TabsContent>
        
        <TabsContent value="ec">
          <AdminCrudTable 
            tableName="members" 
            title="Executive Committee & Members" 
            fields={memberFields} 
            columns={["name", "role", "team", "is_active"]} 
            orderBy="display_order"
          />
        </TabsContent>
        
        <TabsContent value="advisory">
          <AdminCrudTable 
            tableName="advisors" 
            title="Advisors & Moderators" 
            fields={advisorFields} 
            columns={["name", "designation", "role_type", "is_active"]} 
            orderBy="display_order"
            filter={(row) => row.role_type === 'Advisor' || row.role_type === 'Moderator'}
            defaultValues={{ role_type: 'Advisor' }}
          />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminPeople;
