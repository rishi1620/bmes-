import { Mail, MapPin, Phone, Send, CheckCircle2, HelpCircle, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; subject?: string; message?: string }>({});

  const { data: faqs = [] } = useQuery({
    queryKey: ["contact-faqs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "faqs_json")
        .maybeSingle();

      if (data?.setting_value) {
        try {
          const parsed = JSON.parse(data.setting_value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.filter((f) => f.is_active !== false).slice(0, 5);
          }
        } catch {
          // ignore
        }
      }
      return [
        {
          id: "faq-1",
          question: "How do I become an official member of CUET BMES?",
          answer: "Students of CUET Department of BME can apply directly through the Student Portal (/portal?tab=membership). Once approved by the executive committee, your Member ID is issued.",
        },
        {
          id: "faq-2",
          question: "Who can attend BMES workshops and hackathons?",
          answer: "Most workshops and academic seminars are open to all CUET engineering students and interested researchers. Check the Events tab (/events) for details and sign up.",
        },
        {
          id: "faq-3",
          question: "How do I download course syllabi and class routines?",
          answer: "Academic resources, batch routines, and term syllabi can be downloaded directly from the Academics page (/academics) and the Student Portal (/portal).",
        }
      ];
    },
  });

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
                <div>
                  <h4 className="font-semibold text-foreground">Email</h4>
                  <a href="mailto:bmes@cuet.ac.bd" className="text-sm text-primary hover:underline font-medium">
                    bmes@cuet.ac.bd
                  </a>
                </div>
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

          <div>
            {isSubmitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="rounded-xl border border-border bg-card p-8 shadow-elevated text-center flex flex-col items-center justify-center space-y-4 h-full min-h-[400px]"
              >
                <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
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
        </div>

        {/* FAQs Section */}
        {faqs.length > 0 && (
          <div className="mt-20 pt-12 border-t border-border">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-1">
                  <HelpCircle className="h-4 w-4" />
                  <span>Frequently Asked Questions</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  Quick Answers to Common Queries
                </h3>
              </div>
              <Button asChild variant="outline" size="sm" className="text-xs font-semibold gap-1.5 self-start sm:self-auto">
                <Link to="/faq">
                  <span>View All FAQs</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
              <Accordion type="single" collapsible className="w-full space-y-3">
                {faqs.map((faq, idx) => (
                  <AccordionItem
                    key={faq.id || idx}
                    value={`contact-faq-${idx}`}
                    className="border border-border/80 rounded-xl px-4 data-[state=open]:bg-primary/5 transition-colors"
                  >
                    <AccordionTrigger className="text-left py-3.5 hover:no-underline text-sm font-semibold text-foreground">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1 pb-3.5">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        )}
      </section>
    </PageLayout>
  );
};

export default Contact;
