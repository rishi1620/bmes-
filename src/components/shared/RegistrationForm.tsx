import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface RegistrationFormProps {
  eventId: string;
  eventTitle: string;
  onSuccess?: () => void;
}

export function RegistrationForm({ eventId, eventTitle, onSuccess }: RegistrationFormProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    details: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Insert into Supabase
      const { error: supabaseError } = await supabase.from("event_registrations").insert({
        event_id: eventId,
        name: formData.name,
        email: formData.email,
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
        <Label htmlFor="details">Additional Details (Optional)</Label>
        <Textarea
          id="details"
          placeholder="Any specific requirements or questions?"
          value={formData.details}
          onChange={(e) => setFormData({ ...formData, details: e.target.value })}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Registering...
          </>
        ) : (
          "Register Now"
        )}
      </Button>
    </form>
  );
}
