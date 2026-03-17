import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Bell, 
  BookOpen, 
  Download, 
  UserPlus, 
  ExternalLink, 
  Sparkles, 
  FileText, 
  Image as ImageIcon,
  Loader2,
  Filter,
  Upload,
  Calendar,
  ChevronRight,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { MembershipRegistrationForm } from "@/components/shared/MembershipRegistrationForm";
import Markdown from "react-markdown";
import { generateStudyMaterial } from "@/services/geminiService";
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { motion } from "framer-motion";

interface Resource {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

interface Notice {
  title: string;
  content: string;
  date: string;
  category?: "departmental" | "club";
}

interface SoftwareLink {
  title: string;
  url: string;
  description: string;
}

interface CustomTable {
  id: string;
  title: string;
  headers: string[];
  rows: string[][];
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
  const [fileTypeFilter, setFileTypeFilter] = useState<"all" | "image" | "pdf" | "video">("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [resources, setResources] = useState<Resource[]>([]);
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
    const { data } = await supabase.storage
      .from("media")
      .list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    
    if (data) {
      const mappedResources = data
        .filter(file => file.name !== ".emptyFolderPlaceholder")
        .map(file => {
          const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(file.name);
          return {
            id: file.id,
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.metadata?.mimetype || "unknown",
            file_size: file.metadata?.size || 0,
            created_at: file.created_at
          };
        });
      setResources(mappedResources);
    }
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

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a topic or question.");
      return;
    }

    setGenerating(true);
    try {
      const result = await generateStudyMaterial(aiPrompt, fileContent);
      setAiResult(result || "No content generated.");
      toast.success("Study material generated!");
    } catch (error) {
      console.error("AI Generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "The AI service might be temporarily unavailable.";
      toast.error(`Failed to generate content: ${errorMessage}`);
    } finally {
      setGenerating(false);
    }
  };

  const softwareLinks = (() => {
    try {
      return JSON.parse(settings.portal_software_json || "[]");
    } catch {
      return [];
    }
  })();

  const customTables: CustomTable[] = useMemo(() => {
    try {
      return JSON.parse(settings.portal_custom_tables_json || "[]");
    } catch {
      return [];
    }
  }, [settings.portal_custom_tables_json]);

  const notices = (() => {
    try {
      return JSON.parse(settings.portal_notices_json || "[]");
    } catch {
      return [];
    }
  })();

  const resourceSemesters = useMemo(() => {
    try {
      console.log("Portal settings:", settings);
      const parsed = JSON.parse(settings.portal_resource_semesters_json || "{}");
      console.log("Parsed resourceSemesters:", parsed);
      return parsed;
    } catch (e) {
      console.error("Error parsing resourceSemesters:", e);
      return {};
    }
  }, [settings]);

  const filteredResources = resources.filter(res => {
    const matchesType = fileTypeFilter === "all" || 
      (fileTypeFilter === "image" && res.file_type.includes("image")) ||
      (fileTypeFilter === "pdf" && res.file_type.includes("pdf")) ||
      (fileTypeFilter === "video" && res.file_type.includes("video"));
    
    const semester = resourceSemesters[res.file_name];
    console.log(`Resource: ${res.file_name}, Semester: ${semester}, Filter: ${semesterFilter}`);
    
    const matchesSemester = semesterFilter === "all" || (semester === semesterFilter);
    return matchesType && matchesSemester;
  });

  return (
    <PageLayout>
      <section className="hero-gradient py-16 md:py-24">
        <div className="container text-center">
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
              <TabsTrigger value="notices" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-600 dark:text-slate-400">
                <Bell className="mr-2 h-4 w-4" /> Notices
              </TabsTrigger>
              <TabsTrigger value="software" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-600 dark:text-slate-400">
                <Download className="mr-2 h-4 w-4" /> Software
              </TabsTrigger>
              <TabsTrigger value="membership" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-600 dark:text-slate-400">
                <UserPlus className="mr-2 h-4 w-4" /> Membership
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-12">
            <TabsContent value="library" className="space-y-8">
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-1 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-muted-foreground" />
                        Search & Filter
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2 mt-4">
                        {(["all", "image", "pdf", "video"] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => setFileTypeFilter(type)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              fileTypeFilter === type
                                ? "bg-emerald-500 text-white"
                                : "bg-muted text-muted-foreground hover:bg-accent"
                            }`}
                          >
                            {type.toUpperCase()}
                          </button>
                        ))}
                      </div>
                      <div className="mt-4">
                        <Label className="text-xs text-muted-foreground mb-2 block">Semester</Label>
                        <select 
                          className="w-full text-sm border rounded p-2"
                          value={semesterFilter}
                          onChange={(e) => setSemesterFilter(e.target.value)}
                        >
                          <option value="all">All Semesters</option>
                          {[1, 2, 3, 4].map(level => [1, 2].map(term => (
                            <option key={`${level}-${term}`} value={`Level-${level} Term-${term}`}>Level-{level} Term-{term}</option>
                          )))}
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-2">
                  <SectionHeading title="Resource Library" description={settings.portal_library_content || "Access lecture notes, reference books, and question banks."} />
                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    {filteredResources.length > 0 ? (
                      filteredResources.map((res) => (
                        <Card key={res.id} className="group overflow-hidden border-border hover:border-emerald-500/50 transition-all">
                          <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                              <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-500">
                                {res.file_type.includes("image") ? (
                                  <ImageIcon className="h-6 w-6" />
                                ) : (
                                  <FileText className="h-6 w-6" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate">{res.file_name}</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {(res.file_size / 1024 / 1024).toFixed(2)} MB • {new Date(res.created_at).toLocaleDateString()}
                                </p>
                                <Button asChild variant="link" className="h-auto p-0 mt-3 text-emerald-500 hover:text-emerald-600">
                                  <a href={res.file_url} target="_blank" rel="noopener noreferrer">
                                    <Download className="mr-2 h-4 w-4" /> Download
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-full py-12 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                          <BookOpen className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                        <p className="text-muted-foreground">No resources found matching your search.</p>
                      </div>
                    )}
                  </div>

                  {customTables.length > 0 && (
                    <div className="mt-16 space-y-12">
                      {customTables.map((table: CustomTable) => (
                        <div key={table.id} className="space-y-6">
                          <h3 className="text-xl font-semibold text-foreground">{table.title}</h3>
                          <div className="rounded-xl border border-border overflow-hidden bg-card">
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader className="bg-muted/50">
                                  <TableRow>
                                    {table.headers.map((h: string, i: number) => (
                                      <TableHead key={i} className="font-semibold text-foreground">{h}</TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {table.rows.map((row: string[], i: number) => (
                                    <TableRow key={i}>
                                      {row.map((cell: string, j: number) => (
                                        <TableCell key={j}>
                                          {cell.startsWith('http') ? (
                                            <a href={cell} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline inline-flex items-center gap-1">
                                              Link <ExternalLink className="h-3 w-3" />
                                            </a>
                                          ) : (
                                            cell
                                          )}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="generate">
              <div className="mx-auto max-w-4xl space-y-8">
                <SectionHeading 
                  title="AI Study Assistant" 
                  description="Generate study summaries, key concepts, or exam preparation plans using advanced AI." 
                />
                
                <Card className="border-emerald-500/20 shadow-xl shadow-emerald-500/5">
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">What would you like to generate?</label>
                        <Textarea 
                          placeholder="e.g., Generate a summary of Biomedical Instrumentation principles or a 1-week study plan for Bio-signal Processing."
                          className="min-h-[120px] resize-none border-slate-200 dark:border-slate-800 focus:ring-emerald-500"
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                        />
                        <div className="flex items-center gap-4">
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => document.getElementById('pdf-upload')?.click()}
                            disabled={uploading}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {fileName ? fileName : "Upload Lecture Notes (PDF)"}
                          </Button>
                          <input 
                            id="pdf-upload" 
                            type="file" 
                            accept="application/pdf" 
                            className="hidden" 
                            onChange={handleFileUpload} 
                          />
                        </div>
                      </div>
                      <Button 
                        onClick={handleGenerate} 
                        disabled={generating || uploading}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 text-lg font-semibold"
                      >
                        {generating ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            Generate Study Material
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {aiResult && (
                  <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardHeader className="border-b border-border">
                      <CardTitle className="flex items-center gap-2 text-emerald-500">
                        <Sparkles className="h-5 w-5" />
                        Generated Content
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="prose dark:prose-invert max-w-none">
                        <Markdown>{aiResult}</Markdown>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="notices">
              <SectionHeading title="Latest Announcements" description={settings.portal_notices_content || "Stay updated with the latest departmental and club news."} />
              
              <div className="mt-10 grid gap-8 md:grid-cols-2">
                {/* Departmental Notices */}
                <Card className="overflow-hidden border-border bg-card shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3 text-slate-900 dark:text-slate-100">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-2xl font-bold">Departmental Notices</CardTitle>
                    </div>
                    <Button variant="link" className="text-emerald-500 gap-1 p-0 h-auto font-medium">
                      View All <ChevronRight className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {notices.filter((n: Notice) => n.category === "departmental" || !n.category).length > 0 ? (
                      notices
                        .filter((n: Notice) => n.category === "departmental" || !n.category)
                        .slice(0, 5)
                        .map((notice: Notice, i: number) => (
                          <div key={i} className="group cursor-pointer">
                            <h3 className="font-semibold text-lg group-hover:text-emerald-500 transition-colors line-clamp-1">{notice.title}</h3>
                            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              <span className="text-sm">{notice.date}</span>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-muted-foreground text-sm italic">No departmental notices found.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Club News */}
                <Card className="overflow-hidden border-border bg-card shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 text-emerald-600 dark:text-emerald-400">
                        <Users className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-2xl font-bold">Club News</CardTitle>
                    </div>
                    <Button variant="link" className="text-emerald-500 gap-1 p-0 h-auto font-medium">
                      View All <ChevronRight className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {notices.filter((n: Notice) => n.category === "club").length > 0 ? (
                      notices
                        .filter((n: Notice) => n.category === "club")
                        .slice(0, 5)
                        .map((notice: Notice, i: number) => (
                          <div key={i} className="group cursor-pointer">
                            <h3 className="font-semibold text-lg group-hover:text-emerald-500 transition-colors line-clamp-1">{notice.title}</h3>
                            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              <span className="text-sm">{notice.date}</span>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-muted-foreground text-sm italic">No club news found.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="software">
              <SectionHeading title="Engineering Software" description="Licensed software and tools for BMES students." />
              <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {softwareLinks.length > 0 ? (
                  softwareLinks.map((item: SoftwareLink, i: number) => (
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
                  ["MATLAB", "SolidWorks", "LabVIEW"].map((name) => (
                    <Card key={name}>
                      <CardHeader><CardTitle>{name}</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm">Standard engineering software for CUET BMES students.</p>
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
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </section>
    </PageLayout>
  );
};

export default Portal;
