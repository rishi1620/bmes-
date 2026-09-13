import { useEffect, useState, useCallback } from "react";
import { Mail, MailOpen, Trash2, Download, Search, X, RefreshCw, FileCheck2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { motion } from "framer-motion";
import GoogleFormsSyncBar from "@/components/admin/GoogleFormsSyncBar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "web" | "gform">("all");
  const [loading, setLoading] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from("contact_submissions").select("*").order("created_at", { ascending: false });
      setRows((data as Submission[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchRows(); 
  }, [fetchRows]);

  // Listen for automatic Google Forms sync events so rows update in real-time
  useEffect(() => {
    const handleFormsRefreshed = () => {
      fetchRows();
    };
    window.addEventListener("bmes-forms-data-refreshed", handleFormsRefreshed);
    return () => {
      window.removeEventListener("bmes-forms-data-refreshed", handleFormsRefreshed);
    };
  }, [fetchRows]);

  const filteredRows = rows.filter((r) => {
    const isGForm = (r.subject && r.subject.includes("Google Form")) || (r.message && r.message.includes("Google Form"));
    if (sourceFilter === "web" && isGForm) return false;
    if (sourceFilter === "gform" && !isGForm) return false;

    return (
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const markRead = async (sub: Submission) => {
    await supabase.from("contact_submissions").update({ is_read: true }).eq("id", sub.id);
    setSelected({ ...sub, is_read: true });
    fetchRows();
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    await supabase.from("contact_submissions").delete().eq("id", deleteId);
    toast({ title: "Deleted" });
    if (selected?.id === deleteId) setSelected(null);
    setDeleteId(null);
    fetchRows();
  };

  const exportCsv = () => {
    const headers = ["Name", "Email", "Subject", "Message", "Date", "Read"];
    const csvRows = filteredRows.map((r) => [
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
        className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Contact & Feedback Submissions</h1>
          {unreadCount > 0 && <Badge variant="destructive">{unreadCount} new</Badge>}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search submissions..."
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
          <Button onClick={exportCsv} size="sm" variant="outline" disabled={rows.length === 0} className="shrink-0">
            <Download className="mr-1.5 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchRows} disabled={loading} className="shrink-0 gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </motion.div>

      {/* Automatic Google Forms Synchronization Service Bar */}
      <GoogleFormsSyncBar 
        contextTitle="Google Forms Member Feedback surveys automatically sync directly into this table."
        formType="feedback"
      />

      {/* Source Filtering Tabs */}
      <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
        <Tabs value={sourceFilter} onValueChange={(val) => setSourceFilter(val as "all" | "web" | "gform")}>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs px-3">
              All ({rows.length})
            </TabsTrigger>
            <TabsTrigger value="gform" className="text-xs px-3 gap-1.5">
              <FileCheck2 className="h-3 w-3 text-purple-600" />
              Google Forms ({rows.filter(r => (r.subject?.includes("Google Form") || r.message?.includes("Google Form"))).length})
            </TabsTrigger>
            <TabsTrigger value="web" className="text-xs px-3">
              Direct Web Form ({rows.filter(r => !(r.subject?.includes("Google Form") || r.message?.includes("Google Form"))).length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <span className="text-xs text-muted-foreground">
          Showing {filteredRows.length} {filteredRows.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-lg border bg-card overflow-hidden shadow-xs"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subject / Rating</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    No submissions found for the selected filter.
                  </TableCell>
                </TableRow>
              )}
              {filteredRows.map((row) => {
                const isGForm = (row.subject && row.subject.includes("Google Form")) || (row.message && row.message.includes("Google Form"));
                return (
                  <TableRow key={row.id} className={!row.is_read ? "bg-primary/5 font-medium" : ""}>
                    <TableCell>
                      {!row.is_read ? <Mail className="h-4 w-4 text-primary" /> : <MailOpen className="h-4 w-4 text-muted-foreground" />}
                    </TableCell>
                    <TableCell>
                      {isGForm ? (
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 text-[10px] gap-1 px-1.5 whitespace-nowrap">
                          <FileCheck2 className="h-3 w-3 text-purple-600" />
                          Google Form
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground px-1.5">
                          Web Form
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium cursor-pointer hover:text-primary" onClick={() => { setSelected(row); if (!row.is_read) markRead(row); }}>
                      {row.name}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-xs">{row.email}</TableCell>
                    <TableCell className="max-w-[240px] truncate text-sm">
                      {row.subject?.replace(/\[gform:[^\]]+\]/g, "").trim() || "No Subject"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(row.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => { setSelected(row); if (!row.is_read) markRead(row); }}
                          className="h-7 px-2 text-xs"
                        >
                          View
                        </Button>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }} title="Delete" className="h-7 w-7 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the submission.
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

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {selected?.subject?.includes("Google Form") && (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-200 text-xs gap-1">
                  <FileCheck2 className="h-3.5 w-3.5 text-purple-600" /> Google Form Auto-Synced
                </Badge>
              )}
              <DialogTitle className="text-lg">Feedback from {selected?.name}</DialogTitle>
            </div>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 py-2 text-sm">
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted/40 rounded-lg text-xs">
                <div><span className="font-semibold text-foreground">Email:</span> <span className="text-muted-foreground font-mono">{selected.email}</span></div>
                <div><span className="font-semibold text-foreground">Submitted:</span> <span className="text-muted-foreground">{format(new Date(selected.created_at), "PPpp")}</span></div>
                <div className="col-span-2"><span className="font-semibold text-foreground">Subject:</span> <span className="text-muted-foreground">{selected.subject}</span></div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed shadow-2xs">
                {selected.message}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSubmissions;
