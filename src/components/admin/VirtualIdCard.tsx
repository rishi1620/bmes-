import React from "react";
import defaultLogo from "@/assets/logo.png";
import { extractBatchInfo, generateMembershipId, getMemberTenure } from "@/utils/membership";
import { ShieldCheck, CheckCircle2, QrCode, Phone, Mail, MapPin, Award } from "lucide-react";
import { format } from "date-fns";

export interface MemberCardData {
  id: string;
  full_name: string;
  email: string;
  student_id: string;
  department: string;
  year_semester: string;
  phone_number?: string | null;
  transaction_id?: string | null;
  status: string;
  created_at?: string;
  photo_url?: string | null;
  blood_group?: string | null;
}

interface VirtualIdCardProps {
  member: MemberCardData;
  logoUrl?: string;
  showBack?: boolean;
  className?: string;
  isPrintOnly?: boolean;
}

export const VirtualIdCard: React.FC<VirtualIdCardProps> = ({
  member,
  logoUrl,
  showBack = false,
  className = "",
  isPrintOnly = false,
}) => {
  const batchInfo = extractBatchInfo(member.student_id, member.year_semester, member.created_at);
  const membershipId = generateMembershipId(member.student_id, member.id, member.year_semester, member.created_at);
  const tenure = getMemberTenure(batchInfo.batchYear);
  const issueDate = member.created_at ? format(new Date(member.created_at), "dd MMM yyyy") : format(new Date(), "dd MMM yyyy");
  const logo = logoUrl || defaultLogo;

  // Initials for avatar fallback
  const initials = member.full_name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "MB";

  return (
    <div className={`id-card-wrapper flex flex-col items-center gap-6 ${className}`}>
      {/* FRONT SIDE */}
      {(!showBack || isPrintOnly) && (
        <div
          id={`id-card-front-${member.id}`}
          className="id-card-front relative w-[360px] sm:w-[420px] h-[228px] sm:h-[265px] rounded-2xl overflow-hidden shadow-2xl border border-emerald-500/30 text-slate-800 dark:text-slate-100 select-none transition-all"
          style={{
            background: "linear-gradient(135deg, #064e3b 0%, #065f46 45%, #047857 100%)",
            color: "#ffffff",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
        >
          {/* Subtle Security Guilloche Background Overlay */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 1px, transparent 1px), radial-gradient(circle at 0 0, rgba(255,255,255,0.2) 2px, transparent 2px)`,
              backgroundSize: "16px 16px, 32px 32px",
            }}
          />

          {/* Holographic Security Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-300 via-emerald-400 to-amber-300" />

          {/* Top Header Banner */}
          <div className="relative z-10 px-4 pt-3 pb-2 flex items-center justify-between border-b border-emerald-400/20 bg-emerald-950/40 backdrop-blur-xs">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-full bg-white p-1 shadow-sm flex items-center justify-center shrink-0">
                <img src={logo} alt="CUET BMES" className="h-full w-full object-contain" />
              </div>
              <div className="leading-tight">
                <h3 className="text-[12px] sm:text-[13px] font-extrabold uppercase tracking-wider text-amber-300">
                  CUET BMES
                </h3>
                <p className="text-[9px] sm:text-[10px] text-emerald-100 font-medium tracking-tight">
                  Biomedical Engineering Society
                </p>
                <p className="text-[8px] text-emerald-200/80 tracking-tight">
                  Chittagong Univ. of Eng. & Tech.
                </p>
              </div>
            </div>

            {/* Official Batch Tag Pill */}
            <div className="flex flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-widest bg-amber-400 text-emerald-950 shadow-sm border border-amber-300">
                {batchInfo.batchTag}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[8.5px] font-semibold text-emerald-200">
                <CheckCircle2 className="w-2.5 h-2.5 text-amber-300" />
                {member.status === "approved" ? "VERIFIED MEMBER" : "OFFICIAL APPLICANT"}
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="relative z-10 p-3 sm:p-4 flex gap-3 sm:gap-4 items-center">
            {/* Portrait Photo Container */}
            <div className="relative shrink-0">
              <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-2 border-amber-300/80 shadow-md overflow-hidden flex flex-col items-center justify-center text-slate-800 dark:text-slate-200">
                {member.photo_url ? (
                  <img
                    src={member.photo_url}
                    alt={member.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-2 text-center text-emerald-900">
                    <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm mb-1 shadow-inner">
                      {initials}
                    </div>
                    <span className="text-[9px] font-semibold tracking-tighter text-emerald-900">
                      CUET BMES
                    </span>
                  </div>
                )}
              </div>

              {/* Holographic Society Seal Badge */}
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-amber-500 text-emerald-950 rounded-full p-1 shadow-md border border-white/60">
                <Award className="w-3.5 h-3.5 text-emerald-950" />
              </div>
            </div>

            {/* Member Details */}
            <div className="flex-1 min-w-0 space-y-1">
              <div>
                <h4 className="font-black text-sm sm:text-base leading-snug tracking-tight text-white truncate drop-shadow-xs">
                  {member.full_name}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] sm:text-[11px] font-bold text-amber-300 tracking-wide">
                    ID: {member.student_id}
                  </span>
                  <span className="text-emerald-300/60">•</span>
                  <span className="text-[9.5px] sm:text-[10px] text-emerald-100 truncate">
                    {member.department}
                  </span>
                </div>
              </div>

              {/* Membership ID Highlight Box */}
              <div className="bg-emerald-950/60 border border-emerald-400/30 rounded-lg px-2.5 py-1 flex items-center justify-between">
                <div>
                  <div className="text-[7.5px] uppercase tracking-wider text-emerald-300/80 font-bold">
                    Membership ID
                  </div>
                  <div className="font-mono text-[11px] sm:text-[12px] font-extrabold text-amber-300 tracking-wider">
                    {membershipId}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[7.5px] uppercase tracking-wider text-emerald-300/80 font-bold">
                    Session / Level
                  </div>
                  <div className="text-[9.5px] sm:text-[10px] font-semibold text-emerald-100 truncate max-w-[110px]">
                    {member.year_semester}
                  </div>
                </div>
              </div>

              {/* Bottom Metadata & Validity */}
              <div className="flex items-center justify-between pt-0.5 text-[8px] sm:text-[8.5px] text-emerald-200/90 font-medium">
                <div>
                  <span className="text-emerald-300/70">Issued:</span> {issueDate}
                </div>
                <div>
                  <span className="text-emerald-300/70">Valid:</span> {tenure}
                </div>
              </div>
            </div>
          </div>

          {/* Card Bottom Footer Line */}
          <div className="absolute bottom-0 left-0 right-0 bg-emerald-950/80 px-4 py-1 flex items-center justify-between border-t border-emerald-400/20 text-[7.5px] tracking-widest text-emerald-300/80 font-semibold uppercase">
            <span>OFFICIAL SOCIETY IDENTIFICATION CARD</span>
            <span className="font-mono text-amber-300">{batchInfo.batchTag}</span>
            <span>www.cuetbmes.org</span>
          </div>
        </div>
      )}

      {/* BACK SIDE */}
      {(showBack || isPrintOnly) && (
        <div
          id={`id-card-back-${member.id}`}
          className="id-card-back relative w-[360px] sm:w-[420px] h-[228px] sm:h-[265px] rounded-2xl overflow-hidden shadow-2xl border border-emerald-500/30 text-slate-800 dark:text-slate-100 select-none transition-all"
          style={{
            background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #022c22 100%)",
            color: "#ffffff",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
        >
          {/* Subtle Guilloche pattern */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 1px, transparent 1px)`,
              backgroundSize: "14px 14px",
            }}
          />

          <div className="relative z-10 p-3 sm:p-4 h-full flex flex-col justify-between">
            {/* Header / Notice */}
            <div>
              <div className="flex items-center justify-between border-b border-emerald-400/20 pb-1.5 mb-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    Official Member Credentials
                  </span>
                </div>
                <span className="text-[9px] font-mono font-bold bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-full">
                  {batchInfo.batchTag}
                </span>
              </div>

              {/* Terms of Membership */}
              <div className="text-[8px] sm:text-[8.5px] leading-relaxed text-emerald-100/90 space-y-1">
                <p>
                  1. This virtual card certifies that the cardholder is a registered member of the <strong>Biomedical Engineering Society (BMES)</strong> at CUET.
                </p>
                <p>
                  2. Entitles holder to society study library access, engineering workshops, research symposiums, and official event privileges.
                </p>
                <p>
                  3. If lost or found, please return to: Department of Biomedical Engineering, CUET, Chattogram-4349, Bangladesh.
                </p>
              </div>
            </div>

            {/* Emergency & Verification Section */}
            <div className="bg-emerald-950/60 border border-emerald-400/20 rounded-lg p-2 flex items-center justify-between gap-2">
              <div className="space-y-0.5 text-[8.5px] sm:text-[9px] text-emerald-100">
                <div className="flex items-center gap-1 text-emerald-200">
                  <Mail className="w-2.5 h-2.5 text-amber-300 shrink-0" />
                  <span className="truncate max-w-[160px] sm:max-w-[200px]">{member.email}</span>
                </div>
                {member.phone_number && (
                  <div className="flex items-center gap-1 text-emerald-200">
                    <Phone className="w-2.5 h-2.5 text-amber-300 shrink-0" />
                    <span>{member.phone_number}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-emerald-200">
                  <MapPin className="w-2.5 h-2.5 text-amber-300 shrink-0" />
                  <span>CUET Campus, Raozan, Chattogram</span>
                </div>
              </div>

              {/* QR Verification Representation */}
              <div className="force-light bg-white p-1.5 rounded-lg shadow-sm shrink-0 flex flex-col items-center">
                <QrCode className="w-10 h-10 sm:w-12 sm:h-12 text-slate-900" />
                <span className="text-[6.5px] font-mono text-slate-700 font-bold tracking-tighter">
                  SCAN TO VERIFY
                </span>
              </div>
            </div>

            {/* Barcode & Signature Footer */}
            <div className="pt-1 flex items-end justify-between border-t border-emerald-400/20">
              {/* Simulated Barcode */}
              <div className="space-y-0.5">
                <div className="h-6 w-32 sm:w-40 flex items-stretch gap-[2px] bg-white/10 p-0.5 rounded">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xs"
                      style={{
                        width: (i % 3 === 0 ? "3px" : i % 2 === 0 ? "2px" : "1px"),
                        opacity: i % 7 === 0 ? 0.3 : 1,
                      }}
                    />
                  ))}
                </div>
                <div className="text-[8px] font-mono text-amber-300 font-semibold tracking-wider">
                  *{membershipId}*
                </div>
              </div>

              {/* Authorized Signatures */}
              <div className="text-right">
                <div className="font-serif italic text-[9px] text-amber-200 tracking-wide border-b border-emerald-300/40 pb-0.5 px-2">
                  Dr. M. Advisor & GS
                </div>
                <div className="text-[7.5px] uppercase text-emerald-300 font-bold tracking-wider pt-0.5">
                  Authorized Signatures
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
