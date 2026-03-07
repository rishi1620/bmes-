import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FileText, Calendar, GraduationCap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
        <div className="container text-center">
          <span className="mb-3 inline-block rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground/90">
            Academics
          </span>
          <h1 className="text-4xl font-extrabold text-primary-foreground md:text-5xl">
            {settings.academics_hero_title || "BME Curriculum & Resources"}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80 leading-relaxed">
            {settings.academics_hero_subtitle || "Explore our undergraduate and postgraduate programs, syllabus, and academic resources."}
          </p>
        </div>
      </section>

      <section className="container py-16">
        <Tabs defaultValue="undergrad" className="w-full">
          <TabsList className="mx-auto mb-10 grid w-full max-w-2xl grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="undergrad" className="gap-1.5 text-xs md:text-sm"><GraduationCap className="h-4 w-4" /> B.Sc. Program</TabsTrigger>
            <TabsTrigger value="syllabus" className="gap-1.5 text-xs md:text-sm"><BookOpen className="h-4 w-4" /> Syllabus</TabsTrigger>
            <TabsTrigger value="resources" className="gap-1.5 text-xs md:text-sm"><FileText className="h-4 w-4" /> Resources</TabsTrigger>
            <TabsTrigger value="postgrad" className="gap-1.5 text-xs md:text-sm"><GraduationCap className="h-4 w-4" /> Postgrad</TabsTrigger>
          </TabsList>

          <TabsContent value="undergrad">
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
          </TabsContent>

          <TabsContent value="syllabus">
            <SectionHeading title="Syllabus & Curriculum" description="Term-by-term breakdown of courses." />
            <div className="mt-10">
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground whitespace-pre-wrap mb-4">
                    {settings.academics_syllabus_content || "Syllabus details will be updated shortly."}
                  </p>
                  {settings.academics_syllabus_pdf_url && (
                    <div className="flex justify-center">
                      <a 
                        href={settings.academics_syllabus_pdf_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Download Syllabus PDF
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="resources">
            <SectionHeading title="Academic Resources" description="Downloadable academic calendar, class routine, and exam schedules." />
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <a href={settings.academics_calendar_url || "#"} target={settings.academics_calendar_url ? "_blank" : "_self"} rel="noopener noreferrer" className="block">
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <Calendar className="h-10 w-10 text-primary mb-4" />
                    <h3 className="font-semibold">Academic Calendar</h3>
                    <p className="text-sm text-muted-foreground mt-2">Current academic year schedule</p>
                  </CardContent>
                </Card>
              </a>
              <a href={settings.academics_routine_url || "#"} target={settings.academics_routine_url ? "_blank" : "_self"} rel="noopener noreferrer" className="block">
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <FileText className="h-10 w-10 text-primary mb-4" />
                    <h3 className="font-semibold">Class Routine</h3>
                    <p className="text-sm text-muted-foreground mt-2">Current term schedule</p>
                  </CardContent>
                </Card>
              </a>
              <a href={settings.academics_exam_url || "#"} target={settings.academics_exam_url ? "_blank" : "_self"} rel="noopener noreferrer" className="block">
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <BookOpen className="h-10 w-10 text-primary mb-4" />
                    <h3 className="font-semibold">Exam Schedule</h3>
                    <p className="text-sm text-muted-foreground mt-2">Upcoming examinations</p>
                  </CardContent>
                </Card>
              </a>
            </div>
          </TabsContent>

          <TabsContent value="postgrad">
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
          </TabsContent>
        </Tabs>
      </section>
    </PageLayout>
  );
};

export default Academics;
