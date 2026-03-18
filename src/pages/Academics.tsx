import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FileText, Calendar, GraduationCap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

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
              <TabsTrigger value="batches" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-600 dark:text-slate-400 gap-1.5 text-xs md:text-sm">
                <BookOpen className="h-4 w-4" /> Batch-wise Resources
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

          <TabsContent value="batches">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <SectionHeading title="Batch-wise Syllabus & Resources" description="Access syllabus and resources for your batch." />
              <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[2021, 2022, 2023, 2024, 2025, 2026].map(year => {
                  if (settings[`academics_batch_${year}_enabled`] !== "true") return null;
                  const pdfKey = `academics_batch_${year}_syllabus_pdf`;
                  const resPdfKey = `academics_batch_${year}_resources_pdf`;
                  const resMediaKey = `academics_batch_${year}_resources_media`;
                  return (
                    <Card key={year}>
                      <CardHeader><CardTitle>Batch {year}</CardTitle></CardHeader>
                      <CardContent className="flex flex-col gap-2">
                        {settings[pdfKey] && (
                          <Button asChild variant="outline" size="sm">
                            <a href={settings[pdfKey]} target="_blank" rel="noopener noreferrer">
                              <FileText className="mr-2 h-4 w-4" /> Syllabus PDF
                            </a>
                          </Button>
                        )}
                        {settings[resPdfKey] && (
                          <Button asChild variant="outline" size="sm">
                            <a href={settings[resPdfKey]} target="_blank" rel="noopener noreferrer">
                              <FileText className="mr-2 h-4 w-4" /> Resource PDF
                            </a>
                          </Button>
                        )}
                        {settings[resMediaKey] && (
                          <Button asChild variant="outline" size="sm">
                            <a href={settings[resMediaKey]} target="_blank" rel="noopener noreferrer">
                              <BookOpen className="mr-2 h-4 w-4" /> Media
                            </a>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
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
