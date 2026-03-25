import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Users, GraduationCap, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
          <Users className="h-6 w-6 text-emerald-500" />
          Member Directory
        </h3>
        <p className="text-muted-foreground">Our growing community of biomedical engineering enthusiasts.</p>
      </div>

      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, ID or department..."
          className="pl-10 bg-background/50 backdrop-blur-sm border-emerald-500/20 focus-visible:ring-emerald-500"
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
          filteredMembers.map((member) => (
            <Card key={member.id} className="group hover:border-emerald-500/50 transition-all duration-300 hover:shadow-md bg-card/50 backdrop-blur-sm">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold text-lg group-hover:text-emerald-600 transition-colors">{member.full_name}</h4>
                    <p className="text-xs font-mono text-muted-foreground">{member.student_id}</p>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] uppercase tracking-wider">
                    Member
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3 text-emerald-500" />
                    <span>{member.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <GraduationCap className="h-3 w-3 text-emerald-500" />
                    <span>{member.year_semester}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
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
