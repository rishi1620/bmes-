import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

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

  const checkExistingRegistration = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("membership_registrations")
        .select("status, created_at, full_name")
        .eq("email", user.email)
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
      setFormData(prev => ({ ...prev, email: user.email || "", full_name: user.user_metadata?.full_name || "" }));
      checkExistingRegistration();
    } else {
      setCheckingStatus(false);
    }
  }, [user, checkExistingRegistration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Email domain validation
    if (!formData.email.toLowerCase().endsWith("@student.cuet.ac.bd")) {
      toast.error("Please use your official university email (@student.cuet.ac.bd)");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        user_id: user?.id || null
      };

      const { error } = await supabase.from("membership_registrations").insert([payload]);

      if (error) throw error;

      // Send confirmation email
      try {
        const emailResponse = await fetch("/api/send-membership-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            name: formData.full_name,
          }),
        });
        
        if (!emailResponse.ok) {
          const errData = await emailResponse.json().catch(() => ({}));
          console.warn("Failed to send confirmation email. Server responded with:", emailResponse.status, errData);
          toast.error(`Registration submitted, but email failed: ${errData.error || 'Check server logs'}`);
        } else {
          toast.success("Registration submitted successfully! A confirmation email has been sent.");
        }
      } catch (emailErr) {
        console.error("Failed to send confirmation email:", emailErr);
        toast.error("Registration submitted, but we couldn't send a confirmation email at this time.");
      }

      setSubmitted(true);
      checkExistingRegistration();
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      console.error("Registration error:", error);
      
      let errorMessage = "Failed to submit registration. Please try again later.";
      
      // Handle Supabase specific error codes for better user feedback
      if (error.code === "23505") { // Unique violation
        if (error.message?.toLowerCase().includes("email")) {
          errorMessage = "An application with this email address already exists.";
        } else if (error.message?.toLowerCase().includes("student_id")) {
          errorMessage = "An application with this Student ID already exists.";
        } else {
          errorMessage = "You have already submitted an application with these details.";
        }
      } else if (error.code === "42P01") { // Table not found
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
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
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
              <h3 className="text-2xl font-bold text-foreground">Application Pending</h3>
              <p className="text-muted-foreground max-w-md">
                Hello <strong>{full_name}</strong>, your membership application is currently being reviewed by the executive committee.
              </p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm max-w-md">
              Please wait for approval. You will receive an email notification once your status is updated.
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
            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">Welcome, Member!</h3>
              <p className="text-muted-foreground max-w-md">
                Congratulations! Your membership has been <strong>Approved</strong>. You are now an official member of the CUET Biomedical Engineering Society.
              </p>
            </div>
            <Button asChild className="bg-emerald-500 hover:bg-emerald-600">
              <Link to="/portal">Go to Portal</Link>
            </Button>
          </>
        )}

        {status === 'rejected' && (
          <>
            <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mb-2">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">Application Rejected</h3>
              <p className="text-muted-foreground max-w-md">
                We regret to inform you that your membership application was not approved at this time.
              </p>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm max-w-md">
              If you believe this is a mistake or would like to re-apply with corrected information, please contact the society administrators.
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
      <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
        <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
        <h3 className="text-2xl font-bold text-foreground">Application Received!</h3>
        <p className="text-muted-foreground mt-2 max-w-md">
          Your membership application has been submitted for review. We will contact you at <strong>{formData.email}</strong> once your status is updated.
        </p>
        <Button variant="outline" className="mt-8" onClick={() => {
          setSubmitted(false);
          checkExistingRegistration();
        }}>
          View Status
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input 
            id="full_name" 
            required 
            value={formData.full_name} 
            onChange={e => setFormData({...formData, full_name: e.target.value})} 
            placeholder="Enter your full name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">University Email Address</Label>
          <Input 
            id="email" 
            type="email" 
            required 
            value={formData.email} 
            onChange={e => setFormData({...formData, email: e.target.value})} 
            placeholder="student_id@student.cuet.ac.bd"
          />
          <p className="text-[10px] text-muted-foreground">
            Must be your official <strong>@student.cuet.ac.bd</strong> email.
          </p>
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
          <Select onValueChange={v => setFormData({...formData, department: v})} required>
            <SelectTrigger>
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BME">Biomedical Engineering (BME)</SelectItem>
              <SelectItem value="EEE">Electrical & Electronic Engineering (EEE)</SelectItem>
              <SelectItem value="CSE">Computer Science & Engineering (CSE)</SelectItem>
              <SelectItem value="ME">Mechanical Engineering (ME)</SelectItem>
              <SelectItem value="CE">Civil Engineering (CE)</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
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

      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting Application...
          </>
        ) : (
          "Submit Membership Application"
        )}
      </Button>
    </form>
  );
}
