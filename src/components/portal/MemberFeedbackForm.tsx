import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  MessageSquare, 
  Send, 
  Star, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink,
  HelpCircle,
  Building2,
  BookOpen,
  Laptop,
  GraduationCap
} from "lucide-react";
import { useGoogleFormsConfig } from "@/hooks/useGoogleFormsConfig";

const FEEDBACK_CATEGORIES = [
  { value: "Workshops & Training", label: "Workshops & Technical Hands-on Training", icon: Laptop },
  { value: "Academic Library", label: "BME Library & Textbook Resources", icon: BookOpen },
  { value: "Software Hub", label: "Biomedical Software & Simulation Tools", icon: Laptop },
  { value: "Seminars & Conferences", label: "Seminars, Conferences & Guest Talks", icon: Building2 },
  { value: "Membership & ID Cards", label: "Membership Services & Student ID Cards", icon: GraduationCap },
  { value: "General Suggestions", label: "General Society Suggestions & Initiatives", icon: Sparkles },
];

const RATING_LABELS: Record<number, string> = {
  1: "Needs Substantial Improvement",
  2: "Fair - Room for Growth",
  3: "Good - Meets Expectations",
  4: "Very Good - Highly Beneficial",
  5: "Outstanding - Exemplary Experience",
};

export const MemberFeedbackForm: React.FC = () => {
  const { config: formsConfig } = useGoogleFormsConfig();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [batch, setBatch] = useState("");
  const [department, setDepartment] = useState("Biomedical Engineering");
  const [category, setCategory] = useState("Workshops & Training");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Your full name is required.";
    if (!email.trim()) {
      errs.email = "Your student or personal email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Please enter a valid email address.";
    }
    if (!feedback.trim()) {
      errs.feedback = "Please enter your thoughts or suggestions.";
    } else if (feedback.trim().length < 10) {
      errs.feedback = "Please provide at least 10 characters of constructive feedback.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const subject = `[Member Feedback] [Rating: ${rating}/5] [${category}]${studentId ? ` [ID: ${studentId.trim()}]` : ""}`;
      
      const formattedMessage = [
        `📋 Category: ${category}`,
        `⭐ Member Rating: ${rating}/5 (${RATING_LABELS[rating] || ""})`,
        studentId ? `🎓 Student ID: ${studentId.trim()}` : null,
        batch ? `🏷️ Batch: ${batch.trim()}` : null,
        `🏛️ Department: ${department}`,
        `🕒 Submitted: ${new Date().toLocaleString()}`,
        `--------------------------------------------------`,
        `📝 Member Feedback & Suggestions:`,
        feedback.trim(),
      ].filter(Boolean).join("\n");

      const { error } = await supabase.from("contact_submissions").insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject,
        message: formattedMessage,
      });

      if (error) throw error;

      toast.success("Thank you! Your feedback has been recorded and synced to the executive committee.");
      setIsSubmitted(true);

      // Trigger custom event so any open admin panels update reactively
      window.dispatchEvent(new CustomEvent("bmes-forms-data-refreshed"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit feedback. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setStudentId("");
    setBatch("");
    setFeedback("");
    setRating(5);
    setCategory("Workshops & Training");
    setErrors({});
    setIsSubmitted(false);
  };

  const hasExternalGoogleForm = Boolean(
    formsConfig.memberFeedbackFormUrl && 
    formsConfig.memberFeedbackFormUrl.trim().length > 0 &&
    !formsConfig.memberFeedbackFormUrl.includes("1FAIpQLSd9qC70Z3lM0hFh1q5N6b5B7R8v0s9t4u1w")
  );

  const directGoogleFormUrl = hasExternalGoogleForm 
    ? formsConfig.memberFeedbackFormUrl.replace(/[?&]embedded=true/, "")
    : "";

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/25 gap-1.5 text-xs py-0.5 px-2.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Member Voice & Feedback
              </Badge>
              <span className="text-xs text-muted-foreground">• Direct Committee Sync</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Share Your Thoughts & Society Feedback
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Help us shape workshops, academic library acquisitions, software tools, and executive initiatives. Your feedback is reviewed directly by the BMES CUET executive panel.
            </p>
          </div>

          {hasExternalGoogleForm && (
            <div className="shrink-0">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20"
              >
                <a href={directGoogleFormUrl} target="_blank" rel="noopener noreferrer">
                  <span>Open Official Google Form</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Submission Form */}
      {isSubmitted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-border bg-card p-8 sm:p-12 text-center shadow-sm space-y-4 max-w-xl mx-auto"
        >
          <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-foreground">Feedback Received!</h3>
            <p className="text-sm text-muted-foreground">
              Thank you for contributing to our community. Your suggestions have been logged and synced directly to the executive committee dashboard.
            </p>
          </div>
          <div className="pt-4 flex justify-center gap-3">
            <Button onClick={resetForm} variant="outline" size="sm" className="h-9">
              Submit Another Response
            </Button>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Tanvir Ahmed"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`h-9 text-xs ${errors.name ? "border-destructive ring-1 ring-destructive" : ""}`}
              />
              {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Student / Personal Email <span className="text-destructive">*</span>
              </Label>
              <Input
                type="email"
                placeholder="your_email@student.cuet.ac.bd"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`h-9 text-xs ${errors.email ? "border-destructive ring-1 ring-destructive" : ""}`}
              />
              {errors.email && <p className="text-[11px] text-destructive">{errors.email}</p>}
            </div>

            {/* Student ID */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Student ID <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                placeholder="e.g. 1901002"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            {/* Batch & Department */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Batch</Label>
                <Input
                  placeholder="e.g. '19 or '20"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Department</Label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Feedback Topic / Category */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Feedback Area / Topic <span className="text-destructive">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select topic" />
              </SelectTrigger>
              <SelectContent>
                {FEEDBACK_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="text-xs">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Satisfaction Rating */}
          <div className="space-y-2 p-4 rounded-xl bg-muted/40 border border-border/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <Label className="text-xs font-semibold text-foreground">
                Overall Experience / Satisfaction Rating
              </Label>
              <span className="text-xs font-medium text-primary">
                {RATING_LABELS[hoverRating || rating]}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((starVal) => {
                const isActive = (hoverRating || rating) >= starVal;
                return (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setRating(starVal)}
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 rounded-lg transition-transform hover:scale-110 focus:outline-none"
                    title={`${starVal} star - ${RATING_LABELS[starVal]}`}
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        isActive
                          ? "fill-amber-400 text-amber-500"
                          : "text-muted-foreground/30 hover:text-muted-foreground/60"
                      }`}
                    />
                  </button>
                );
              })}
              <span className="text-xs text-muted-foreground ml-2 font-mono">
                {rating} of 5 Stars
              </span>
            </div>
          </div>

          {/* Detailed Message */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">
                Detailed Feedback & Suggestions <span className="text-destructive">*</span>
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {feedback.length} characters
              </span>
            </div>
            <Textarea
              placeholder="Tell us what worked well, what could be improved, topics you'd love to explore in future workshops, or suggestions for society leadership..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className={`text-xs resize-y min-h-[100px] ${
                errors.feedback ? "border-destructive ring-1 ring-destructive" : ""
              }`}
            />
            {errors.feedback && <p className="text-[11px] text-destructive">{errors.feedback}</p>}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              Submissions are stored securely and reviewed only by executive committee officers.
            </p>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto h-9 text-xs px-6 font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 shadow-xs"
            >
              {isSubmitting ? (
                <span>Submitting Feedback...</span>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Submit Feedback</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default MemberFeedbackForm;
