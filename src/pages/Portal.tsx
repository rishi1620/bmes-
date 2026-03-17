import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import Markdown from "react-markdown";
import { generateStudyMaterial } from "@/services/geminiService";
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
}

interface SoftwareLink {
  title: string;
  url: string;
  description: string;
}

const Portal = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const location = useLocation();
  const [, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState<"all" | "image" | "pdf" | "video">("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [resources, setResources] = useState<Resource[]>([]);

  const fetchResources = useCallback(async () => {
    const { data, error } = await supabase.storage
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
      console.log("Portal loading settings...");
      await supabase.from("site_settings").select("*").eq("setting_group", "portal_page").then(({ data }) => {
        console.log("Portal settings fetched:", data);
        const map: Record<string, string> = {};
        data?.forEach((s) => { map[s.setting_key] = s.setting_value || ""; });
        setSettings(map);
      });
      await fetchResources();
      setLoading(false);
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
      const result = await generateStudyMaterial(aiPrompt);
      setAiResult(result || "No content generated.");
      toast.success("Study material generated!");
    } catch {
      toast.error("Failed to generate content. Please try again.");
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

  const customTables = (() => {
    try {
      return JSON.parse(settings.portal_custom_tables_json || "[]");
    } catch {
      return [];
    }
  })();

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
  }, [settings.portal_resource_semesters_json]);

  const filteredResources = resources.filter(res => {
    const matchesSearch = res.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = fileTypeFilter === "all" || 
      (fileTypeFilter === "image" && res.file_type.includes("image")) ||
      (fileTypeFilter === "pdf" && res.file_type.includes("pdf")) ||
      (fileTypeFilter === "video" && res.file_type.includes("video"));
    
    const semester = resourceSemesters[res.file_name];
    console.log(`Resource: ${res.file_name}, Semester: ${semester}, Filter: ${semesterFilter}`);
    
    const matchesSemester = semesterFilter === "all" || (semester === semesterFilter);
    return matchesSearch && matchesType && matchesSemester;
  });

  return (
    <PageLayout>
      <section className="relative overflow-hidden bg-slate-950 py-20 text-white md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)]" />
        <div className="container relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              Student Portal & Resources
            </span>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              {settings.portal_hero_title || "Academic Hub"}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed">
              {settings.portal_hero_subtitle || "Your central destination for lecture notes, software, and AI-powered study assistance."}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container -mt-12 pb-24">
        <Tabs defaultValue="library" className="w-full">
          <div className="flex justify-center">
            <TabsList className="h-auto flex-wrap justify-center gap-2 bg-slate-900/50 p-1.5 backdrop-blur-sm border border-slate-800 rounded-2xl">
              <TabsTrigger value="library" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                <BookOpen className="mr-2 h-4 w-4" /> Library
              </TabsTrigger>
              <TabsTrigger value="generate" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                <Sparkles className="mr-2 h-4 w-4" /> AI Assistant
              </TabsTrigger>
              <TabsTrigger value="notices" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                <Bell className="mr-2 h-4 w-4" /> Notices
              </TabsTrigger>
              <TabsTrigger value="software" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                <Download className="mr-2 h-4 w-4" /> Software
              </TabsTrigger>
              <TabsTrigger value="membership" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
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
                        <Filter className="h-5 w-5 text-slate-400" />
                        Search & Filter
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input 
                          placeholder="Search resources..." 
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {(["all", "image", "pdf", "video"] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => setFileTypeFilter(type)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              fileTypeFilter === type
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {type.toUpperCase()}
                          </button>
                        ))}
                      </div>
                      <div className="mt-4">
                        <Label className="text-xs text-slate-500 mb-2 block">Semester</Label>
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
                        <Card key={res.id} className="group overflow-hidden border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all">
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
                                <p className="text-xs text-slate-500 mt-1">
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
                        <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-4">
                          <BookOpen className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500">No resources found matching your search.</p>
                      </div>
                    )}
                  </div>

                  {customTables.length > 0 && (
                    <div className="mt-16 space-y-12">
                      {customTables.map((table: any) => (
                        <div key={table.id} className="space-y-6">
                          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">{table.title}</h3>
                          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                                  <TableRow>
                                    {table.headers.map((h: string, i: number) => (
                                      <TableHead key={i} className="font-semibold text-slate-700 dark:text-slate-300">{h}</TableHead>
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
                      </div>
                      <Button 
                        onClick={handleGenerate} 
                        disabled={generating}
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
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800">
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
              <SectionHeading title="Notice Board" description={settings.portal_notices_content || "Official announcements and academic updates."} />
              <div className="mt-10 grid gap-6 md:grid-cols-2">
                {notices.length > 0 ? (
                  notices.map((notice: Notice, i: number) => (
                    <Card key={i} className="group hover:border-emerald-500/30 transition-all">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                            Official
                          </span>
                          <span className="text-xs text-slate-500">{notice.date}</span>
                        </div>
                        <CardTitle className="group-hover:text-emerald-500 transition-colors">{notice.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{notice.content}</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center">
                    <Bell className="mx-auto h-12 w-12 text-slate-200 mb-4" />
                    <p className="text-slate-500">No active notices at this time.</p>
                  </div>
                )}
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
                        <p className="text-slate-600 dark:text-slate-400 text-sm">{item.description}</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  ["MATLAB", "SolidWorks", "LabVIEW"].map((name) => (
                    <Card key={name}>
                      <CardHeader><CardTitle>{name}</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">Standard engineering software for CUET BMES students.</p>
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
                    <div className="flex flex-col items-center gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-sm text-slate-500 font-medium">Ready to take the next step?</p>
                      <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-12">
                        <a href={settings.portal_membership_url || "#"} target="_blank" rel="noopener noreferrer">
                          Register Now
                        </a>
                      </Button>
                    </div>
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
