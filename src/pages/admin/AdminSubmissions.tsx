import { useEffect, useState } from "react";
import { Mail, MailOpen, Trash2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface Submission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const AdminSubmissions = () => {
  const [rows, setRows] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<Submission | null>(null);

  const fetchRows = async () => {
    const { data } = await supabase.from("contact_submissions").select("*").order("created_at", { ascending: false });
    setRows((data as Submission[]) ?? []);
  };

  useEffect(() => { fetchRows(); }, []);

  const markRead = async (sub: Submission) => {
    await supabase.from("contact_submissions").update({ is_read: true }).eq("id", sub.id);
    setSelected({ ...sub, is_read: true });
    fetchRows();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this submission?")) return;
    await supabase.from("contact_submissions").delete().eq("id", id);
    toast({ title: "Deleted" });
    setSelected(null);
    fetchRows();
  };

  const exportCsv = () => {
    const headers = ["Name", "Email", "Subject", "Message", "Date", "Read"];
    const csvRows = rows.map((r) => [
      `"${r.name}"`, `"${r.email}"`, `"${r.subject}"`, `"${r.message.replace(/"/g, '""')}"`,
      format(new Date(r.created_at), "yyyy-MM-dd HH:mm"), r.is_read ? "Yes" : "No",
    ].join(","));
    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contact-submissions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const unreadCount = rows.filter((r) => !r.is_read).length;

  return (
    <AdminLayout>
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Contact Submissions</h1>
          {unreadCount > 0 && <Badge variant="destructive">{unreadCount} new</Badge>}
        </div>
        <Button onClick={exportCsv} size="sm" variant="outline" disabled={rows.length === 0}>
          <Download className="mr-1.5 h-4 w-4" /> Export CSV
        </Button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-lg border bg-card"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No submissions yet</TableCell></TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id} className={!row.is_read ? "bg-primary/5" : ""}>
                <TableCell>{!row.is_read ? <Mail className="h-4 w-4 text-primary" /> : <MailOpen className="h-4 w-4 text-muted-foreground" />}</TableCell>
                <TableCell className="font-medium cursor-pointer hover:text-primary" onClick={() => { setSelected(row); if (!row.is_read) markRead(row); }}>{row.name}</TableCell>
                <TableCell className="text-sm">{row.email}</TableCell>
                <TableCell className="max-w-[200px] truncate text-sm">{row.subject}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{format(new Date(row.created_at), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => remove(row.id)} title="Delete" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Message from {selected?.name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 py-2">
              <div className="text-sm"><span className="font-medium text-foreground">Email:</span> <span className="text-muted-foreground">{selected.email}</span></div>
              <div className="text-sm"><span className="font-medium text-foreground">Subject:</span> <span className="text-muted-foreground">{selected.subject}</span></div>
              <div className="text-sm"><span className="font-medium text-foreground">Date:</span> <span className="text-muted-foreground">{format(new Date(selected.created_at), "PPpp")}</span></div>
              <div className="mt-4 rounded-md border border-border bg-muted/30 p-4 text-sm text-foreground whitespace-pre-wrap">{selected.message}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSubmissions;
