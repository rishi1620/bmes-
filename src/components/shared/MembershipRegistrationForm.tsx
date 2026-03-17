import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

export function MembershipRegistrationForm() {
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("membership_registrations").insert([formData]);

      if (error) throw error;

      toast.success("Registration submitted successfully!");
      setSubmitted(true);
    } catch (error: unknown) {
      console.error("Registration error:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((error as any).message || "Failed to submit registration. Please ensure the database table exists.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
        <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
        <h3 className="text-2xl font-bold text-foreground">Application Received!</h3>
        <p className="text-muted-foreground mt-2 max-w-md">
          Your membership application has been submitted for review. We will contact you at <strong>{formData.email}</strong> once your status is updated.
        </p>
        <Button variant="outline" className="mt-8" onClick={() => setSubmitted(false)}>
          Submit Another Application
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
          <Label htmlFor="email">Email Address</Label>
          <Input 
            id="email" 
            type="email" 
            required 
            value={formData.email} 
            onChange={e => setFormData({...formData, email: e.target.value})} 
            placeholder="your.email@example.com"
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
