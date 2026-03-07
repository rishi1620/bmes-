import { Mail, MapPin, Phone, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("contact_submissions").insert({
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      subject: fd.get("subject") as string,
      message: fd.get("message") as string,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: "Failed to send message. Try again.", variant: "destructive" });
    } else {
      toast({ title: "Message sent!", description: "We'll get back to you soon." });
      (e.target as HTMLFormElement).reset();
    }
  };

  return (
    <PageLayout>
      <section className="hero-gradient py-16">
        <div className="container text-center">
          <h1 className="text-4xl font-bold text-primary-foreground md:text-5xl">Contact Us</h1>
          <p className="mt-4 text-primary-foreground/80 max-w-2xl mx-auto">Have a question or want to collaborate? Reach out to us.</p>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading badge="Reach Out" title="Get in Touch" className="text-left" />
            <div className="mt-8 space-y-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><MapPin className="h-5 w-5" /></div>
                <div><h4 className="font-semibold text-foreground">Address</h4><p className="text-sm text-muted-foreground">Dept. of BME, CUET, Chittagong-4349, Bangladesh</p></div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Mail className="h-5 w-5" /></div>
                <div><h4 className="font-semibold text-foreground">Email</h4><p className="text-sm text-muted-foreground">bmes@cuet.ac.bd</p></div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Phone className="h-5 w-5" /></div>
                <div><h4 className="font-semibold text-foreground">Phone</h4><p className="text-sm text-muted-foreground">+880 1XXX-XXXXXX</p></div>
              </div>
            </div>
            
            <div className="mt-8 rounded-xl overflow-hidden border border-border h-64">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3688.086300185984!2d91.96884391535497!3d22.46337583990666!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30ad2fca34ae5549%3A0x35c88a37b3e90e97!2sChittagong%20University%20of%20Engineering%20and%20Technology%20(CUET)!5e0!3m2!1sen!2sbd!4v1625000000000!5m2!1sen!2sbd" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy"
              ></iframe>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-elevated">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="name" placeholder="Your name" required />
              <Input name="email" type="email" placeholder="Your email" required />
            </div>
            <Input name="subject" placeholder="Subject" required />
            <Textarea name="message" placeholder="Your message..." className="min-h-[120px]" required />
            <Button type="submit" className="w-full" disabled={loading}>
              <Send className="mr-2 h-4 w-4" /> {loading ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>
      </section>
    </PageLayout>
  );
};

export default Contact;
