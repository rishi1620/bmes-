import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Users, GraduationCap, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { extractBatchInfo, generateMembershipId } from "@/utils/membership";

interface Member {
  id: string;
  full_name: string;
  student_id: string;
  department: string;
  year_semester: string;
  status: string;
}

export function MemberDirectory() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from("membership_registrations")
          .select("id, full_name, student_id, department, year_semester, status")
          .eq("status", "approved")
          .order("full_name", { ascending: true });

        if (error) throw error;
        setMembers(data || []);
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    return members.filter(m => 
      m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [members, searchQuery]);

  if (loading) return null;
  if (members.length === 0) return null;

  return (
    <div className="mt-16 space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Member Directory
        </h3>
        <p className="text-muted-foreground">Our growing community of biomedical engineering enthusiasts.</p>
      </div>

      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, ID or department..."
          className="pl-10 bg-background/50 backdrop-blur-sm border-primary/20 focus-visible:ring-primary"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            No members found matching your search.
          </div>
        ) : (
          filteredMembers.map((member) => {
            const batch = extractBatchInfo(member.student_id, member.year_semester);
            const memId = generateMembershipId(member.student_id, member.id, member.year_semester);

            return (
              <Card key={member.id} className="group hover:border-primary/50 transition-all duration-300 hover:shadow-md bg-card/50 backdrop-blur-sm">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-bold text-lg group-hover:text-primary transition-colors truncate">{member.full_name}</h4>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-mono font-medium text-muted-foreground">{member.student_id}</span>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
                          {memId}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge className="bg-amber-400 text-slate-950 hover:bg-amber-400 font-black text-[10px] uppercase tracking-wider border border-amber-300 shadow-2xs">
                        {batch.batchTag}
                      </Badge>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[9.5px] uppercase tracking-wider">
                        Official Member
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">{member.department}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <GraduationCap className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">{member.year_semester}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      
      <div className="text-center pt-4">
        <p className="text-[11px] text-muted-foreground italic">
          Total Approved Members: {members.length}
        </p>
      </div>
    </div>
  );
}
