import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Trash2, CheckCircle2, XCircle, Clock, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Registration {
  id: string;
  full_name: string;
  email: string;
  student_id: string;
  department: string;
  year_semester: string;
  phone_number: string;
  transaction_id: string | null;
  status: string;
  created_at: string;
}

export function MembershipManagement() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const fetchRegistrations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("membership_registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      toast.error("Failed to load registrations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter(reg => {
      const matchesSearch = 
        reg.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTab = activeTab === "all" || reg.status === activeTab;
      
      return matchesSearch && matchesTab;
    });
  }, [registrations, searchQuery, activeTab]);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from("membership_registrations")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      
      setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      toast.success(`Registration ${newStatus} successfully.`);
      
      // If we approved someone, maybe they should move to the approved tab
      if (newStatus === 'approved' && activeTab === 'pending') {
        // Stay on pending or move? Usually stay to see the change, but user might expect them to disappear
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteRegistration = async (id: string) => {
    if (!confirm("Are you sure you want to delete this registration? This action cannot be undone.")) return;
    
    try {
      const { error } = await supabase
        .from("membership_registrations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setRegistrations(prev => prev.filter(r => r.id !== id));
      toast.success("Registration deleted.");
    } catch (error) {
      console.error("Error deleting registration:", error);
      toast.error("Failed to delete registration.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
  };

  const stats = useMemo(() => {
    return {
      pending: registrations.filter(r => r.status === 'pending').length,
      approved: registrations.filter(r => r.status === 'approved').length,
      total: registrations.length
    };
  }, [registrations]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Member Management
          </h3>
          <p className="text-xs text-muted-foreground">Manage society memberships and applications.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRegistrations} className="h-8">
          <Loader2 className={`h-3 w-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-amber-700">{stats.pending}</div>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-600">Pending</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-emerald-700">{stats.approved}</div>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600">Approved</div>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-slate-700">{stats.total}</div>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-600">Total</div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <TabsList className="grid grid-cols-3 w-full sm:w-[400px]">
            <TabsTrigger value="pending" className="text-xs gap-2">
              <Clock className="h-3 w-3" /> Pending
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs gap-2">
              <CheckCircle2 className="h-3 w-3" /> Approved
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs gap-2">
              <Users className="h-3 w-3" /> All
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              className="pl-9 h-9 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-xs font-bold">MEMBER DETAILS</TableHead>
                <TableHead className="text-xs font-bold">ACADEMIC INFO</TableHead>
                <TableHead className="text-xs font-bold">PAYMENT</TableHead>
                <TableHead className="text-xs font-bold">STATUS</TableHead>
                <TableHead className="text-right text-xs font-bold">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 opacity-20" />
                      <p>{searchQuery ? "No matching members found." : `No ${activeTab} members found.`}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRegistrations.map((reg) => (
                  <TableRow key={reg.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{reg.full_name}</span>
                        <span className="text-[11px] text-muted-foreground">{reg.email}</span>
                        <span className="text-[11px] text-muted-foreground">{reg.phone_number}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{reg.student_id}</span>
                        <span className="text-[11px] text-muted-foreground">{reg.department} • {reg.year_semester}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded inline-block max-w-[100px] truncate" title={reg.transaction_id || "N/A"}>
                        {reg.transaction_id || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(reg.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Select 
                          value={reg.status} 
                          onValueChange={(v) => updateStatus(reg.id, v)}
                          disabled={updatingId === reg.id}
                        >
                          <SelectTrigger className="h-8 w-[100px] text-[10px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approve</SelectItem>
                            <SelectItem value="rejected">Reject</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteRegistration(reg.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Tabs>
    </div>
  );
}
