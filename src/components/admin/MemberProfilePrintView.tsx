import React from "react";
import defaultLogo from "@/assets/logo.png";
import { extractBatchInfo, generateMembershipId, getMemberTenure } from "@/utils/membership";
import { MemberCardData } from "./VirtualIdCard";
import { format } from "date-fns";
import { Award, CheckCircle2, QrCode } from "lucide-react";

interface MemberProfilePrintViewProps {
  member: MemberCardData;
  logoUrl?: string;
  className?: string;
}

export const MemberProfilePrintView: React.FC<MemberProfilePrintViewProps> = ({
  member,
  logoUrl,
  className = "",
}) => {
  const batchInfo = extractBatchInfo(member.student_id, member.year_semester, member.created_at);
  const membershipId = generateMembershipId(member.student_id, member.id, member.year_semester, member.created_at);
  const tenure = getMemberTenure(batchInfo.batchYear);
  const registeredDate = member.created_at ? format(new Date(member.created_at), "MMMM dd, yyyy") : format(new Date(), "MMMM dd, yyyy");
  const logo = logoUrl || defaultLogo;

  const initials = member.full_name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "MB";

  return (
    <div
      id={`member-profile-print-${member.id}`}
      className={`member-profile-dossier bg-white text-slate-900 p-8 sm:p-12 max-w-4xl mx-auto rounded-xl shadow-lg border border-slate-200 print:border-0 print:shadow-none print:p-0 print:m-0 print:max-w-full ${className}`}
      style={{
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Printable Letterhead Header */}
      <div className="border-b-2 border-emerald-700 pb-6 mb-8 flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img src={logo} alt="CUET BMES" className="h-16 w-16 object-contain" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-emerald-900 uppercase">
              Biomedical Engineering Society (BMES)
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-700">
              Chittagong University of Engineering & Technology (CUET)
            </p>
            <p className="text-[11px] text-slate-500">
              Department of Biomedical Engineering • Raozan, Chattogram-4349, Bangladesh
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold uppercase tracking-wider">
            Official Member Dossier
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-mono">
            REF: {membershipId}
          </p>
        </div>
      </div>

      {/* Member Hero Summary Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 print:bg-slate-100/70">
        <div className="flex items-center gap-5">
          {/* Member Photo / Avatar */}
          <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-lg bg-emerald-800 text-white border-2 border-emerald-600 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
            {member.photo_url ? (
              <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold">{initials}</span>
                <span className="text-[9px] uppercase tracking-wider text-emerald-200 mt-1">CUET BMES</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-400 text-emerald-950 shadow-xs border border-amber-300">
                {batchInfo.batchTag}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                {member.status === "approved" ? "Official Member" : "Application Received"}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {member.full_name}
            </h2>
            <p className="text-sm font-medium text-slate-600">
              {member.department}
            </p>
            <p className="text-xs text-slate-500">
              Student ID: <span className="font-mono font-bold text-slate-800">{member.student_id}</span> • Academic Session: <span className="font-semibold text-slate-800">{member.year_semester}</span>
            </p>
          </div>
        </div>

        {/* QR & Membership ID Block */}
        <div className="flex flex-col items-center sm:items-end justify-center shrink-0 border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-6">
          <div className="p-2 bg-white rounded-lg border border-slate-300 shadow-xs mb-2">
            <QrCode className="w-16 h-16 text-slate-900" />
          </div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Membership ID
          </span>
          <span className="font-mono font-black text-sm text-emerald-800 tracking-wider">
            {membershipId}
          </span>
        </div>
      </div>

      {/* Structured Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Academic Profile */}
        <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-600" /> Academic Information
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Full Name</span>
              <span className="font-bold text-slate-800">{member.full_name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">CUET Student ID</span>
              <span className="font-mono font-bold text-slate-900">{member.student_id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Academic Batch</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {batchInfo.batchLabel}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Department</span>
              <span className="font-semibold text-slate-800">{member.department}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Current Level / Term</span>
              <span className="font-medium text-slate-800">{member.year_semester}</span>
            </div>
          </div>
        </div>

        {/* Membership & Verification Details */}
        <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-600" /> Society Credentials
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Membership ID</span>
              <span className="font-mono font-bold text-emerald-800">{membershipId}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Official Batch Tag</span>
              <span className="font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                {batchInfo.batchTag}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Society Status</span>
              <span className="font-bold text-emerald-700 capitalize">{member.status}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Membership Tenure</span>
              <span className="font-semibold text-slate-800">{tenure}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Payment Transaction ID</span>
              <span className="font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                {member.transaction_id || "Verified Fee Receipt"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact & Registration Information */}
      <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3 mb-8">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 border-b border-slate-100 pb-2">
          Contact & Communication Record
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block mb-0.5">Primary Email</span>
            <span className="font-semibold text-slate-900 break-all">{member.email}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">Phone Number</span>
            <span className="font-semibold text-slate-900">{member.phone_number || "Not provided"}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">Registration Date</span>
            <span className="font-semibold text-slate-900">{registeredDate}</span>
          </div>
        </div>
      </div>

      {/* Society Certification & Official Seal Section */}
      <div className="pt-8 border-t-2 border-slate-200 mt-12 grid grid-cols-3 gap-6 text-center text-xs">
        <div className="space-y-12">
          <div className="h-10 flex items-end justify-center font-serif italic text-slate-700">
            {member.full_name}
          </div>
          <div className="border-t border-slate-400 pt-1 text-slate-600 font-medium">
            Member Signature
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-emerald-600/60 flex flex-col items-center justify-center text-emerald-800 p-1">
            <span className="text-[8px] font-black uppercase tracking-tight text-center">
              CUET BMES
            </span>
            <span className="text-[7px] font-bold text-center">OFFICIAL SEAL</span>
          </div>
          <span className="text-[9px] text-slate-400 mt-1">Society Verification</span>
        </div>

        <div className="space-y-12">
          <div className="h-10 flex items-end justify-center font-serif italic text-emerald-900">
            Executive Committee
          </div>
          <div className="border-t border-slate-400 pt-1 text-slate-600 font-medium">
            Faculty Advisor / President
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
        This document is an authentic electronic record issued by the Biomedical Engineering Society (BMES), CUET. 
        Verify membership authenticity at <span className="text-emerald-700 font-medium">www.cuetbmes.org/portal</span> using ID: <span className="font-mono font-bold text-slate-600">{membershipId}</span>.
      </div>
    </div>
  );
};
