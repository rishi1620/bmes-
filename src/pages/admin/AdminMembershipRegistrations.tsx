import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { Check, X, Trash2, Download } from "lucide-react";
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
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const AdminMembershipRegistrations = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
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
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const registration = registrations.find(r => r.id === id);
    if (!registration) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
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
          console.error("Failed to send email notification");
        } else {
          toast.info(`Notification email sent to ${registration.email}`);
        }
      } catch (emailError) {
        console.error("Email notification error:", emailError);
      }

      fetchRegistrations();
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error("Failed to update status: " + (error as any).message);
    }
  };

  const deleteRegistration = async (id: string) => {
    if (!confirm("Are you sure you want to delete this registration?")) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("membership_registrations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Registration deleted");
      fetchRegistrations();
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error("Failed to delete: " + (error as any).message);
    }
  };

  const exportCSV = () => {
    const headers = ["Full Name", "Email", "Student ID", "Department", "Year/Semester", "Phone", "Transaction ID", "Status", "Date"];
    const csvContent = [
      headers.join(","),
      ...registrations.map(r => [
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

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Membership Applications</h1>
          <p className="text-muted-foreground mt-1">Review and manage student membership requests.</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border bg-card shadow-sm overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Info</TableHead>
              <TableHead>Academic Info</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">Loading applications...</TableCell>
              </TableRow>
            ) : registrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No applications found.</TableCell>
              </TableRow>
            ) : (
              registrations.map((reg) => (
                <TableRow key={reg.id}>
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
                        onClick={() => deleteRegistration(reg.id)}
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
    </AdminLayout>
  );
};

export default AdminMembershipRegistrations;
