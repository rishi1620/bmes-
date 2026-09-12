import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { VirtualIdCard, MemberCardData } from "./VirtualIdCard";
import { MemberProfilePrintView } from "./MemberProfilePrintView";
import { extractBatchInfo, generateMembershipId } from "@/utils/membership";
import {
  Printer,
  CreditCard,
  FileText,
  Copy,
  ExternalLink,
  Check,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface MemberIdCardModalProps {
  member: MemberCardData | null;
  isOpen: boolean;
  onClose: () => void;
  logoUrl?: string;
}

export const MemberIdCardModal: React.FC<MemberIdCardModalProps> = ({
  member,
  isOpen,
  onClose,
  logoUrl,
}) => {
  const [activeTab, setActiveTab] = useState<"card" | "profile">("card");
  const [cardSide, setCardSide] = useState<"front" | "back" | "both">("both");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [showPhotoInput, setShowPhotoInput] = useState(false);

  if (!member) return null;

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
    // Add print trigger class to body
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 bg-background">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  Official Member Credentials & ID
                </DialogTitle>
                <Badge className="bg-amber-400 text-emerald-950 font-black border border-amber-300">
                  {batchInfo.batchTag}
                </Badge>
                <Badge variant="outline" className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50">
                  {membershipId}
                </Badge>
              </div>
              <DialogDescription className="mt-1 text-xs sm:text-sm">
                Printer-friendly virtual ID card and official society verification dossier for {member.full_name}.
              </DialogDescription>
            </div>

            {/* Print & Action Controls */}
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={copyMembershipId}
                className="gap-1.5 h-8 text-xs font-medium"
              >
                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                Copy ID
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/admin/membership/id-card/${member.id}`, "_blank")}
                className="gap-1.5 h-8 text-xs font-medium"
                title="Open in dedicated printable page"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Dedicated Page
              </Button>
              <Button
                size="sm"
                className="gap-1.5 h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                onClick={() => handlePrint(activeTab)}
              >
                <Printer className="h-3.5 w-3.5" />
                Print {activeTab === "card" ? "Virtual ID Card" : "Profile Dossier"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Controls */}
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "card" | "profile")} className="w-full mt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-2">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="card" className="gap-2 text-xs">
                <CreditCard className="h-4 w-4" />
                Virtual ID Card
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-2 text-xs">
                <FileText className="h-4 w-4" />
                Printable Profile Dossier
              </TabsTrigger>
            </TabsList>

            {/* Customization & Sub-controls */}
            {activeTab === "card" && (
              <div className="flex items-center gap-2">
                <div className="flex rounded-md border border-border bg-muted/40 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setCardSide("both")}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                      cardSide === "both" ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Both Sides
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardSide("front")}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                      cardSide === "front" ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Front
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardSide("back")}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                      cardSide === "back" ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Back
                  </button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPhotoInput(!showPhotoInput)}
                  className="h-8 text-xs gap-1.5"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  {showPhotoInput ? "Hide Photo URL" : "Custom Photo"}
                </Button>
              </div>
            )}
          </div>

          {/* Optional Photo URL Input */}
          {showPhotoInput && activeTab === "card" && (
            <div className="p-3 bg-muted/30 rounded-lg border border-border mt-3 flex items-center gap-2">
              <Input
                placeholder="Paste direct URL to member passport portrait (e.g. https://...)"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="h-8 text-xs bg-background"
              />
              {photoUrl && (
                <Button size="sm" variant="ghost" onClick={() => setPhotoUrl("")} className="h-8 text-xs">
                  Clear
                </Button>
              )}
            </div>
          )}

          {/* TAB 1: Virtual ID Card View */}
          <TabsContent value="card" className="mt-6 space-y-6">
            <div className="bg-slate-900/5 dark:bg-slate-900/40 rounded-2xl p-6 sm:p-8 border border-border/60 flex flex-col items-center justify-center">
              <div id="printable-id-card-area" className="flex flex-col xl:flex-row items-center justify-center gap-8 print:gap-8">
                {cardSide === "both" ? (
                  <>
                    <VirtualIdCard member={currentMember} logoUrl={logoUrl} showBack={false} />
                    <VirtualIdCard member={currentMember} logoUrl={logoUrl} showBack={true} />
                  </>
                ) : cardSide === "front" ? (
                  <VirtualIdCard member={currentMember} logoUrl={logoUrl} showBack={false} />
                ) : (
                  <VirtualIdCard member={currentMember} logoUrl={logoUrl} showBack={true} />
                )}
              </div>

              {/* Physical Print Dimensions Guide */}
              <div className="mt-8 text-center text-xs text-muted-foreground max-w-md">
                <p className="font-semibold text-foreground">Standard CR80 Physical Card Specification</p>
                <p className="mt-0.5 text-[11px]">
                  Approx 85.60 mm × 53.98 mm (3.370 in × 2.125 in). Suitable for PVC ID badge printers, laser cutting, or photo card laminates.
                </p>
              </div>
            </div>

            {/* Quick Action Footer in Card Tab */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-muted/20 border border-border rounded-xl">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Batch Tag: </span>
                <span className="font-bold text-emerald-600">{batchInfo.batchTag}</span> • 
                <span className="font-medium text-foreground ml-2">Membership ID: </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{membershipId}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrint("card")}
                  className="gap-1.5 h-8 text-xs"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print ID Card
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: Full Printable Profile Dossier */}
          <TabsContent value="profile" className="mt-6 space-y-6">
            <div id="printable-profile-dossier-area">
              <MemberProfilePrintView member={currentMember} logoUrl={logoUrl} />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePrint("profile")}
                className="gap-1.5 font-bold bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Printer className="h-4 w-4" />
                Print Member Dossier (A4)
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
