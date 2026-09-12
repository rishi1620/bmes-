import { Mail, MapPin, Phone, Send, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; subject?: string; message?: string }>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    const email = fd.get("email") as string;
    const subject = fd.get("subject") as string;
    const message = fd.get("message") as string;

    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Name is required.";
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!subject.trim()) newErrors.subject = "Subject is required.";
    if (!message.trim()) newErrors.message = "Message is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("contact_submissions").insert({
      name,
      email,
      subject,
      message,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: "Failed to send message. Try again.", variant: "destructive" });
    } else {
      toast({ title: "Message sent!", description: "We'll get back to you soon." });
      (e.target as HTMLFormElement).reset();
      setIsSubmitted(true);
    }
  };

  return (
    <PageLayout>
      <section className="hero-gradient py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container text-center"
        >
          <h1 className="text-4xl font-bold text-primary-foreground md:text-5xl">Contact Us</h1>
          <p className="mt-4 text-primary-foreground/80 max-w-2xl mx-auto">Have a question or want to collaborate? Reach out to us.</p>
        </motion.div>
      </section>

      <section className="container py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
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
          </motion.div>

          {isSubmitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="rounded-xl border border-border bg-card p-8 shadow-elevated text-center flex flex-col items-center justify-center space-y-4 h-full min-h-[400px]"
            >
              <div className="h-16 w-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Message Sent!</h3>
              <p className="text-muted-foreground max-w-sm">
                Thank you for reaching out. We have received your message and will get back to you shortly.
              </p>
              <Button variant="outline" onClick={() => setIsSubmitted(false)} className="mt-6">
                Send Another Message
              </Button>
            </motion.div>
          ) : (
            <motion.form 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              onSubmit={handleSubmit} 
              className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-elevated" 
              noValidate
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Input name="name" placeholder="Your name" className={errors.name ? "border-destructive" : ""} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-1">
                  <Input name="email" type="email" placeholder="Your email" className={errors.email ? "border-destructive" : ""} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
              </div>
              <div className="space-y-1">
                <Input name="subject" placeholder="Subject" className={errors.subject ? "border-destructive" : ""} />
                {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
              </div>
              <div className="space-y-1">
                <Textarea name="message" placeholder="Your message..." className={`min-h-[120px] ${errors.message ? "border-destructive" : ""}`} />
                {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <Send className="mr-2 h-4 w-4" /> {loading ? "Sending..." : "Send Message"}
              </Button>
            </motion.form>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default Contact;
