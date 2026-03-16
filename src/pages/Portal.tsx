import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Bell, 
  BookOpen, 
  Download, 
  UserPlus, 
  ExternalLink, 
  Sparkles, 
  Upload, 
  FileText, 
  Loader2,
  Search,
  Filter
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import Markdown from "react-markdown";
import { generateStudyMaterial } from "@/services/geminiService";

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
  const [, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);

  const fetchResources = useCallback(async () => {
    const { data } = await supabase
      .from("media_library")
      .select("*")
      .order("created_at", { ascending: false });
    
    setResources(data || []);
  }, []);

  useEffect(() => {
    const load = async () => {
      await supabase.from("site_settings").select("*").eq("setting_group", "portal_page").then(({ data }) => {
        const map: Record<string, string> = {};
        data?.forEach((s) => { map[s.setting_key] = s.setting_value || ""; });
        setSettings(map);
      });
      await fetchResources();
      setLoading(false);
    };
    load();
  }, [fetchResources]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `resources/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(filePath);

      // Save to media_library table
      const { error: dbError } = await supabase.from("media_library").insert({
        file_name: file.name,
        file_url: publicUrl,
        file_type: "pdf",
        file_size: file.size,
        folder: "Student Resources"
      });

      if (dbError) throw dbError;

      toast.success("File uploaded successfully!");
      fetchResources();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to upload file.";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }, [fetchResources]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false
  });

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

  const notices = (() => {
    try {
      return JSON.parse(settings.portal_notices_json || "[]");
    } catch {
      return [];
    }
  })();

  const filteredResources = resources.filter(res => 
    res.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  <Card className="border-emerald-500/20 bg-emerald-500/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-emerald-500" />
                        Upload Resource
                      </CardTitle>
                      <CardDescription>
                        Share study materials with the community.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div 
                        {...getRootProps()} 
                        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                          isDragActive ? "border-emerald-500 bg-emerald-500/10" : "border-slate-200 dark:border-slate-800 hover:border-emerald-500/50"
                        }`}
                      >
                        <input {...getInputProps()} />
                        {uploading ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                            <p className="text-sm font-medium">Uploading PDF...</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="h-8 w-8 text-slate-400" />
                            <p className="text-sm font-medium">Click or drag PDF here</p>
                            <p className="text-xs text-slate-500">Max size 10MB</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

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
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-2">
                  <SectionHeading title="Resource Library" description="Access lecture notes, reference books, and question banks." />
                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    {filteredResources.length > 0 ? (
                      filteredResources.map((res) => (
                        <Card key={res.id} className="group overflow-hidden border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all">
                          <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                              <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-500">
                                <FileText className="h-6 w-6" />
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
              <SectionHeading title="Notice Board" description="Official announcements and academic updates." />
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
                      {settings.portal_membership_content || (
                        <>
                          <h3>Why Join CUET BMES?</h3>
                          <ul>
                            <li>Access to exclusive workshops and seminars.</li>
                            <li>Networking opportunities with industry professionals.</li>
                            <li>Participation in national and international competitions.</li>
                            <li>Access to premium study resources and research mentorship.</li>
                          </ul>
                        </>
                      )}
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
