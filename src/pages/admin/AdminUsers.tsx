import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { Loader2, Search, Shield, UserPlus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label as UILabel } from "@/components/ui/label";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  roles: AppRole[];
}

const AdminUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin, hasRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newUserRole, setNewUserRole] = useState<AppRole>("editor");

  // Only admins and super_admins can manage roles
  const canManageRoles = isAdmin || hasRole(["admin", "super_admin"]);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Fetch roles first to ensure we see everyone with a permission
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;

      // Get unique user IDs from both sources
      const allUserIds = Array.from(new Set([
        ...roles.map(r => r.user_id),
        ...profiles.map(p => p.user_id)
      ]));

      // Combine data
      const usersWithRoles: UserProfile[] = allUserIds.map(userId => {
        const profile = profiles.find(p => p.user_id === userId);
        const userRoles = roles
          .filter(r => r.user_id === userId)
          .map(r => r.role);
        
        return {
          id: userId,
          email: profile?.full_name || "New User (No Profile Yet)",
          full_name: profile?.full_name || null,
          roles: userRoles
        };
      });

      return usersWithRoles;
    },
    enabled: canManageRoles,
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Role assigned successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to assign role", description: error.message, variant: "destructive" });
    }
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .match({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Role removed successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to remove role", description: error.message, variant: "destructive" });
    }
  });

  const handleAssignRole = (userId: string, role: AppRole) => {
    assignRoleMutation.mutate({ userId, role });
  };

  const handleManualAdd = () => {
    if (!newUserId.trim()) {
      toast({ title: "User ID is required", variant: "destructive" });
      return;
    }
    assignRoleMutation.mutate({ userId: newUserId.trim(), role: newUserRole }, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        setNewUserId("");
      }
    });
  };

  const handleRemoveRole = (userId: string, role: AppRole) => {
    removeRoleMutation.mutate({ userId, role });
  };

  const filteredUsers = users?.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!canManageRoles) {
    return (
      <AdminLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground mt-2">You don't have permission to manage users and roles.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users & Roles</h1>
            <p className="text-muted-foreground mt-1">Manage user access and permissions across the admin panel.</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add User by ID
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Admin User</DialogTitle>
                <DialogDescription>
                  Enter the User ID (UID) from your Supabase Authentication dashboard to grant them access.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <UILabel htmlFor="uid">User ID (UID)</UILabel>
                  <Input 
                    id="uid" 
                    placeholder="e.g. 03b64b68-685b-4a3b-b90f-f2b0e8d5b818" 
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <UILabel htmlFor="role">Initial Role</UILabel>
                  <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin (Full Access)</SelectItem>
                      <SelectItem value="editor">Editor (Content Only)</SelectItem>
                      <SelectItem value="content_manager">Content Manager</SelectItem>
                      <SelectItem value="user">Regular User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleManualAdd} disabled={assignRoleMutation.isPending}>
                  {assignRoleMutation.isPending ? "Adding..." : "Grant Access"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Current Roles</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name || "Unknown User"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono">
                        {user.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {user.roles.length > 0 ? (
                            user.roles.map(role => (
                              <span key={role} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                {role}
                                <button 
                                  onClick={() => handleRemoveRole(user.id, role)}
                                  className="ml-1 hover:text-destructive focus:outline-none"
                                  title={`Remove ${role} role`}
                                >
                                  &times;
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm italic">No roles assigned</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          onValueChange={(value) => handleAssignRole(user.id, value as AppRole)}
                        >
                          <SelectTrigger className="w-[140px] ml-auto">
                            <SelectValue placeholder="Assign Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="content_manager">Content Manager</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;