import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Users, 
  GraduationCap, 
  Building2, 
  ShieldCheck, 
  IdCard, 
  CheckCircle2, 
  Copy, 
  Check, 
  LayoutList, 
  LayoutGrid 
} from "lucide-react";
import { extractBatchInfo, generateMembershipId } from "@/utils/membership";
import { toast } from "sonner";

interface Member {
  id: string;
  full_name: string;
  student_id: string;
  department: string;
  year_semester: string;
  status: string;
  created_at?: string;
}

export function MemberDirectory() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortOrder, setSortOrder] = useState<"id_asc" | "name_asc">("id_asc");

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from("membership_registrations")
          .select("id, full_name, student_id, department, year_semester, status, created_at")
          .eq("status", "approved")
          .order("student_id", { ascending: true });

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

  // Compute available batches for quick filters
  const batches = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      const b = extractBatchInfo(m.student_id, m.year_semester, m.created_at);
      if (b?.batchTag) set.add(b.batchTag);
    });
    return Array.from(set).sort();
  }, [members]);

  const filteredMembers = useMemo(() => {
    const list = members.filter((m) => {
      const batch = extractBatchInfo(m.student_id, m.year_semester, m.created_at);
      const memId = generateMembershipId(m.student_id, m.id, m.year_semester, m.created_at);
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q ||
        m.full_name.toLowerCase().includes(q) ||
        m.student_id.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q) ||
        (m.year_semester && m.year_semester.toLowerCase().includes(q)) ||
        memId.toLowerCase().includes(q) ||
        batch.batchTag.toLowerCase().includes(q);

      const matchesBatch = selectedBatch === "all" || batch.batchTag === selectedBatch;

      return matchesSearch && matchesBatch;
    });

    return list.sort((a, b) => {
      if (sortOrder === "name_asc") {
        return a.full_name.localeCompare(b.full_name);
      }
      return (a.student_id || "").localeCompare(b.student_id || "");
    });
  }, [members, searchQuery, selectedBatch, sortOrder]);

  const handleCopyId = (idText: string) => {
    navigator.clipboard.writeText(idText);
    setCopiedId(idText);
    toast.success(`Copied: ${idText}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "MB";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (loading) return null;
  if (members.length === 0) return null;

  return (
    <div className="mt-14 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-400 tracking-wide uppercase">
            <span className="h-2 w-2 rounded-full bg-teal-600"></span>
            CUET BMES Verified Register
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-1 font-sans">
            Official Member Directory
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Academic records and official credential registry of enrolled society members.
          </p>
        </div>

        {/* Total stats badge */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300">
            Enrolled Members: <span className="font-bold text-slate-900 dark:text-white font-mono">{members.length}</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Search + Batch Filter + View Mode Switch */}
      <div className="space-y-3.5 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by student name, ID, member code, or department..."
              className="pl-10 pr-16 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg focus-visible:ring-1 focus-visible:ring-teal-600 text-xs sm:text-sm text-slate-900 dark:text-slate-100 shadow-2xs w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort Selector & View Toggle */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setSortOrder("id_asc")}
                className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                  sortOrder === "id_asc"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                Student ID
              </button>
              <button
                onClick={() => setSortOrder("name_asc")}
                className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                  sortOrder === "name_asc"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                Name
              </button>
            </div>

            {/* Layout Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded text-xs transition-all flex items-center gap-1 ${
                  viewMode === "list"
                    ? "bg-teal-700 text-white shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
                title="Table List View"
              >
                <LayoutList className="h-4 w-4" />
                <span className="text-xs hidden md:inline">List</span>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded text-xs transition-all flex items-center gap-1 ${
                  viewMode === "grid"
                    ? "bg-teal-700 text-white shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="text-xs hidden md:inline">Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Batch Filter Chips */}
        {batches.length > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">Filter Batch:</span>
            <button
              onClick={() => setSelectedBatch("all")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                selectedBatch === "all"
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs font-semibold"
                  : "bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              All Batches ({members.length})
            </button>
            {batches.map((batch) => {
              const count = members.filter(
                (m) => extractBatchInfo(m.student_id, m.year_semester, m.created_at).batchTag === batch
              ).length;
              return (
                <button
                  key={batch}
                  onClick={() => setSelectedBatch(batch)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    selectedBatch === batch
                      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs font-semibold"
                      : "bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {batch} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-14 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 space-y-2">
            <Users className="h-8 w-8 mx-auto text-slate-400 opacity-60" />
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">No members found matching your search.</p>
            <p className="text-xs">Try adjusting your keywords or clearing the batch filter.</p>
          </div>
        ) : viewMode === "list" ? (
          /* ACADEMIC TABLE LIST VIEW */
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            {/* Table Header (Desktop) */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <div className="col-span-4">Student Name & ID</div>
              <div className="col-span-3">Official Member ID</div>
              <div className="col-span-3">Department & Semester</div>
              <div className="col-span-2 text-right">Status</div>
            </div>

            {/* List Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredMembers.map((member) => {
                const batch = extractBatchInfo(member.student_id, member.year_semester, member.created_at);
                const memId = generateMembershipId(member.student_id, member.id, member.year_semester, member.created_at);
                const initials = getInitials(member.full_name);
                const isCopied = copiedId === memId;

                return (
                  <div
                    key={member.id}
                    className="p-4 lg:px-5 lg:py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Desktop Row Layout */}
                    <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                      {/* Col 1: Avatar + Full Name + Student ID + Batch */}
                      <div className="col-span-4 flex items-center gap-3 min-w-0">
                        <div
                          className="h-9 w-9 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs font-mono"
                        >
                          {initials}
                        </div>
                        <div className="min-w-0 pr-2">
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors leading-snug">
                            {member.full_name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                              ID: {member.student_id}
                            </span>
                            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {batch.batchTag}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Col 2: Official Member ID with Copy Button */}
                      <div className="col-span-3">
                        <button
                          onClick={() => handleCopyId(memId)}
                          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors text-left group/btn"
                          title="Click to copy Member ID"
                        >
                          <IdCard className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {memId}
                          </span>
                          {isCopied ? (
                            <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                          ) : (
                            <Copy className="h-3 w-3 text-slate-400 group-hover/btn:text-slate-600 dark:group-hover/btn:text-slate-200 transition-colors shrink-0" />
                          )}
                        </button>
                      </div>

                      {/* Col 3: Department & Semester */}
                      <div className="col-span-3 space-y-0.5 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium truncate">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{member.department || "Biomedical Engineering"}</span>
                        </div>
                        {member.year_semester && (
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                            <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{member.year_semester}</span>
                          </div>
                        )}
                      </div>

                      {/* Col 4: Verified Status */}
                      <div className="col-span-2 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/50 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                          Verified
                        </span>
                      </div>
                    </div>

                    {/* Mobile & Tablet Card Row Layout */}
                    <div className="lg:hidden space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="h-9 w-9 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs font-mono"
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-snug">
                              {member.full_name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-mono text-slate-500">
                                {member.student_id}
                              </span>
                              <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {batch.batchTag}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/50 px-2 py-0.5 rounded-full shrink-0">
                          <CheckCircle2 className="h-3 w-3 text-teal-600" />
                          Verified
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <IdCard className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                          <span className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200 truncate">
                            {memId}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopyId(memId)}
                          className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 hover:bg-slate-50 shrink-0"
                        >
                          {isCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          <span>{isCopied ? "Copied" : "Copy"}</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{member.department || "BME"}</span>
                        </div>
                        {member.year_semester && (
                          <div className="flex items-center gap-1">
                            <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{member.year_semester}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* RESPONSIVE GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredMembers.map((member) => {
              const batch = extractBatchInfo(member.student_id, member.year_semester, member.created_at);
              const memId = generateMembershipId(member.student_id, member.id, member.year_semester, member.created_at);
              const initials = getInitials(member.full_name);
              const isCopied = copiedId === memId;

              return (
                <div
                  key={member.id}
                  className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 hover:border-teal-600/50 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="h-9 w-9 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs font-mono"
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 block">
                            {member.student_id}
                          </span>
                          <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 mt-0.5">
                            {batch.batchTag}
                          </span>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/50 px-2 py-0.5 rounded-full shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-teal-600" />
                        Verified
                      </span>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-snug break-words group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                        {member.full_name}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between gap-2 p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <IdCard className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        <span className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200 truncate">
                          {memId}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyId(memId)}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
                        title="Copy ID"
                      >
                        {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{member.department || "BME"}</span>
                    </div>
                    {member.year_semester && (
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{member.year_semester}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Meta */}
      <div className="text-center pt-2 pb-4 max-w-5xl mx-auto flex items-center justify-between text-xs text-slate-500 px-1 border-t border-slate-100 dark:border-slate-800">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-teal-600" />
          Official Verified Registry
        </span>
        <p className="font-medium">
          Showing <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{filteredMembers.length}</span> of{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{members.length}</span> Members
        </p>
      </div>
    </div>
  );
}
