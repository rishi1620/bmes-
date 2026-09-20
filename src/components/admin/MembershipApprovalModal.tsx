import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldCheck,
  Mail,
  Copy,
  Check,
  Sparkles,
  Eye,
  Loader2,
  AlertCircle,
  GraduationCap,
  Edit2,
  RefreshCw,
} from "lucide-react";
import { extractBatchInfo, generateMembershipId } from "@/utils/membership";
import { toast } from "sonner";

export interface ApplicantRegistration {
  id: string;
  full_name: string;
  email: string;
  student_id: string;
  department: string;
  year_semester: string;
  phone_number?: string;
  transaction_id?: string;
  status: string;
  created_at: string;
}

interface MembershipApprovalModalProps {
  registration: ApplicantRegistration | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmApprove: (data: {
    registrationId: string;
    membershipId: string;
    customNote: string;
    sendEmail: boolean;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export const MembershipApprovalModal: React.FC<MembershipApprovalModalProps> = ({
  registration,
  isOpen,
  onClose,
  onConfirmApprove,
  isSubmitting = false,
}) => {
  const [membershipId, setMembershipId] = useState<string>("");
  const [isCustomId, setIsCustomId] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [customNote, setCustomNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "emailPreview">("details");

  // Re-generate ID whenever registration changes
  useEffect(() => {
    if (registration) {
      const generated = generateMembershipId(
        registration.student_id,
        registration.id,
        registration.year_semester,
        registration.created_at
      );
      setMembershipId(generated);
      setIsCustomId(false);
      setCustomNote("");
      setSendEmail(true);
      setActiveTab("details");
    }
  }, [registration]);

  if (!registration) return null;

  const batchInfo = extractBatchInfo(
    registration.student_id,
    registration.year_semester,
    registration.created_at
  );

  const handleCopyId = () => {
    navigator.clipboard.writeText(membershipId);
    setCopied(true);
    toast.success(`Copied Membership ID: ${membershipId}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetId = () => {
    const defaultId = generateMembershipId(
      registration.student_id,
      registration.id,
      registration.year_semester,
      registration.created_at
    );
    setMembershipId(defaultId);
    setIsCustomId(false);
    toast.info("Reset to standard auto-generated Membership ID");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membershipId.trim()) {
      toast.error("Membership ID cannot be empty");
      return;
    }

    await onConfirmApprove({
      registrationId: registration.id,
      membershipId: membershipId.trim(),
      customNote: customNote.trim(),
      sendEmail,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden sm:rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-primary via-primary/95 to-sky-700 px-6 py-5 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Membership Approval & Credential Issuance
              </DialogTitle>
              <DialogDescription className="text-sky-100 text-xs mt-0.5">
                Formally approve applicant, assign unique Membership ID, and trigger induction notification
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="px-6 pt-3 pb-0 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex-shrink-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "details" | "emailPreview")} className="w-full">
            <TabsList className="grid grid-cols-2 h-9 w-full max-w-sm bg-slate-200/70 dark:bg-slate-800">
              <TabsTrigger value="details" className="text-xs font-semibold gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Induction Details & ID
              </TabsTrigger>
              <TabsTrigger value="emailPreview" className="text-xs font-semibold gap-1.5">
                <Eye className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                Live Email Template Preview
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {activeTab === "details" ? (
            <form id="approval-form" onSubmit={handleSubmit} className="space-y-5">
              {/* Applicant Summary Card */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-foreground">{registration.full_name}</span>
                    <Badge variant="secondary" className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/40">
                      {batchInfo.batchTag}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">ID: {registration.student_id}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Email Address</span>
                    <span className="font-medium text-foreground truncate block">{registration.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Department</span>
                    <span className="font-medium text-foreground">{registration.department}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Level / Semester</span>
                    <span className="font-medium text-foreground">{registration.year_semester}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Phone Number</span>
                    <span className="font-medium text-foreground">{registration.phone_number || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Payment TrxID</span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded text-[11px]">
                      {registration.transaction_id || "Unspecified"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Current Status</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 capitalize">
                      ● {registration.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Unique Membership ID Box */}
              <div className="rounded-xl border-2 border-sky-500/30 dark:border-sky-500/40 bg-gradient-to-br from-sky-50/70 via-white to-blue-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4" />
                      Dynamically Generated Membership ID
                    </span>
                    <span className="text-[10px] bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300 font-bold px-2 py-0.5 rounded-full">
                      Official Unique Key
                    </span>
                  </div>
                  {!isCustomId ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[11px] text-muted-foreground hover:text-primary gap-1 px-2"
                      onClick={() => setIsCustomId(true)}
                    >
                      <Edit2 className="h-3 w-3" />
                      Customize ID
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[11px] text-muted-foreground hover:text-primary gap-1 px-2"
                      onClick={handleResetId}
                    >
                      <RefreshCw className="h-3 w-3" />
                      Reset to Default
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      value={membershipId}
                      onChange={(e) => {
                        setMembershipId(e.target.value.toUpperCase());
                        setIsCustomId(true);
                      }}
                      className="font-mono text-base sm:text-lg font-black tracking-wider text-primary dark:text-sky-400 bg-white dark:bg-slate-950 border-sky-300 dark:border-sky-800 h-11 px-3.5 shadow-2xs"
                      placeholder="e.g. BMES-B20-2008015"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-11 px-3.5 gap-1.5 border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-300"
                    onClick={handleCopyId}
                    title="Copy Membership ID"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    <span className="hidden sm:inline text-xs font-semibold">{copied ? "Copied" : "Copy"}</span>
                  </Button>
                </div>

                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                  <AlertCircle className="h-3.5 w-3.5 text-sky-600 flex-shrink-0" />
                  <span>
                    Format standard: <code className="bg-sky-100/70 dark:bg-sky-950 px-1 py-0.5 rounded font-mono text-[10px] text-sky-800 dark:text-sky-300">BMES-B{batchInfo.batchNum}-{registration.student_id}</code>. Included in email and member card.
                  </span>
                </div>
              </div>

              {/* Email Notification Options */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 space-y-3.5">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="send-email-checkbox"
                    checked={sendEmail}
                    onCheckedChange={(c) => setSendEmail(!!c)}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor="send-email-checkbox" className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      Trigger Formal Induction Email Template
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Dispatches the branded congratulatory email with official seal, Member ID credential card, privileges list, and Student Portal deep link to <strong className="text-foreground">{registration.email}</strong>.
                    </p>
                  </div>
                </div>

                {sendEmail && (
                  <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="custom-admin-note" className="text-xs font-semibold text-foreground">
                        Custom Administrator Remarks / Instructions <span className="text-muted-foreground font-normal">(Optional)</span>
                      </Label>
                      <button
                        type="button"
                        onClick={() => setActiveTab("emailPreview")}
                        className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
                      >
                        Preview Email &rarr;
                      </button>
                    </div>
                    <Textarea
                      id="custom-admin-note"
                      rows={2}
                      placeholder="e.g. Please collect your physical membership badge and sticker pack from Room 302 during lab hours on Mondays."
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                      className="text-xs resize-none"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      This note will be highlighted in a special green alert box inside the official approval email.
                    </p>
                  </div>
                )}
              </div>
            </form>
          ) : (
            /* Live Email Template Preview */
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 px-3.5 py-2 rounded-lg text-xs">
                <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-medium">
                  <Mail className="h-4 w-4 text-sky-600" />
                  <span>Subject: <strong>[CUET BMES] Membership Application Approved • Member ID: {membershipId}</strong></span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-900 border-sky-300 text-sky-700">
                  Recipient: {registration.email}
                </Badge>
              </div>

              {/* Rendered Visual Email Simulation */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white shadow-sm font-sans text-slate-800">
                {/* Email Header */}
                <div className="bg-[#00568a] p-5 text-center border-b-4 border-amber-500">
                  <p className="text-[10px] font-bold tracking-widest text-sky-200 uppercase m-0">
                    Chittagong University of Engineering & Technology
                  </p>
                  <h3 className="text-base font-extrabold text-white mt-1 mb-0 tracking-tight">
                    BIOMEDICAL ENGINEERING SOCIETY (BMES)
                  </h3>
                  <p className="text-[11px] text-amber-200 font-semibold mt-1 mb-0">
                    Official Membership Induction & Credential Issuance
                  </p>
                </div>

                {/* Email Body */}
                <div className="p-5 space-y-4 text-xs">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-full text-[10px] uppercase">
                      ✓ Application Approved & Inducted
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 mt-2 mb-1">
                      Congratulations & Welcome, {registration.full_name}!
                    </h4>
                    <p className="text-slate-600 leading-relaxed text-xs m-0">
                      We are pleased to inform you that your membership application for the <strong>CUET Biomedical Engineering Society</strong> has been formally approved by the Executive Committee.
                    </p>
                  </div>

                  {/* Membership ID Highlight Box */}
                  <div className="p-4 bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-sky-600 rounded-xl text-center space-y-3">
                    <span className="block text-[10px] font-bold tracking-wider text-sky-800 uppercase">
                      Official Society Membership ID
                    </span>
                    <div className="font-mono text-xl font-extrabold tracking-widest text-[#00568a] bg-white py-2 px-4 rounded-lg border border-dashed border-sky-400 inline-block shadow-2xs">
                      {membershipId}
                    </div>

                    <table className="w-full text-left text-xs bg-white rounded-lg border border-sky-200 overflow-hidden">
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <td className="p-2 font-medium text-slate-500 w-1/3">Full Name:</td>
                          <td className="p-2 font-bold text-slate-900">{registration.full_name}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="p-2 font-medium text-slate-500">Student ID:</td>
                          <td className="p-2 font-bold text-slate-900">{registration.student_id}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="p-2 font-medium text-slate-500">Department:</td>
                          <td className="p-2 font-bold text-slate-900">{registration.department}</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-medium text-slate-500">Academic Level:</td>
                          <td className="p-2 font-bold text-slate-900">{registration.year_semester}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Custom Admin Remarks if provided */}
                  {customNote && (
                    <div className="p-3 bg-emerald-50 border-l-4 border-emerald-600 rounded-r-lg text-emerald-900 text-xs">
                      <span className="block font-bold text-[10px] uppercase text-emerald-700 mb-0.5">
                        Direct Note from Administration:
                      </span>
                      <p className="m-0 whitespace-pre-wrap">{customNote}</p>
                    </div>
                  )}

                  {/* Portal Access Button */}
                  <div className="text-center pt-2">
                    <span className="inline-block bg-[#00568a] text-white px-5 py-2.5 rounded-lg font-bold text-xs shadow-sm">
                      Access Student Portal & Member Card &rarr;
                    </span>
                  </div>
                </div>

                {/* Email Footer */}
                <div className="bg-slate-50 p-3 text-center border-t border-slate-200 text-[10px] text-slate-500">
                  Biomedical Engineering Society (BMES), CUET • bmes@cuet.ac.bd
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <DialogFooter className="px-6 py-4 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex-shrink-0 flex items-center justify-between sm:justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {activeTab === "emailPreview" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("details")}
                className="text-xs"
              >
                Back to Details
              </Button>
            )}
            <Button
              type="submit"
              form="approval-form"
              size="sm"
              disabled={isSubmitting}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing Induction...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>{sendEmail ? "Approve & Dispatch Credential Email" : "Approve Member (No Email)"}</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
