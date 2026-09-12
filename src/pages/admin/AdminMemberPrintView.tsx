import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MemberCardData, VirtualIdCard } from "@/components/admin/VirtualIdCard";
import { MemberProfilePrintView } from "@/components/admin/MemberProfilePrintView";
import { extractBatchInfo, generateMembershipId } from "@/utils/membership";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Printer,
  ArrowLeft,
  CreditCard,
  FileText,
  Copy,
  Check,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import defaultLogo from "@/assets/logo.png";

export default function AdminMemberPrintView() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [member, setMember] = useState<MemberCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"card" | "profile">("card");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [showPhotoInput, setShowPhotoInput] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        // 1. Fetch registration
        const { data, error } = await supabase
          .from("membership_registrations")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setMember(data);

        // 2. Fetch logo
        const { data: logoSetting } = await supabase
          .from("site_settings")
          .select("setting_value")
          .eq("setting_key", "logo_url")
          .single();
        if (logoSetting?.setting_value) {
          setLogoUrl(logoSetting.setting_value);
        }

        // Auto print if requested in query
        if (searchParams.get("autoprint") === "true") {
          setTimeout(() => {
            window.print();
          }, 600);
        }
      } catch (err: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        toast.error("Failed to load member details: " + (err as any).message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground font-medium">Loading member profile...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="text-center max-w-md space-y-4">
          <h2 className="text-xl font-bold text-foreground">Member Not Found</h2>
          <p className="text-sm text-muted-foreground">The requested member registration record could not be found.</p>
          <Button asChild>
            <Link to="/admin/membership">Back to Membership Registrations</Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentMember: MemberCardData = {
    ...member,
    photo_url: photoUrl || member.photo_url || null,
  };

  const batchInfo = extractBatchInfo(currentMember.student_id, currentMember.year_semester, currentMember.created_at);
  const membershipId = generateMembershipId(currentMember.student_id, currentMember.id, currentMember.year_semester, currentMember.created_at);

  const copyMembershipId = () => {
    navigator.clipboard.writeText(membershipId);
    setIsCopied(true);
    toast.success(`Copied Membership ID: ${membershipId}`);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePrint = (mode: "card" | "profile") => {
    const bodyClass = mode === "card" ? "printing-id-cards" : "printing-member-profile";
    document.body.classList.add(bodyClass);

    const onAfterPrint = () => {
      document.body.classList.remove("printing-id-cards", "printing-member-profile");
      window.removeEventListener("afterprint", onAfterPrint);
    };

    window.addEventListener("afterprint", onAfterPrint);

    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Non-printing Toolbar */}
      <header className="no-print sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/membership")}
              className="gap-1 text-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Registrations</span>
            </Button>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">{currentMember.full_name}</span>
              <Badge className="bg-amber-400 text-emerald-950 font-black border border-amber-300 text-[10px]">
                {batchInfo.batchTag}
              </Badge>
              <Badge variant="outline" className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50">
                {membershipId}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end w-full md:w-auto">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("card")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  viewMode === "card"
                    ? "bg-white dark:bg-slate-900 shadow-xs text-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                Virtual ID Card
              </button>
              <button
                type="button"
                onClick={() => setViewMode("profile")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  viewMode === "profile"
                    ? "bg-white dark:bg-slate-900 shadow-xs text-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Full Profile Dossier
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={copyMembershipId}
              className="gap-1 h-8 text-xs"
            >
              {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Copy ID</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPhotoInput(!showPhotoInput)}
              className="gap-1 h-8 text-xs"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Photo</span>
            </Button>

            <Button
              size="sm"
              onClick={() => handlePrint(viewMode)}
              className="gap-1.5 h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              Print {viewMode === "card" ? "Virtual ID Card" : "Profile Dossier"}
            </Button>
          </div>
        </div>

        {/* Optional Custom Photo Bar */}
        {showPhotoInput && (
          <div className="max-w-7xl mx-auto mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <Input
              placeholder="Paste image URL for member passport photo (e.g. https://...)"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="h-8 text-xs bg-white dark:bg-slate-900"
            />
            {photoUrl && (
              <Button size="sm" variant="ghost" onClick={() => setPhotoUrl("")} className="h-8 text-xs">
                Clear
              </Button>
            )}
          </div>
        )}
      </header>

      {/* Main Printable Content Container */}
      <main className="max-w-7xl mx-auto p-4 sm:p-8">
        {viewMode === "card" ? (
          <div className="space-y-8">
            <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center max-w-xl mx-auto shadow-xs">
              <h2 className="text-lg font-bold text-foreground">CUET BMES Virtual ID Card</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Both Front and Back cards are scaled to standard ISO CR80 ID dimensions. Click &quot;Print Virtual ID Card&quot; to print directly onto card stock or paper.
              </p>
            </div>

            {/* Render Both Sides for Printing and Preview */}
            <div id="printable-id-card-area" className="flex flex-col lg:flex-row items-center justify-center gap-8 print:gap-8">
              <div className="flex flex-col items-center gap-2">
                <span className="no-print text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Front Side
                </span>
                <VirtualIdCard member={currentMember} logoUrl={logoUrl || defaultLogo} showBack={false} />
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="no-print text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Back Side
                </span>
                <VirtualIdCard member={currentMember} logoUrl={logoUrl || defaultLogo} showBack={true} />
              </div>
            </div>
          </div>
        ) : (
          <div id="printable-profile-dossier-area">
            <MemberProfilePrintView member={currentMember} logoUrl={logoUrl || defaultLogo} />
          </div>
        )}
      </main>
    </div>
  );
}
