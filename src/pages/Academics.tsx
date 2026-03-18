import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Calendar, GraduationCap, Download, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BatchResource {
  id: string;
  title: string;
  category: "calendar" | "routine" | "exam";
  batch: string;
  semester?: string;
  fileUrl: string;
  fileType: "pdf" | "image" | "link";
}

const ResourceSection = ({ 
  title, 
  icon: Icon, 
  category, 
  resources,
  defaultUrl
}: { 
  title: string; 
  icon: React.ElementType; 
  category: "calendar" | "routine" | "exam"; 
  resources: BatchResource[];
  defaultUrl?: string;
}) => {
  const categoryResources = resources.filter(r => r.category === category);
  
  // Get unique batches, sorted descending
  const batches = useMemo(() => {
    const uniqueBatches = Array.from(new Set(categoryResources.map(r => r.batch)));
    return uniqueBatches.sort((a, b) => b.localeCompare(a));
  }, [categoryResources]);

  const [selectedBatch, setSelectedBatch] = useState<string>(batches[0] || "");
  const [selectedSemesterState, setSelectedSemesterState] = useState<string>("all");

  const availableSemesters = useMemo(() => {
    const resourcesForBatch = categoryResources.filter(r => r.batch === selectedBatch);
    const sems = new Set(resourcesForBatch.map(r => r.semester).filter(Boolean) as string[]);
    return Array.from(sems).sort();
  }, [categoryResources, selectedBatch]);

  const selectedSemester = availableSemesters.includes(selectedSemesterState) ? selectedSemesterState : "all";

  const filteredResources = categoryResources.filter(r => {
    const matchBatch = r.batch === selectedBatch;
    const matchSemester = selectedSemester === "all" ? true : (r.semester === selectedSemester || !r.semester);
    return matchBatch && matchSemester;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'link': return <LinkIcon className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="flex flex-col items-center p-6 text-center flex-1">
        <Icon className="h-10 w-10 text-primary mb-4" />
        <h3 className="font-semibold text-lg">{title}</h3>
        
        {batches.length > 0 ? (
          <div className="w-full mt-6 flex flex-col flex-1">
            <ScrollArea className="w-full whitespace-nowrap mb-4">
              <div className="flex w-max space-x-2 p-1 mx-auto">
                {batches.map(batch => (
                  <Button
                    key={batch}
                    variant={selectedBatch === batch ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedBatch(batch)}
                    className="rounded-full px-4"
                  >
                    {batch}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>

            {availableSemesters.length > 0 && (
              <div className="mb-4">
                <Select value={selectedSemester} onValueChange={setSelectedSemesterState}>
                  <SelectTrigger className="w-full text-sm h-9">
                    <SelectValue placeholder="Select Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    {availableSemesters.map(sem => (
                      <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3 w-full mt-2 flex-1">
              {filteredResources.length > 0 ? (
                filteredResources.map(resource => (
                  <div key={resource.id} className="flex flex-col gap-3 p-4 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-all text-left">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2.5 rounded-lg text-primary shrink-0 mt-0.5">
                        {getFileIcon(resource.fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">{resource.title}</h4>
                        {resource.semester && (
                          <span className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {resource.semester}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button asChild variant="secondary" size="sm" className="w-full mt-1">
                      <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-3.5 w-3.5" /> 
                        {resource.fileType === 'link' ? 'Open Link' : 'Download'}
                      </a>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-border rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                  <FileText className="h-8 w-8 text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium text-foreground">No resources found</p>
                  <p className="text-xs text-muted-foreground mt-1">There are no {title.toLowerCase()} available for this batch.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-6 flex-1 flex flex-col justify-center items-center w-full">
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-border rounded-xl bg-slate-50/50 dark:bg-slate-900/20 w-full">
              <FileText className="h-8 w-8 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground">No resources found</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">There are no {title.toLowerCase()} available yet.</p>
              
              {defaultUrl && (
                <Button asChild variant="outline" size="sm">
                  <a href={defaultUrl} target="_blank" rel="noopener noreferrer">
                    View General {title}
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Academics = () => {
  const { data: settings = {}, isLoading } = useQuery({
    queryKey: ["academics-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("setting_group", "academics_page");
      const map: Record<string, string> = {};
      data?.forEach((s) => { map[s.setting_key] = s.setting_value || ""; });
      return map;
    },
  });

  const batchResources: BatchResource[] = useMemo(() => {
    if (!settings.academics_batch_resources) return [];
    try {
      return JSON.parse(settings.academics_batch_resources);
    } catch (e) {
      console.error("Failed to parse batch resources", e);
      return [];
    }
  }, [settings.academics_batch_resources]);

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <section className="hero-gradient py-16 md:py-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container text-center"
        >
          <span className="mb-3 inline-block rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground/90">
            Academics
          </span>
          <h1 className="text-4xl font-extrabold text-primary-foreground md:text-5xl">
            {settings.academics_hero_title || "BME Curriculum & Resources"}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80 leading-relaxed">
            {settings.academics_hero_subtitle || "Explore our undergraduate and postgraduate programs, syllabus, and academic resources."}
          </p>
        </motion.div>
      </section>

      <section className="container py-16">
        <Tabs defaultValue="undergrad" className="w-full">
          <div className="flex justify-center mb-10">
            <TabsList className="h-auto flex-wrap justify-center gap-2 bg-slate-200/50 dark:bg-slate-900/50 p-1.5 backdrop-blur-sm border border-slate-300/50 dark:border-slate-800 rounded-2xl">
              <TabsTrigger value="undergrad" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-600 dark:text-slate-400 gap-1.5 text-xs md:text-sm">
                <GraduationCap className="h-4 w-4" /> B.Sc. Program
              </TabsTrigger>
              <TabsTrigger value="syllabus" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-600 dark:text-slate-400 gap-1.5 text-xs md:text-sm">
                <BookOpen className="h-4 w-4" /> Syllabus
              </TabsTrigger>
              <TabsTrigger value="resources" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-600 dark:text-slate-400 gap-1.5 text-xs md:text-sm">
                <FileText className="h-4 w-4" /> Resources
              </TabsTrigger>
              <TabsTrigger value="postgrad" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-600 dark:text-slate-400 gap-1.5 text-xs md:text-sm">
                <GraduationCap className="h-4 w-4" /> Postgrad
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="undergrad">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <SectionHeading title="Undergraduate Program (B.Sc.)" description="Program overview, admission requirements, and grading system." />
              <div className="mt-10 grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Program Overview</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {settings.academics_undergrad_overview || "The B.Sc. in Biomedical Engineering is a 4-year program designed to bridge the gap between engineering and medicine."}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Admission Requirements</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {settings.academics_undergrad_admission || "Admission is based on the central admission test for engineering universities in Bangladesh."}
                    </p>
                  </CardContent>
                </Card>
              </div>
              {settings.academics_undergrad_pdf_url && (
                <div className="mt-8 flex justify-center">
                  <a 
                    href={settings.academics_undergrad_pdf_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Download Undergraduate Guidelines PDF
                  </a>
                </div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="syllabus">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <SectionHeading title="Syllabus & Curriculum" description="Term-by-term breakdown of courses." />
              <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, l) => 
                  Array.from({ length: 2 }, (_, t) => {
                    const pdfKey = `academics_syllabus_l${l + 1}t${t + 1}_pdf`;
                    const mediaKey = `academics_syllabus_l${l + 1}t${t + 1}_media`;
                    return (
                      <Card key={`${l}-${t}`}>
                        <CardHeader><CardTitle className="text-lg">Level {l + 1} Term {t + 1}</CardTitle></CardHeader>
                        <CardContent className="flex flex-col gap-2">
                          {settings[pdfKey] && (
                            <Button asChild variant="outline" size="sm">
                              <a href={settings[pdfKey]} target="_blank" rel="noopener noreferrer">
                                <FileText className="mr-2 h-4 w-4" /> Syllabus PDF
                              </a>
                            </Button>
                          )}
                          {settings[mediaKey] && (
                            <Button asChild variant="outline" size="sm">
                              <a href={settings[mediaKey]} target="_blank" rel="noopener noreferrer">
                                <BookOpen className="mr-2 h-4 w-4" /> Media
                              </a>
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                ).flat()}
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="resources">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <SectionHeading title="Academic Resources" description="Downloadable academic calendar, class routine, and exam schedules." />
              <div className="mt-10 grid gap-6 md:grid-cols-3 items-start">
                <ResourceSection 
                  title="Academic Calendar" 
                  icon={Calendar} 
                  category="calendar" 
                  resources={batchResources}
                  defaultUrl={settings.academics_calendar_url}
                />
                <ResourceSection 
                  title="Class Routine" 
                  icon={FileText} 
                  category="routine" 
                  resources={batchResources}
                  defaultUrl={settings.academics_routine_url}
                />
                <ResourceSection 
                  title="Exam Schedule" 
                  icon={BookOpen} 
                  category="exam" 
                  resources={batchResources}
                  defaultUrl={settings.academics_exam_url}
                />
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="postgrad">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <SectionHeading title="Postgraduate Program" description="M.Sc./Ph.D. guidelines." />
              <div className="mt-10">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-center text-muted-foreground whitespace-pre-wrap mb-4">
                      {settings.academics_postgrad_content || "Postgraduate program details will be announced soon."}
                    </p>
                    {settings.academics_postgrad_pdf_url && (
                      <div className="flex justify-center">
                        <a 
                          href={settings.academics_postgrad_pdf_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Download Postgraduate Guidelines PDF
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </section>
    </PageLayout>
  );
};

export default Academics;
