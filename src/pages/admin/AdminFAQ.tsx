import { useEffect, useState, useCallback, useMemo } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Trash2, 
  Pencil, 
  HelpCircle, 
  Search, 
  Check, 
  RefreshCw, 
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "General" | "Admissions" | "Membership" | "Academics" | "Research" | "Events";
  display_order: number;
  is_active: boolean;
}

const defaultFAQs: FAQItem[] = [
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

const categories = ["All", "General", "Admissions", "Membership", "Academics", "Research", "Events"] as const;

export default function AdminFAQ() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Modal states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form states
  const [formQuestion, setFormQuestion] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [formCategory, setFormCategory] = useState<FAQItem["category"]>("General");
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState(true);

  // Load from site_settings (setting_key: faqs_json)
  const loadFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "faqs_json")
        .maybeSingle();

      if (error) throw error;

      if (data?.setting_value) {
        try {
          const parsed = JSON.parse(data.setting_value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFaqs(parsed);
            return;
          }
        } catch (e) {
          console.error("Failed to parse faqs_json", e);
        }
      }

      // If not yet saved in site_settings, seed defaults
      setFaqs(defaultFAQs);
    } catch (err) {
      console.error("Error loading FAQs:", err);
      toast.error("Failed to load FAQs");
      setFaqs(defaultFAQs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFaqs();
  }, [loadFaqs]);

  // Save FAQs to site_settings
  const persistFaqs = async (updatedList: FAQItem[]) => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("setting_key", "faqs_json")
        .maybeSingle();

      const jsonStr = JSON.stringify(updatedList);

      if (existing?.id) {
        await supabase
          .from("site_settings")
          .update({
            setting_value: jsonStr,
            setting_group: "faqs",
            updated_at: new Date().toISOString()
          })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("site_settings")
          .insert({
            setting_key: "faqs_json",
            setting_value: jsonStr,
            setting_group: "faqs",
          });
      }

      setFaqs(updatedList);
      toast.success("FAQs updated and synced with public website.");
    } catch (err) {
      console.error("Error saving FAQs:", err);
      toast.error("Failed to save FAQs.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingFaq(null);
    setFormQuestion("");
    setFormAnswer("");
    setFormCategory("General");
    setFormOrder(faqs.length + 1);
    setFormIsActive(true);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: FAQItem) => {
    setEditingFaq(item);
    setFormQuestion(item.question);
    setFormAnswer(item.answer);
    setFormCategory(item.category);
    setFormOrder(item.display_order);
    setFormIsActive(item.is_active);
    setIsDialogOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim() || !formAnswer.trim()) {
      toast.error("Please enter both question and answer.");
      return;
    }

    let updated: FAQItem[];
    if (editingFaq) {
      updated = faqs.map((f) =>
        f.id === editingFaq.id
          ? {
              ...f,
              question: formQuestion.trim(),
              answer: formAnswer.trim(),
              category: formCategory,
              display_order: Number(formOrder) || 1,
              is_active: formIsActive,
            }
          : f
      );
    } else {
      const newItem: FAQItem = {
        id: `faq-${Date.now()}`,
        question: formQuestion.trim(),
        answer: formAnswer.trim(),
        category: formCategory,
        display_order: Number(formOrder) || faqs.length + 1,
        is_active: formIsActive,
      };
      updated = [...faqs, newItem];
    }

    // Sort by display order
    updated.sort((a, b) => a.display_order - b.display_order);
    setIsDialogOpen(false);
    await persistFaqs(updated);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const updated = faqs.filter((f) => f.id !== deleteId);
    setDeleteId(null);
    await persistFaqs(updated);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const updated = faqs.map((f) =>
      f.id === id ? { ...f, is_active: !currentStatus } : f
    );
    await persistFaqs(updated);
  };

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return faqs.filter((f) => {
      const matchesCategory =
        selectedCategory === "All" || f.category === selectedCategory;
      const matchesSearch =
        !searchTerm.trim() ||
        f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.answer.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [faqs, selectedCategory, searchTerm]);

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline" className="text-[11px] font-semibold tracking-wide border-primary/30 text-primary bg-primary/5">
                Core Content
              </Badge>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <Check className="h-3 w-3" /> Live Synced with Public Site
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions (FAQ)
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Manage questions, answers, and categories displayed on the public website (/faq and /contact).
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 text-xs font-semibold gap-1.5"
            >
              <Link to="/faq" target="_blank" rel="noopener noreferrer">
                <span>View Public FAQ</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="h-9 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shadow-2xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add New FAQ</span>
            </Button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-2xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs bg-background"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQs List */}
        <Card className="border-border shadow-xs">
          <CardHeader className="bg-muted/20 border-b pb-3.5 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-bold">
                  Questions & Answers ({filteredFaqs.length} of {faqs.length})
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadFaqs}
                disabled={loading}
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
            </div>
            <CardDescription className="text-xs">
              Drag or reorder display order to prioritize which questions visitors see first.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 divide-y divide-border/60">
            {loading ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                Loading FAQs from database...
              </div>
            ) : filteredFaqs.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <HelpCircle className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                <p className="text-sm font-medium text-foreground">No questions found</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {searchTerm
                    ? "No questions match your current search query."
                    : "Get started by adding your first frequently asked question."}
                </p>
                <Button onClick={handleOpenAdd} size="sm" variant="outline" className="text-xs gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add First FAQ
                </Button>
              </div>
            ) : (
              filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors hover:bg-muted/30 ${
                    !faq.is_active ? "opacity-60 bg-muted/10" : ""
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground font-semibold">
                        #{faq.display_order}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-semibold border-primary/20 text-primary bg-primary/5">
                        {faq.category}
                      </Badge>
                      {!faq.is_active && (
                        <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                          Hidden from public
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-foreground leading-snug">
                      {faq.question}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                      {faq.answer}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40 w-full sm:w-auto justify-end">
                    <div className="flex items-center gap-1 mr-2" title="Toggle visibility on public site">
                      <Switch
                        checked={faq.is_active}
                        onCheckedChange={() => handleToggleActive(faq.id, faq.is_active)}
                        className="scale-75"
                      />
                      <span className="text-[10px] text-muted-foreground hidden sm:inline">
                        {faq.is_active ? "Live" : "Draft"}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEdit(faq)}
                      className="h-8 text-xs px-2.5 gap-1"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteId(faq.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingFaq ? "Edit Frequently Asked Question" : "Add New Frequently Asked Question"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Changes will immediately reflect on the public FAQ page and Contact section.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveModal} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Question</Label>
              <Input
                placeholder="e.g., How do I apply for BMES Membership?"
                value={formQuestion}
                onChange={(e) => setFormQuestion(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Answer</Label>
              <Textarea
                placeholder="Provide a clear, detailed, and helpful answer for students and visitors..."
                value={formAnswer}
                onChange={(e) => setFormAnswer(e.target.value)}
                required
                rows={5}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Category</Label>
                <Select
                  value={formCategory}
                  onValueChange={(val) => setFormCategory(val as FAQItem["category"])}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Admissions">Admissions</SelectItem>
                    <SelectItem value="Membership">Membership</SelectItem>
                    <SelectItem value="Academics">Academics</SelectItem>
                    <SelectItem value="Research">Research</SelectItem>
                    <SelectItem value="Events">Events</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Display Order</Label>
                <Input
                  type="number"
                  value={formOrder}
                  onChange={(e) => setFormOrder(parseInt(e.target.value) || 1)}
                  className="text-xs h-9"
                  min={1}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Active & Visible</Label>
                <p className="text-[11px] text-muted-foreground">
                  Show this FAQ immediately on the public website
                </p>
              </div>
              <Switch
                checked={formIsActive}
                onCheckedChange={setFormIsActive}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="text-xs gap-1.5 bg-primary text-primary-foreground"
              >
                {saving && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                <span>{editingFaq ? "Save Changes" : "Create FAQ"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Delete this FAQ?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This will remove the question from both the public FAQ page and Contact section. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete FAQ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
