import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { Check, X, Trash2, Download, Search, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

interface Registration {
  id: string;
  full_name: string;
  email: string;
  student_id: string;
  department: string;
  year_semester: string;
  phone_number: string;
  transaction_id: string;
  status: string;
  created_at: string;
}

function AdminMembershipRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteBulk, setDeleteBulk] = useState(false);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("membership_registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error("Failed to fetch registrations: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const registration = registrations.find(r => r.id === id);
    if (!registration) return;

    try {
      const { error } = await supabase
        .from("membership_registrations")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      
      toast.success(`Registration ${status} successfully`);
      
      // Send email notification
      try {
        const response = await fetch("/api/send-membership-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: registration.email,
            name: registration.full_name,
            status: status
          }),
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.error("Failed to send email notification:", errData);
          toast.error(`Status updated, but email failed: ${errData.error || 'Check server logs'}`);
        } else {
          toast.info(`Notification email sent to ${registration.email}`);
        }
      } catch (emailError) {
        console.error("Email notification error:", emailError);
        toast.error("Status updated, but failed to send email notification.");
      }

      fetchRegistrations();
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error("Failed to update status: " + (error as any).message);
    }
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from("membership_registrations")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast.success("Registration deleted");
      fetchRegistrations();
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error("Failed to delete: " + (error as any).message);
    } finally {
      setDeleteId(null);
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesStatus = statusFilter === "all" || reg.status === statusFilter;
    const matchesSearch = 
      reg.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.student_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const exportCSV = () => {
    const headers = ["Full Name", "Email", "Student ID", "Department", "Year/Semester", "Phone", "Transaction ID", "Status", "Date"];
    const csvContent = [
      headers.join(","),
      ...filteredRegistrations.map(r => [
        `"${r.full_name}"`,
        `"${r.email}"`,
        `"${r.student_id}"`,
        `"${r.department}"`,
        `"${r.year_semester}"`,
        `"${r.phone_number || ""}"`,
        `"${r.transaction_id || ""}"`,
        `"${r.status}"`,
        `"${format(new Date(r.created_at), "yyyy-MM-dd HH:mm")}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `membership_registrations_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-emerald-500">Approved</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRegistrations.length && filteredRegistrations.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRegistrations.map(r => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const bulkUpdateStatus = async (status: 'approved' | 'rejected') => {
    if (selectedIds.length === 0) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("membership_registrations")
        .update({ status })
        .in("id", selectedIds);

      if (error) throw error;

      toast.success(`${selectedIds.length} registrations ${status} successfully`);

      // Send email notifications for each
      const selectedRegistrations = registrations.filter(r => selectedIds.includes(r.id));
      
      // We'll do this in parallel
      Promise.all(selectedRegistrations.map(async (reg) => {
        try {
          const emailResponse = await fetch("/api/send-membership-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: reg.email,
              name: reg.full_name,
              status: status
            }),
          });
          if (!emailResponse.ok) {
            console.error(`Failed to send email to ${reg.email}. Server responded with:`, emailResponse.status);
          }
        } catch (e) {
          console.error(`Failed to send email to ${reg.email}`, e);
        }
      }));

      setSelectedIds([]);
      fetchRegistrations();
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error("Failed to update status: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const executeBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("membership_registrations")
        .delete()
        .in("id", selectedIds);

      if (error) throw error;
      toast.success(`${selectedIds.length} registrations deleted`);
      setSelectedIds([]);
      fetchRegistrations();
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error("Failed to delete: " + (error as any).message);
    } finally {
      setLoading(false);
      setDeleteBulk(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Membership Applications</h1>
          <p className="text-muted-foreground mt-1">Review and manage student membership requests.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or ID..."
              className="pl-9 pr-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportCSV} variant="outline" className="gap-2 shrink-0">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={fetchRegistrations} disabled={loading} className="gap-2 shrink-0">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{selectedIds.length} items selected</span>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="h-8 text-xs">
              Clear selection
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1"
              onClick={() => bulkUpdateStatus('approved')}
              disabled={loading}
            >
              <Check className="h-3.5 w-3.5" /> Approve Selected
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 text-red-600 border-red-200 hover:bg-red-50 gap-1"
              onClick={() => bulkUpdateStatus('rejected')}
              disabled={loading}
            >
              <X className="h-3.5 w-3.5" /> Reject Selected
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 text-destructive border-destructive/20 hover:bg-destructive/10 gap-1"
              onClick={() => setDeleteBulk(true)}
              disabled={loading}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Selected
            </Button>
          </div>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border bg-card shadow-sm overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox 
                  checked={selectedIds.length === filteredRegistrations.length && filteredRegistrations.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Student Info</TableHead>
              <TableHead>Academic Info</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && registrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">Loading applications...</TableCell>
              </TableRow>
            ) : filteredRegistrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No applications found.</TableCell>
              </TableRow>
            ) : (
              filteredRegistrations.map((reg) => (
                <TableRow key={reg.id} className={selectedIds.includes(reg.id) ? "bg-primary/5" : ""}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.includes(reg.id)}
                      onCheckedChange={() => toggleSelect(reg.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{reg.full_name}</span>
                      <span className="text-xs text-muted-foreground">{reg.email}</span>
                      <span className="text-xs text-muted-foreground">{reg.phone_number}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{reg.student_id}</span>
                      <span className="text-xs text-muted-foreground">{reg.department} | {reg.year_semester}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                      {reg.transaction_id || "N/A"}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(reg.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(reg.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {reg.status === 'pending' && (
                        <>
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => updateStatus(reg.id, 'approved')}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => updateStatus(reg.id, 'rejected')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteId(reg.id)}
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
      </motion.div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the membership registration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteBulk} onOpenChange={setDeleteBulk}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} registrations?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all selected membership registrations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminMembershipRegistrations;
