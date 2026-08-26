import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRole {
  id: string;
  full_name: string | null;
  user_id: string;
  role: AppRole | null;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, user_id");

    if (profilesError) {
      toast.error("Error fetching users");
      setLoading(false);
      return;
    }

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      toast.error("Error fetching roles");
      setLoading(false);
      return;
    }

    const usersWithRoles = profiles.map(profile => {
      const roleEntry = roles.find(r => r.user_id === profile.user_id);
      return {
        ...profile,
        role: roleEntry ? (roleEntry.role as AppRole) : null
      };
    });

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const updateRole = async (userId: string, newRole: AppRole) => {
    const { error } = await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role: newRole }, { onConflict: "user_id" });

    if (error) {
      toast.error("Error updating role");
    } else {
      toast.success("Role updated successfully");
      fetchUsers();
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Users & Roles</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(user => (
            <TableRow key={user.id}>
              <TableCell>{user.full_name || "Unknown"}</TableCell>
              <TableCell>
                <Select value={user.role || ""} onValueChange={(value) => updateRole(user.user_id, value as AppRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {["admin", "user", "super_admin", "editor", "content_manager"].map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminUsers;
