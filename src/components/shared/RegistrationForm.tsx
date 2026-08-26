import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";

interface RegistrationFormProps {
  eventId: string;
  eventTitle: string;
  onSuccess?: () => void;
}

export function RegistrationForm({ eventId, eventTitle, onSuccess }: RegistrationFormProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    student_id: "",
    batch: "",
    department: "",
    details: "",
  });

  const sendOtp = async () => {
    if (!formData.email) {
      toast({ title: "Email required", description: "Please enter your email first.", variant: "destructive" });
      return;
    }
    setOtpSending(true);
    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }
      
      setVerificationToken(data.verificationToken);
      setShowOtpInput(true);
      toast({
        title: "Verification Code Sent",
        description: `A code has been sent to ${formData.email}. Please check your inbox.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setOtpSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    if (!showOtpInput) {
      await sendOtp();
      return;
    }

    if (!otp) {
      toast({ title: "OTP required", description: "Please enter the verification code to continue.", variant: "destructive" });
      return;
    }

    if (!verificationToken) {
      toast({ title: "Error", description: "Verification token missing. Please resend the code.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      // 0. Verify OTP
      const verifyResponse = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp, verificationToken }),
      });
      
      const verifyData = await verifyResponse.json();
      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || "Invalid verification code");
      }

      // 1. Insert into Supabase
      const { error: supabaseError } = await supabase.from("event_registrations").insert({
        event_id: eventId,
        name: formData.name,
        email: formData.email,
        student_id: formData.student_id,
        batch: formData.batch,
        department: formData.department,
        details: formData.details,
      });

      if (supabaseError) throw supabaseError;

      // 2. Send confirmation email via our backend
      try {
        const emailResponse = await fetch("/api/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            name: formData.name,
            eventTitle: eventTitle,
          }),
        });
        
        if (!emailResponse.ok) {
          console.warn("Failed to send confirmation email. Server responded with:", emailResponse.status);
          toast({
            title: "Registration Successful",
            description: `You have successfully registered for ${eventTitle}, but we couldn't send a confirmation email at this time.`,
            variant: "default",
          });
        } else {
          toast({
            title: "Registration Successful!",
            description: `You have successfully registered for ${eventTitle}. A confirmation email has been sent.`,
          });
        }
      } catch (emailErr) {
        console.error("Failed to send confirmation email:", emailErr);
        toast({
          title: "Registration Successful",
          description: `You have successfully registered for ${eventTitle}, but we couldn't send a confirmation email at this time.`,
          variant: "default",
        });
      }

      setSubmitted(true);
      if (onSuccess) {
        // Delay closing the dialog if needed, or just let the parent handle it
        setTimeout(() => onSuccess(), 3000);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Registration Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="py-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Thank you for registering!</h3>
          <p className="text-sm text-muted-foreground">
            A confirmation email has been sent to <strong>{formData.email}</strong>.
          </p>
        </div>
        <Button variant="outline" onClick={() => setSubmitted(false)} className="mt-4">
          Register another person
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!showOtpInput ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="student_id">Student ID</Label>
            <Input
              id="student_id"
              placeholder="e.g. 2111001"
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="batch">Batch</Label>
            <Input
              id="batch"
              placeholder="e.g. 21"
              value={formData.batch}
              onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              placeholder="e.g. BME"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="details">Additional Details (Optional)</Label>
            <Textarea
              id="details"
              placeholder="Any specific requirements or questions?"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            />
          </div>
        </>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="space-y-4 p-6 bg-muted/50 rounded-xl border">
            <Label htmlFor="otp" className="flex items-center gap-2 text-lg font-semibold">
              <Mail className="h-5 w-5 text-primary" />
              Verification Code
            </Label>
            <p className="text-sm text-muted-foreground">
              We sent a 6-digit code to <strong>{formData.email}</strong>. Entering it below will complete your registration.
            </p>
            <Input
              id="otp"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              className="font-mono text-center tracking-widest text-2xl h-14"
            />
            <div className="flex justify-between items-center pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowOtpInput(false)}>
                Back to Form
              </Button>
              <Button type="button" variant="link" size="sm" onClick={sendOtp} disabled={otpSending}>
                Resend Code
              </Button>
            </div>
          </div>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading || otpSending}>
        {loading || otpSending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {otpSending ? "Sending Code..." : "Verifying & Registering..."}
          </>
        ) : showOtpInput ? (
          "Verify & Register"
        ) : (
          "Verify Email & Register"
        )}
      </Button>
    </form>
  );
}
