import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Image, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Activities = () => {
  const { data: settings = {}, isLoading } = useQuery({
    queryKey: ["activities-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("setting_group", "activities_page");
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

  const flagshipEvents = (() => {
    try { return JSON.parse(settings.activities_flagship_json || "[]"); }
    catch { return []; }
  })();

  const seminars = (() => {
    try { return JSON.parse(settings.activities_seminars_json || "[]"); }
    catch { return []; }
  })();

  return (
    <PageLayout>
      <section className="hero-gradient py-16 md:py-24">
        <div className="container text-center">
          <span className="mb-3 inline-block rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground/90">
            BMES Activities & Events
          </span>
          <h1 className="text-4xl font-extrabold text-primary-foreground md:text-5xl">
            {settings.activities_hero_title || "The Vibrant Side of BME"}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80 leading-relaxed">
            {settings.activities_hero_subtitle || "Showcasing student life, flagship events, seminars, workshops, and publications."}
          </p>
        </div>
      </section>

      <section className="container py-16">
        <Tabs defaultValue="flagship" className="w-full">
          <TabsList className="mx-auto mb-10 grid w-full max-w-2xl grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="flagship" className="gap-1.5 text-xs md:text-sm"><Calendar className="h-4 w-4" /> Flagship</TabsTrigger>
            <TabsTrigger value="seminars" className="gap-1.5 text-xs md:text-sm"><Users className="h-4 w-4" /> Seminars</TabsTrigger>
            <TabsTrigger value="gallery" className="gap-1.5 text-xs md:text-sm"><Image className="h-4 w-4" /> Gallery</TabsTrigger>
            <TabsTrigger value="publications" className="gap-1.5 text-xs md:text-sm"><BookOpen className="h-4 w-4" /> Publications</TabsTrigger>
          </TabsList>

          <TabsContent value="flagship">
            <SectionHeading title="Flagship Events" description="Dedicated sub-pages for major events like BME Fest, Med-Tech Hackathons, or Job Fairs." />
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {flagshipEvents.length > 0 ? (
                flagshipEvents.map((event: { title: string; description: string }, i: number) => (
                  <Card key={i}>
                    <CardHeader><CardTitle>{event.title}</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p></CardContent>
                  </Card>
                ))
              ) : (
                <>
                  <Card>
                    <CardHeader><CardTitle>BME Fest</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">Annual festival celebrating biomedical engineering with project showcases and cultural events.</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Med-Tech Hackathon</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">A 48-hour challenge to build innovative healthcare solutions.</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Job Fair</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">Connecting students with top medical device companies and hospitals.</p></CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="seminars">
            <SectionHeading title="Seminars & Workshops" description="Archives of past skill-development sessions." />
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {seminars.length > 0 ? (
                seminars.map((seminar: { title: string; description: string }, i: number) => (
                  <Card key={i}>
                    <CardHeader><CardTitle>{seminar.title}</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground whitespace-pre-wrap">{seminar.description}</p></CardContent>
                  </Card>
                ))
              ) : (
                <>
                  <Card>
                    <CardHeader><CardTitle>Python for Healthcare</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">A hands-on workshop on data analysis and machine learning in medicine.</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Medical Imaging Workshop</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">Understanding MRI, CT, and Ultrasound image processing.</p></CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="gallery">
            <SectionHeading title="Gallery" description="Organized photo and video albums of tours, cultural events, and competitions." />
            <div className="mt-10">
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground whitespace-pre-wrap">
                    {settings.activities_gallery_content || "Gallery will be updated shortly."}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="publications">
            <SectionHeading title="Publications/Magazine" description="Digital copies of the annual club magazine, newsletters, or student-written articles." />
            <div className="mt-10">
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground whitespace-pre-wrap mb-4">
                    {settings.activities_publications_content || "Magazine and newsletters will be available soon."}
                  </p>
                  {settings.activities_publications_pdf_url && (
                    <div className="flex justify-center">
                      <a 
                        href={settings.activities_publications_pdf_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                      >
                        Download PDF
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

export default Activities;
