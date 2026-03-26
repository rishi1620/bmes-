import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  BookOpen, 
  Download, 
  UserPlus, 
  ExternalLink, 
  Sparkles, 
  FileText, 
  Image as ImageIcon,
  Loader2,
  Upload,
  Search,
  ChevronRight,
  Film,
  History,
  Copy,
  Check,
  Brain,
  ListChecks,
  CalendarDays,
  HelpCircle,
  X
} from "lucide-react";
import { AcademicStructure } from "@/types/academic";
import { toast } from "sonner";
import { MembershipRegistrationForm } from "@/components/shared/MembershipRegistrationForm";
import { MemberDirectory } from "@/components/shared/MemberDirectory";
import Markdown from "react-markdown";
import { generateStudyMaterial, StudyMode } from "@/services/geminiService";
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

import { motion } from "framer-motion";

interface SoftwareLink {
  title: string;
  url: string;
  description: string;
}

const Portal = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const location = useLocation();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [activeTab, setActiveTab] = useState(queryParams.get("tab") || "library");

  useEffect(() => {
    const tab = queryParams.get("tab");
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [queryParams, activeTab]);

  const [, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [studyMode, setStudyMode] = useState<StudyMode>("general");
  const [aiHistory, setAiHistory] = useState<{id: string, title: string, content: string, date: string}[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      toast.error("Please upload a valid PDF file.");
      return;
    }
    setUploading(true);
    setFileName(file.name);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: unknown) => {
          if (typeof item === 'object' && item !== null && 'str' in item) {
            return (item as { str: string }).str;
          }
          return '';
        }).join(' ');
      }
      setFileContent(text);
      toast.success("PDF uploaded and parsed successfully!");
    } catch (error) {
      console.error("Error parsing PDF:", error);
      toast.error(error instanceof Error ? error.message : "Failed to parse PDF. Please ensure it's a readable document.");
    } finally {
      setUploading(false);
    }
  };

  const fetchResources = useCallback(async () => {
    // Resources are now managed via academicStructure
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        console.log("Portal loading settings...");
        const { data, error } = await supabase.from("site_settings").select("*").eq("setting_group", "portal_page");
        
        if (error) throw error;

        console.log("Portal settings fetched:", data);
        const map: Record<string, string> = {};
        data?.forEach((s) => { map[s.setting_key] = s.setting_value || ""; });
        setSettings(map);
        
        await fetchResources();
      } catch (error) {
        console.error("Error loading portal data:", error);
        toast.error("Failed to load some portal content. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchResources, location]);

  useEffect(() => {
    const savedHistory = localStorage.getItem("ai_study_history");
    if (savedHistory) {
      try {
        setAiHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse AI history", e);
      }
    }
  }, []);

  const saveToHistory = (title: string, content: string) => {
    const newItem = {
      id: Date.now().toString(),
      title: title || "Study Material",
      content,
      date: new Date().toISOString()
    };
    const updatedHistory = [newItem, ...aiHistory].slice(0, 10);
    setAiHistory(updatedHistory);
    localStorage.setItem("ai_study_history", JSON.stringify(updatedHistory));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(aiResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard!");
  };

  const handleGenerate = async (overrideMode?: StudyMode) => {
    const mode = overrideMode || studyMode;
    if (!aiPrompt.trim() && !fileContent) {
      toast.error("Please enter a topic or upload a PDF.");
      return;
    }

    setGenerating(true);
    try {
      const result = await generateStudyMaterial(aiPrompt || "Summarize this material", fileContent, mode);
      setAiResult(result || "No content generated.");
      saveToHistory(aiPrompt.substring(0, 30) || `${mode.charAt(0).toUpperCase() + mode.slice(1)} Summary`, result || "");
      toast.success("Study material generated!");
    } catch (error) {
      console.error("AI Generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "The AI service might be temporarily unavailable.";
      toast.error(`Failed to generate content: ${errorMessage}`);
    } finally {
      setGenerating(false);
    }
  };

  const softwareLinks = useMemo(() => {
    try {
      return JSON.parse(settings.portal_software_json || "[]") as SoftwareLink[];
    } catch {
      return [];
    }
  }, [settings.portal_software_json]);

  const academicStructure: AcademicStructure = useMemo(() => {
    try {
      return JSON.parse(settings.portal_academic_structure_json || '{"semesters": []}');
    } catch {
      return { semesters: [] };
    }
  }, [settings.portal_academic_structure_json]);

  const selectedSemester = academicStructure.semesters.find(s => s.id === selectedSemesterId);
  const selectedCourse = selectedSemester?.courses.find(c => c.id === selectedCourseId);

  const allTags = useMemo(() => {
    const tags = new Set<string>(["All"]);
    academicStructure.semesters.forEach(s => {
      s.courses.forEach(c => {
        c.resources.forEach(r => {
          r.tags.forEach(t => tags.add(t));
        });
      });
    });
    return Array.from(tags);
  }, [academicStructure]);

  const filteredResources = useMemo(() => {
    if (!selectedCourse) return [];
    return selectedCourse.resources.filter(res => {
      const matchesSearch = res.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = selectedTag === "All" || res.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [selectedCourse, searchQuery, selectedTag]);

  return (
    <PageLayout>
      <section className="hero-gradient py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <img 
            src={settings.portal_hero_bg_image || "https://mtibdsxdjvxtmvuhvsev.supabase.co/storage/v1/object/public/media/dna-background.png"} 
            alt="Background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="container text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="mb-3 inline-block rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground/90">
              Student Portal & Resources
            </span>
            <h1 className="text-4xl font-extrabold text-primary-foreground md:text-5xl">
              {settings.portal_hero_title || "Academic Hub"}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80 leading-relaxed">
              {settings.portal_hero_subtitle || "Your central destination for lecture notes, software, and AI-powered study assistance."}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container py-16">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center">
            <TabsList className="h-auto flex-wrap justify-center gap-2 bg-slate-200/50 dark:bg-slate-900/50 p-1.5 backdrop-blur-sm border border-slate-300/50 dark:border-slate-800 rounded-2xl">
              <TabsTrigger value="library" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-600 dark:text-slate-400">
                <BookOpen className="mr-2 h-4 w-4" /> Library
              </TabsTrigger>
              <TabsTrigger value="generate" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-600 dark:text-slate-400">
                <Sparkles className="mr-2 h-4 w-4" /> AI Assistant
              </TabsTrigger>
              <TabsTrigger value="software" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-600 dark:text-slate-400">
                <Download className="mr-2 h-4 w-4" /> Software
              </TabsTrigger>
              <TabsTrigger value="membership" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-600 dark:text-slate-400">
                <UserPlus className="mr-2 h-4 w-4" /> Membership
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-12">
            <TabsContent value="library" className="space-y-8">
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search resources..." 
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    {allTags.map(tag => (
                      <Button
                        key={tag}
                        variant={selectedTag === tag ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTag(tag)}
                        className="whitespace-nowrap rounded-full"
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {/* Sidebar Selectors */}
                  <div className="md:col-span-1 space-y-6">
                    <Card className="border-none shadow-none bg-transparent">
                      <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Semesters</CardTitle>
                      </CardHeader>
                      <CardContent className="px-0 space-y-2">
                        {academicStructure.semesters.map(semester => (
                          <Button
                            key={semester.id}
                            variant={selectedSemesterId === semester.id ? "default" : "ghost"}
                            className="w-full justify-between text-left h-auto py-3 px-4 group"
                            onClick={() => {
                              setSelectedSemesterId(semester.id);
                              setSelectedCourseId("");
                            }}
                          >
                            <span className="font-medium">{semester.name}</span>
                            <ChevronRight className={`h-4 w-4 transition-transform ${selectedSemesterId === semester.id ? 'rotate-90' : ''}`} />
                          </Button>
                        ))}
                        {academicStructure.semesters.length === 0 && (
                          <p className="text-sm text-muted-foreground italic px-4">No semesters available.</p>
                        )}
                      </CardContent>
                    </Card>

                    {selectedSemester && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground px-0 mb-2 block">Courses</Label>
                        <div className="space-y-1">
                          {selectedSemester.courses.map(course => (
                            <Button
                              key={course.id}
                              variant={selectedCourseId === course.id ? "secondary" : "ghost"}
                              className="w-full justify-start text-left h-auto py-2.5 px-4 rounded-lg"
                              onClick={() => setSelectedCourseId(course.id)}
                            >
                              <div className="flex flex-col items-start">
                                <span className="text-sm font-semibold">{course.name}</span>
                                {course.code && <span className="text-[10px] opacity-60">{course.code}</span>}
                              </div>
                            </Button>
                          ))}
                          {selectedSemester.courses.length === 0 && (
                            <p className="text-sm text-muted-foreground italic px-4">No courses in this semester.</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Content Area */}
                  <div className="md:col-span-3">
                    {!selectedCourse ? (
                      <div className="h-[400px] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-3xl bg-slate-50 dark:bg-slate-900/20">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                          <BookOpen className="h-10 w-10 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold">Explore the Library</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                          Select a semester and course from the sidebar to access lecture notes, reference materials, and more.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                                {selectedSemester?.name}
                              </span>
                              {selectedCourse.code && (
                                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                  {selectedCourse.code}
                                </span>
                              )}
                            </div>
                            <h2 className="text-3xl font-extrabold tracking-tight">{selectedCourse.name}</h2>
                          </div>
                          <div className="bg-emerald-500/5 px-4 py-2 rounded-2xl border border-emerald-500/10">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Resources Available</p>
                            <p className="text-2xl font-black text-emerald-600">{filteredResources.length}</p>
                          </div>
                        </div>

                        {filteredResources.length === 0 ? (
                          <div className="py-20 text-center bg-muted/10 rounded-3xl border border-dashed">
                            <p className="text-muted-foreground">No resources found matching your criteria.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredResources.map((res) => (
                              <motion.div
                                key={res.id}
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:border-emerald-500/30 transition-all duration-300"
                              >
                                <div className="p-5 flex items-start gap-4">
                                  <div className={`p-4 rounded-2xl transition-colors ${
                                    res.type === 'pdf' ? 'bg-red-50 text-red-500 dark:bg-red-900/20' :
                                    res.type === 'image' ? 'bg-blue-50 text-blue-500 dark:bg-blue-900/20' :
                                    res.type === 'video' ? 'bg-purple-50 text-purple-500 dark:bg-purple-900/20' :
                                    res.name.match(/\.(doc|docx)$/i) ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' :
                                    'bg-slate-50 text-slate-500 dark:bg-slate-900/20'
                                  }`}>
                                    {res.type === 'pdf' ? <FileText className="h-6 w-6" /> :
                                     res.type === 'image' ? <ImageIcon className="h-6 w-6" /> :
                                     res.type === 'video' ? <Film className="h-6 w-6" /> :
                                     res.name.match(/\.(doc|docx)$/i) ? <FileText className="h-6 w-6" /> :
                                     <ExternalLink className="h-6 w-6" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-500 transition-colors">
                                      {res.name}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 mt-1 font-medium">
                                      Added {new Date(res.created_at).toLocaleDateString()}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                      {res.tags.map(tag => (
                                        <span key={tag} className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <div className="px-5 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{res.type}</span>
                                  <a 
                                    href={res.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 hover:text-emerald-600 transition-colors"
                                  >
                                    <Download className="h-3.5 w-3.5" /> Download
                                  </a>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="generate">
              <div className="mx-auto max-w-5xl space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <SectionHeading 
                    title="AI Study Assistant" 
                    description="Advanced academic support powered by Gemini AI." 
                  />
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-full"
                      onClick={() => setShowHistory(!showHistory)}
                    >
                      <History className="mr-2 h-4 w-4" />
                      {showHistory ? "Hide History" : "View History"}
                    </Button>
                    {aiResult && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-full text-emerald-500 border-emerald-500/20"
                        onClick={copyToClipboard}
                      >
                        {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                        {copied ? "Copied" : "Copy Result"}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="border-emerald-500/20 shadow-xl shadow-emerald-500/5 overflow-hidden">
                      <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
                      <CardContent className="p-6 md:p-8">
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Study Goal</label>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className={`h-7 px-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${showHistory ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-emerald-500'}`}
                                  onClick={() => setShowHistory(!showHistory)}
                                >
                                  <History className="h-3 w-3 mr-1" />
                                  History
                                </Button>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">Powered by Gemini 3</span>
                            </div>
                            <Textarea 
                              placeholder="Describe what you're studying or paste a specific question..."
                              className="min-h-[140px] resize-none border-slate-200 dark:border-slate-800 focus:ring-emerald-500 rounded-2xl p-4 text-base leading-relaxed"
                              value={aiPrompt}
                              onChange={(e) => setAiPrompt(e.target.value)}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Context (Optional)</label>
                              <Button 
                                variant="outline" 
                                className={`w-full h-12 rounded-xl border-dashed ${fileName ? 'border-emerald-500 bg-emerald-50/30 text-emerald-600' : 'border-slate-300'}`}
                                onClick={() => document.getElementById('pdf-upload')?.click()}
                                disabled={uploading}
                              >
                                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                <span className="truncate max-w-[180px]">{fileName ? fileName : "Upload Lecture PDF"}</span>
                                {fileName && <X className="ml-2 h-3 w-3 hover:text-red-500" onClick={(e) => { e.stopPropagation(); setFileName(""); setFileContent(""); }} />}
                              </Button>
                              <input 
                                id="pdf-upload" 
                                type="file" 
                                accept="application/pdf" 
                                className="hidden" 
                                onChange={handleFileUpload} 
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Study Mode</label>
                              <select 
                                className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={studyMode}
                                onChange={(e) => setStudyMode(e.target.value as StudyMode)}
                              >
                                <option value="general">General Assistance</option>
                                <option value="summary">Concise Summary</option>
                                <option value="quiz">Practice Quiz</option>
                                <option value="concepts">Core Concepts</option>
                                <option value="plan">Study Schedule</option>
                                <option value="explain">Simplified Explanation</option>
                              </select>
                            </div>
                          </div>

                          <Button 
                            onClick={() => handleGenerate()} 
                            disabled={generating || uploading}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-14 text-lg font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                          >
                            {generating ? (
                              <>
                                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                Analyzing & Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-6 w-6" />
                                Generate Study Material
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {aiResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className="border-none shadow-2xl overflow-hidden rounded-3xl">
                          <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 px-8 py-6">
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-3 text-emerald-500 font-black tracking-tight">
                                <div className="p-2 rounded-xl bg-emerald-500/10">
                                  <Sparkles className="h-5 w-5" />
                                </div>
                                YOUR STUDY MATERIAL
                              </CardTitle>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="rounded-full" onClick={copyToClipboard}>
                                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-8 md:p-10">
                            <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:leading-relaxed prose-strong:text-emerald-500">
                              <Markdown>{aiResult}</Markdown>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Quick Actions</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          { mode: 'summary' as StudyMode, icon: <FileText className="h-4 w-4" />, label: "Summarize Notes", color: "bg-blue-500" },
                          { mode: 'quiz' as StudyMode, icon: <ListChecks className="h-4 w-4" />, label: "Create a Quiz", color: "bg-purple-500" },
                          { mode: 'concepts' as StudyMode, icon: <Brain className="h-4 w-4" />, label: "Extract Concepts", color: "bg-amber-500" },
                          { mode: 'plan' as StudyMode, icon: <CalendarDays className="h-4 w-4" />, label: "Study Schedule", color: "bg-emerald-500" },
                          { mode: 'explain' as StudyMode, icon: <HelpCircle className="h-4 w-4" />, label: "Explain Simply", color: "bg-rose-500" },
                        ].map((action) => (
                          <Button
                            key={action.mode}
                            variant="outline"
                            className="h-auto py-4 px-5 justify-start gap-4 rounded-2xl border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-50/30 transition-all group"
                            onClick={() => {
                              setStudyMode(action.mode);
                              handleGenerate(action.mode);
                            }}
                            disabled={generating}
                          >
                            <div className={`p-2.5 rounded-xl ${action.color} text-white shadow-lg shadow-${action.color.split('-')[1]}-500/20 group-hover:scale-110 transition-transform`}>
                              {action.icon}
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="font-bold text-sm">{action.label}</span>
                              <span className="text-[10px] text-slate-500 font-medium">One-click generation</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {showHistory && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                      >
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Recent History</h3>
                        <div className="space-y-3">
                          {aiHistory.length === 0 ? (
                            <p className="text-xs text-slate-500 italic p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed">No recent history found.</p>
                          ) : (
                            aiHistory.map((item) => (
                              <button
                                key={item.id}
                                className="w-full text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 hover:shadow-md transition-all group"
                                onClick={() => setAiResult(item.content)}
                              >
                                <p className="text-sm font-bold truncate group-hover:text-emerald-500 transition-colors">{item.title}</p>
                                <p className="text-[10px] text-slate-400 mt-1">{new Date(item.date).toLocaleDateString()}</p>
                              </button>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="software">
              <SectionHeading title="Engineering Software" description="Licensed software and tools for BMES students." />
              <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {softwareLinks.length > 0 ? (
                  softwareLinks.map((item, i: number) => (
                    <Card key={i} className="hover:shadow-lg transition-all">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          {item.title}
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:scale-110 transition-transform">
                            <ExternalLink className="h-5 w-5" />
                          </a>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm">{item.description}</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  [
                    { title: "MATLAB", url: "https://www.mathworks.com/products/matlab.html", description: "Numerical computing environment and programming language." },
                    { title: "SolidWorks", url: "https://www.solidworks.com/", description: "Solid modeling computer-aided design and engineering program." },
                    { title: "LabVIEW", url: "https://www.ni.com/en-us/shop/labview.html", description: "Systems engineering software for applications that require test, measurement, and control." }
                  ].map((item, i) => (
                    <Card key={i} className="hover:shadow-lg transition-all">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          {item.title}
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:scale-110 transition-transform">
                            <ExternalLink className="h-5 w-5" />
                          </a>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm">{item.description}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="membership">
              <div className="mx-auto max-w-3xl">
                <SectionHeading title="Join the Society" description="Become a part of the CUET Biomedical Engineering Society." />
                <Card className="mt-10 overflow-hidden">
                  <div className="h-2 bg-emerald-500" />
                  <CardContent className="p-8 space-y-8">
                    <div className="prose dark:prose-invert max-w-none">
                      <Markdown>
                        {settings.portal_membership_content || `
### Why Join CUET BMES?
- Access to exclusive workshops and seminars.
- Networking opportunities with industry professionals.
- Participation in national and international competitions.
- Access to premium study resources and research mentorship.
                        `}
                      </Markdown>
                    </div>
                    <div className="flex flex-col items-center gap-4 pt-6 border-t border-border">
                      <p className="text-sm text-muted-foreground font-medium">Ready to take the next step?</p>
                      <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-12" onClick={() => document.getElementById('registration-form')?.scrollIntoView({ behavior: 'smooth' })}>
                        Register Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card id="registration-form" className="mt-10 border-emerald-500/20 shadow-lg">
                  <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/10">
                    <CardTitle className="text-emerald-600">Membership Application</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <MembershipRegistrationForm />
                  </CardContent>
                </Card>

                <MemberDirectory />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </section>
    </PageLayout>
  );
};

export default Portal;
