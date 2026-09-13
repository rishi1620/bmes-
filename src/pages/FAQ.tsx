import { useState, useMemo } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { 
  HelpCircle, 
  Search, 
  MessageSquare, 
  ArrowRight, 
  Users, 
  Calendar, 
  GraduationCap, 
  BookOpen, 
  Microscope
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "General" | "Admissions" | "Membership" | "Academics" | "Research" | "Events";
  display_order: number;
  is_active: boolean;
}

const fallbackFAQs: FAQItem[] = [
  {
    id: "faq-1",
    question: "What is the Biomedical Engineering Society (BMES) at CUET?",
    answer: "BMES CUET is the official student and professional society of the Department of Biomedical Engineering at Chittagong University of Engineering & Technology. It aims to foster healthcare innovation, academic excellence, biomedical research, and professional student development.",
    category: "General",
    display_order: 1,
    is_active: true,
  },
  {
    id: "faq-2",
    question: "Who is eligible to apply for official BMES Membership?",
    answer: "All currently enrolled undergraduate and postgraduate students of the Department of Biomedical Engineering at CUET are eligible for general membership. Enthusiastic students from related engineering disciplines can also apply for associate membership during open recruitment drives.",
    category: "Membership",
    display_order: 2,
    is_active: true,
  },
  {
    id: "faq-3",
    question: "How do I get my official BMES Member ID Card?",
    answer: "Once you submit your application through the Student Portal (/portal?tab=membership), the executive committee will review and approve your submission. Upon approval, your unique Member ID is generated, and you can download or print your official membership card from the verification portal.",
    category: "Membership",
    display_order: 3,
    is_active: true,
  },
  {
    id: "faq-4",
    question: "How can I access course syllabus, class routines, and lab materials?",
    answer: "Under the 'Academics' and 'Portal' sections of our website, you can select your academic batch and current semester to view or download term syllabi, official class routines, exam schedules, and specialized biomedical engineering software guides.",
    category: "Academics",
    display_order: 4,
    is_active: true,
  },
  {
    id: "faq-5",
    question: "Can undergraduate students participate in departmental research projects?",
    answer: "Yes! Students are encouraged to connect with faculty members through the 'Research' page. You can review active research areas, explore ongoing lab projects in medical imaging, biosensors, and rehabilitation robotics, and request research mentorship.",
    category: "Research",
    display_order: 5,
    is_active: true,
  },
  {
    id: "faq-6",
    question: "How do I register for upcoming workshops, seminars, and hackathons?",
    answer: "Visit the 'Events' page (/events) where all upcoming workshops and competitions are listed. Click 'Register Now' on any active event to reserve your seat and add the event directly to your Google Calendar.",
    category: "Events",
    display_order: 6,
    is_active: true,
  }
];

const categoryIcons: Record<string, typeof HelpCircle> = {
  All: HelpCircle,
  General: HelpCircle,
  Membership: Users,
  Academics: GraduationCap,
  Research: Microscope,
  Events: Calendar,
  Admissions: BookOpen,
};

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const { data: faqs = fallbackFAQs, isLoading } = useQuery({
    queryKey: ["public-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "faqs_json")
        .maybeSingle();

      if (error) {
        console.error("Error loading FAQs:", error);
        return fallbackFAQs;
      }

      if (data?.setting_value) {
        try {
          const parsed = JSON.parse(data.setting_value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.filter((f: FAQItem) => f.is_active !== false);
          }
        } catch (e) {
          console.error("Failed to parse faqs_json", e);
        }
      }

      return fallbackFAQs;
    },
  });

  const categories = useMemo(() => {
    const cats = new Set<string>(["All"]);
    faqs.forEach((f) => {
      if (f.category) cats.add(f.category);
    });
    return Array.from(cats);
  }, [faqs]);

  const filteredFaqs = useMemo(() => {
    return faqs
      .filter((f) => {
        const matchesCategory =
          selectedCategory === "All" || f.category === selectedCategory;
        const matchesSearch =
          !searchTerm.trim() ||
          f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.answer.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }, [faqs, selectedCategory, searchTerm]);

  return (
    <PageLayout>
      {/* Hero Header */}
      <section className="hero-gradient py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container text-center relative z-10"
        >
          <Badge variant="outline" className="mb-4 text-xs font-semibold px-3 py-1 border-primary-foreground/30 text-primary-foreground bg-primary-foreground/10">
            Knowledge Base & Help Center
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary-foreground tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-primary-foreground/85 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Find immediate answers about BMES membership, department resources, academics, research labs, and club activities.
          </p>

          {/* Search Box */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by topic, e.g. membership, routine, research..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 pl-12 pr-4 text-sm rounded-full bg-card/95 text-foreground shadow-lg border-primary/20 backdrop-blur-sm focus-visible:ring-primary"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </motion.div>
      </section>

      {/* Category Pills & FAQ List */}
      <section className="container py-12 sm:py-16 max-w-4xl mx-auto">
        {/* Category Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 flex-wrap">
          {categories.map((cat) => {
            const IconComponent = categoryIcons[cat] || HelpCircle;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 text-xs sm:text-sm px-4 py-2 rounded-full font-medium transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
                }`}
              >
                <IconComponent className="h-3.5 w-3.5" />
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* FAQs Accordion */}
        <div className="mt-8 bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-xs">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading frequently asked questions...
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <HelpCircle className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <h3 className="text-base font-semibold text-foreground">No matching questions found</h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                We couldn't find any questions matching "{searchTerm}". Try a different keyword or contact our executive team.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-2">
                <Link to="/contact">Contact Support</Link>
              </Button>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full space-y-3">
              {filteredFaqs.map((faq, index) => (
                <AccordionItem
                  key={faq.id || index}
                  value={`faq-${index}`}
                  className="border border-border/80 rounded-xl px-4 sm:px-5 data-[state=open]:bg-primary/5 transition-colors"
                >
                  <AccordionTrigger className="text-left py-4 hover:no-underline gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                        {index + 1}
                      </div>
                      <span className="text-sm sm:text-base font-semibold text-foreground">
                        {faq.question}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-4 text-xs sm:text-sm text-muted-foreground leading-relaxed pl-10">
                    <p className="whitespace-pre-line">{faq.answer}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] border-primary/20 text-primary bg-primary/5">
                        {faq.category}
                      </Badge>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {/* Still Have Questions Card */}
        <div className="mt-12 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-background p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1.5">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-primary font-semibold text-xs tracking-wide">
              <MessageSquare className="h-4 w-4" />
              <span>Need More Assistance?</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              Have a question not listed here?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
              Send us a direct message and our department staff or student representatives will get back to you promptly.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button asChild className="bg-primary text-primary-foreground font-semibold text-xs gap-2">
              <Link to="/contact">
                <span>Reach Out to Us</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="text-xs">
              <Link to="/portal">Visit Portal</Link>
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
