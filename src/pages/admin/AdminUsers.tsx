import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { Edit, Loader2, RefreshCw, Search, Shield, Trash2, UserPlus } from "lucide-react";
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
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<AppRole>("editor");
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [userToDelete, setUserToDelete] = useState<string | null>(null);

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
          email: "N/A", // Email is not stored in public profiles for security
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

  const deleteProfileMutation = useMutation({
    mutationFn: async (userId: string) => {
      // First delete roles to avoid foreign key issues (though they might not exist)
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
        
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User profile deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete profile", description: error.message, variant: "destructive" });
    }
  });

  const handleDeleteProfile = (userId: string) => {
    setUserToDelete(userId);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteProfileMutation.mutate(userToDelete);
      setUserToDelete(null);
    }
  };

  const handleAssignRole = (userId: string, role: AppRole) => {
    assignRoleMutation.mutate({ userId, role });
  };

  const handleManualAdd = async () => {
    if (!newUserId.trim()) {
      toast({ title: "User ID is required", variant: "destructive" });
      return;
    }
    
    // Assign Role
    const roleToAssign = newUserRole;
    
    try {
      // 1. Assign Role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: newUserId.trim(), role: roleToAssign });
      
      if (roleError) {
        if (roleError.message.includes("foreign key")) {
          throw new Error("Invalid User ID. This user does not exist in the system. Make sure they have signed up first and confirmed their email if required.");
        }
        throw roleError;
      }

      // 2. Create/Update Profile if name is provided
      if (newUserName.trim()) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({ 
            id: newUserId.trim(),
            user_id: newUserId.trim(), 
            full_name: newUserName.trim()
          });
        
        if (profileError) {
          console.error("Error creating profile:", profileError);
          // We don't throw here because the role was already assigned successfully
          toast({ title: "Role assigned, but failed to set name", description: profileError.message });
        }
      }

      toast({ title: "User access granted successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setIsAddDialogOpen(false);
      setNewUserId("");
      setNewUserName("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      toast({ title: "Failed to add user", description: message, variant: "destructive" });
    }
  };

  const handleUpdateName = async () => {
    if (!editingUser || !editName.trim()) return;

    try {
      console.log("Updating name for user:", editingUser.id, "to:", editName.trim());
      
      const { error } = await supabase
        .from("profiles")
        .upsert({ 
          id: editingUser.id,
          user_id: editingUser.id, 
          full_name: editName.trim()
        });
      
      if (error) {
        console.error("Supabase error updating name:", error);
        throw error;
      }

      toast({ title: "Name updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      setEditName("");
    } catch (error: unknown) {
      console.error("Catch block error updating name:", error);
      const message = error instanceof Error ? error.message : 
                     (typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : "An unknown error occurred");
      
      // Check for RLS error specifically to provide better guidance
      if (message.includes("row-level security") || message.includes("policy")) {
        toast({ 
          title: "Permission Denied", 
          description: "Your admin account might not have the required database permissions. Please ensure your user ID is added to the 'user_roles' table with the 'admin' role.",
          variant: "destructive" 
        });
      } else {
        toast({ title: "Failed to update name", description: message, variant: "destructive" });
      }
    }
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
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-users"] })}
              title="Refresh users"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
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
                    Users can find their UID in their profile or you can find it in the Supabase Auth table.
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
                    <UILabel htmlFor="name">User Name (Optional)</UILabel>
                    <Input 
                      id="name" 
                      placeholder="e.g. John Doe" 
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
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
                  <TableHead>User Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Current Roles</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers?.map((user) => (
                    <TableRow key={user.id} className="group">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {user.full_name || "Unknown User"}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setEditingUser(user);
                              setEditName(user.full_name || "");
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono">
                        {user.email}
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
                        <div className="flex items-center justify-end gap-2">
                          <Select
                            key={user.id}
                            onValueChange={(value) => handleAssignRole(user.id, value as AppRole)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Assign Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="content_manager">Content Manager</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteProfile(user.id)}
                            title="Delete user profile"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Name</DialogTitle>
            <DialogDescription>
              Update the display name for this user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <UILabel htmlFor="edit-name">Display Name</UILabel>
              <Input 
                id="edit-name" 
                placeholder="Enter user's name" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateName}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action will permanently delete this user profile from the database. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteProfileMutation.isPending}>
              {deleteProfileMutation.isPending ? "Deleting..." : "Delete Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUsers;