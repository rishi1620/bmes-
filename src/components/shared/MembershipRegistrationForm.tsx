import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Loader2, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ShieldCheck, 
  Mail, 
  RefreshCw, 
  KeyRound, 
  Lock, 
  AlertCircle 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface RegistrationStatus {
  status: string | null;
  created_at: string | null;
  full_name: string | null;
}

export function MembershipRegistrationForm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [existingRegistration, setExistingRegistration] = useState<RegistrationStatus | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    student_id: "",
    department: "",
    year_semester: "",
    phone_number: "",
    transaction_id: "",
  });

  // Email Verification State
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Handle resend countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const checkExistingRegistration = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("membership_registrations")
        .select("status, created_at, full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setExistingRegistration(data);
      }
    } catch (error) {
      console.error("Error checking registration:", error);
    } finally {
      setCheckingStatus(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ 
        ...prev, 
        email: user.email || "", 
        full_name: user.user_metadata?.full_name || "" 
      }));
      checkExistingRegistration();
    } else {
      setCheckingStatus(false);
    }
  }, [user, checkExistingRegistration]);

  // Dispatch OTP from bmes@cuet.ac.bd
  const handleSendVerificationCode = async () => {
    const rawEmail = formData.email.trim();
    if (!rawEmail) {
      toast.error("Please enter your university email address first.");
      return;
    }

    const emailLower = rawEmail.toLowerCase();
    const isCuetDomain = emailLower.endsWith("@student.cuet.ac.bd") || emailLower.endsWith("@cuet.ac.bd");
    if (!isCuetDomain) {
      toast.error("Please use your official CUET student email (@student.cuet.ac.bd or @cuet.ac.bd)");
      return;
    }

    setSendingOtp(true);
    try {
      const response = await fetch("/api/send-member-verification-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailLower,
          name: formData.full_name.trim() || undefined,
          studentId: formData.student_id.trim() || undefined,
        }),
      });

      let data: { success?: boolean; verificationToken?: string; error?: string } = {};
      try {
        data = await response.json();
      } catch {
        // Fallback for non-JSON responses
      }

      if (!response.ok) {
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }

      if (!data.verificationToken) {
        throw new Error("Invalid response from server. Please try again.");
      }

      setVerificationToken(data.verificationToken);
      setOtpSent(true);
      setResendCountdown(60);
      toast.success(`Verification code sent from bmes@cuet.ac.bd to ${emailLower}. Please check your inbox.`);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to send verification email. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP submitted by user
  const handleVerifyOtp = async () => {
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    if (!verificationToken) {
      toast.error("Verification session expired. Please request a new code.");
      return;
    }

    setVerifyingOtp(true);
    try {
      const response = await fetch("/api/verify-member-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          otp: cleanOtp,
          verificationToken,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Verification failed. Please check the code.");
      }

      setIsVerified(true);
      setVerifiedEmail(formData.email.trim().toLowerCase());
      setOtpSent(false);
      setOtp("");
      toast.success("Email verified by bmes@cuet.ac.bd! Member authenticity confirmed.");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to verify code.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResetVerification = () => {
    setIsVerified(false);
    setVerifiedEmail("");
    setOtpSent(false);
    setOtp("");
    setVerificationToken("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailLower = formData.email.trim().toLowerCase();
    
    // Email domain validation
    if (!emailLower.endsWith("@student.cuet.ac.bd") && !emailLower.endsWith("@cuet.ac.bd")) {
      toast.error("Please use your official university email (@student.cuet.ac.bd or @cuet.ac.bd)");
      return;
    }

    // Authenticity Check: Must be verified via bmes@cuet.ac.bd
    if (!isVerified || verifiedEmail !== emailLower) {
      toast.error("Please verify your email address to confirm authenticity before submitting.");
      if (!otpSent) {
        handleSendVerificationCode();
      }
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        email: emailLower,
        user_id: user?.id || null
      };

      const { error } = await supabase.from("membership_registrations").insert([payload]);

      if (error) throw error;

      // Send official confirmation email from bmes@cuet.ac.bd
      try {
        const emailResponse = await fetch("/api/send-membership-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailLower,
            name: formData.full_name,
          }),
        });
        
        if (!emailResponse.ok) {
          const errData = await emailResponse.json().catch(() => ({}));
          console.warn("Failed to send confirmation email. Server responded with:", emailResponse.status, errData);
          toast.error(`Registration submitted, but confirmation email failed: ${errData.error || 'Check server logs'}`);
        } else {
          toast.success("Membership application submitted! An official confirmation has been sent to your verified email.");
        }
      } catch (emailErr) {
        console.error("Failed to send confirmation email:", emailErr);
        toast.info("Application submitted successfully. Under review by CUET BMES Executive Committee.");
      }

      setSubmitted(true);
      checkExistingRegistration();
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      console.error("Registration error:", error);
      
      let errorMessage = "Failed to submit registration. Please try again later.";
      
      if (error.code === "23505") {
        if (error.message?.toLowerCase().includes("email")) {
          errorMessage = "An application with this email address already exists.";
        } else if (error.message?.toLowerCase().includes("student_id")) {
          errorMessage = "An application with this Student ID already exists.";
        } else {
          errorMessage = "You have already submitted an application with these details.";
        }
      } else if (error.code === "42P01") {
        errorMessage = "The registration system is currently unavailable. Please contact an administrator.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (existingRegistration && !submitted) {
    const { status, full_name } = existingRegistration;
    
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in space-y-6">
        {status === 'pending' && (
          <>
            <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mb-2">
              <Clock className="h-10 w-10 text-amber-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">Application Under Review</h3>
              <p className="text-muted-foreground max-w-md">
                Hello <strong>{full_name}</strong>, your verified membership application is currently being processed by the CUET BMES executive committee.
              </p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm max-w-md">
              Your student email was authenticated by <strong>bmes@cuet.ac.bd</strong>. You will receive an official notification once your membership card and ID are issued.
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-amber-700 hover:text-amber-800 hover:bg-amber-100"
              onClick={checkExistingRegistration}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Clock className="h-4 w-4 mr-2" />}
              Refresh Status
            </Button>
          </>
        )}

        {status === 'approved' && (
          <>
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">Welcome, Official Member!</h3>
              <p className="text-muted-foreground max-w-md">
                Congratulations! Your membership has been <strong>Approved</strong>. You are an official member of the CUET Biomedical Engineering Society.
              </p>
            </div>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/portal">Access Member Portal</Link>
            </Button>
          </>
        )}

        {status === 'rejected' && (
          <>
            <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mb-2">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">Application Update</h3>
              <p className="text-muted-foreground max-w-md">
                We regret to inform you that your membership application was not approved at this time.
              </p>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm max-w-md">
              If you have questions or wish to re-apply with verified credentials, please contact the society administrators at <strong>bmes@cuet.ac.bd</strong>.
            </div>
            <Button variant="outline" onClick={() => setExistingRegistration(null)}>
              Try Re-applying
            </Button>
          </>
        )}
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in space-y-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-foreground">Application Received & Verified!</h3>
          <p className="text-muted-foreground max-w-md">
            Your university email (<strong>{formData.email}</strong>) was authenticated by <strong>bmes@cuet.ac.bd</strong>. Your membership dossier has been submitted to the Executive Committee.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          <ShieldCheck className="h-4 w-4" /> Authenticity Confirmed via bmes@cuet.ac.bd
        </div>
        <Button variant="outline" className="mt-4" onClick={() => {
          setSubmitted(false);
          checkExistingRegistration();
        }}>
          View Application Status
        </Button>
      </div>
    );
  }

  const isEmailInputValid = formData.email.trim().toLowerCase().endsWith("@student.cuet.ac.bd") || 
                           formData.email.trim().toLowerCase().endsWith("@cuet.ac.bd");

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      {/* Official Verification Banner */}
      <div className="p-4 rounded-xl border border-primary/25 bg-primary/5 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-foreground text-sm">Official Member Authenticity Protocol</span>
            <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[10px]">
              bmes@cuet.ac.bd
            </Badge>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            To preserve the integrity of CUET BMES membership records, all new applicants must verify their university student email with a 6-digit passcode dispatched directly from the society&apos;s official administrative account (<strong>bmes@cuet.ac.bd</strong>).
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input 
            id="full_name" 
            required 
            value={formData.full_name} 
            onChange={e => setFormData({...formData, full_name: e.target.value})} 
            placeholder="Enter your official full name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="student_id">Student ID</Label>
          <Input 
            id="student_id" 
            required 
            value={formData.student_id} 
            onChange={e => setFormData({...formData, student_id: e.target.value})} 
            placeholder="e.g. 1901001"
          />
        </div>

        {/* University Email Verification Card (Span 2 Columns) */}
        <div className="md:col-span-2 space-y-3 p-4 rounded-xl border border-border bg-card/60 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <Label htmlFor="email" className="font-bold text-foreground flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-primary" />
              University Student Email
            </Label>
            
            {isVerified ? (
              <Badge className="bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15 gap-1 font-semibold text-xs py-0.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Verified via bmes@cuet.ac.bd
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[11px] text-muted-foreground gap-1 border-dashed">
                <Lock className="h-3 w-3" /> Verification Required
              </Badge>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Input 
                id="email" 
                type="email" 
                required 
                disabled={isVerified}
                value={formData.email} 
                onChange={e => {
                  setFormData({...formData, email: e.target.value});
                  if (isVerified) {
                    handleResetVerification();
                  }
                }} 
                placeholder="student_id@student.cuet.ac.bd"
                className={isVerified ? "bg-primary/5 border-primary/40 font-medium text-foreground pr-8" : ""}
              />
              {isVerified && (
                <CheckCircle2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              )}
            </div>

            {isVerified ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetVerification}
                className="text-xs h-10 shrink-0 text-muted-foreground hover:text-foreground"
              >
                Change Email
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleSendVerificationCode}
                disabled={sendingOtp || !formData.email || !isEmailInputValid}
                className="h-10 px-4 text-xs font-bold shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
              >
                {sendingOtp ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Dispatching...
                  </>
                ) : otpSent ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    Resend Code
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verify Email
                  </>
                )}
              </Button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">
            Must be your official university email (e.g. <strong>student_id@student.cuet.ac.bd</strong> or <strong>@cuet.ac.bd</strong>).
          </p>

          {/* Expandable OTP Verification Panel */}
          <AnimatePresence>
            {otpSent && !isVerified && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-3 p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">
                      Enter 6-Digit Passcode
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Sender: <strong className="text-primary">bmes@cuet.ac.bd</strong>
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  We&apos;ve sent an authentic verification code to <strong>{formData.email}</strong>. Enter it below to authenticate your registration.
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="text"
                    maxLength={6}
                    autoFocus
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="font-mono text-center tracking-[0.4em] font-black text-base bg-background h-10 max-w-[200px]"
                  />
                  <Button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={verifyingOtp || otp.length !== 6}
                    className="h-10 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 px-5"
                  >
                    {verifyingOtp ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Confirm & Verify
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/50 text-muted-foreground">
                  <span>Code valid for 10 minutes</span>
                  {resendCountdown > 0 ? (
                    <span>Resend available in {resendCountdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendVerificationCode}
                      disabled={sendingOtp}
                      className="text-primary hover:underline font-semibold"
                    >
                      Resend code via bmes@cuet.ac.bd
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone_number">Phone Number</Label>
          <Input 
            id="phone_number" 
            value={formData.phone_number} 
            onChange={e => setFormData({...formData, phone_number: e.target.value})} 
            placeholder="e.g. +8801XXXXXXXXX"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input 
            id="department" 
            value={formData.department} 
            onChange={e => setFormData({...formData, department: e.target.value})} 
            placeholder="e.g. Biomedical Engineering / BME"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="year_semester">Year & Semester</Label>
          <Select onValueChange={v => setFormData({...formData, year_semester: v})} required>
            <SelectTrigger>
              <SelectValue placeholder="Select Year/Semester" />
            </SelectTrigger>
            <SelectContent>
              {["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"].map(val => (
                <SelectItem key={val} value={`Level-${val.split('-')[0]} Term-${val.split('-')[1]}`}>
                  Level-{val.split('-')[0]} Term-{val.split('-')[1]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="transaction_id">Payment Transaction ID (Optional)</Label>
        <Input 
          id="transaction_id" 
          value={formData.transaction_id} 
          onChange={e => setFormData({...formData, transaction_id: e.target.value})} 
          placeholder="Enter the transaction ID if you have already paid"
        />
        <p className="text-[10px] text-muted-foreground italic">
          Note: Membership requires a one-time registration fee. Please follow the instructions provided by the EC members.
        </p>
      </div>

      {!isVerified && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Email verification via <strong>bmes@cuet.ac.bd</strong> is required before submitting your membership application.
          </span>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary/90 font-bold" 
        disabled={loading || !isVerified}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting Application...
          </>
        ) : !isVerified ? (
          "Verify Email Above to Submit"
        ) : (
          "Submit Authenticated Membership Application"
        )}
      </Button>
    </form>
  );
}
