import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, BookOpen, CalendarDays, MapPin, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

import { Tables } from "@/integrations/supabase/types";

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

  const { data: events = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ["upcoming-activities-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("is_upcoming", true)
        .order("date", { ascending: true })
        .limit(6);
      return data ?? [];
    },
  });

  if (isLoading || isLoadingEvents) {
    return (
      <PageLayout>
        <div className="container py-24 space-y-8">
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
          </div>
        </div>
      </PageLayout>
    );
  }

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
        <Tabs defaultValue="events" className="w-full">
          <div className="flex justify-center mb-10">
            <TabsList className="h-auto flex-wrap justify-center gap-2 bg-slate-200/50 dark:bg-slate-900/50 p-1.5 backdrop-blur-sm border border-slate-300/50 dark:border-slate-800 rounded-2xl">
              <TabsTrigger value="events" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-600 dark:text-slate-400 gap-1.5 text-xs md:text-sm">
                <CalendarDays className="h-4 w-4" /> Events
              </TabsTrigger>
              <TabsTrigger value="gallery" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-600 dark:text-slate-400 gap-1.5 text-xs md:text-sm">
                <Image className="h-4 w-4" /> Gallery
              </TabsTrigger>
              <TabsTrigger value="publications" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-600 dark:text-slate-400 gap-1.5 text-xs md:text-sm">
                <BookOpen className="h-4 w-4" /> Publications
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="events">
            <div className="flex items-center justify-between mb-8">
              <SectionHeading title="Live Events" description="Join our upcoming sessions and workshops." />
              <Button asChild variant="ghost" size="sm" className="text-primary">
                <Link to="/events" className="flex items-center gap-1">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            {events.length > 0 ? (
              <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event: Tables<"events">) => (
                  <div key={event.id} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
                    <div className="relative h-40 overflow-hidden">
                      <img 
                        src={event.image_url || `https://picsum.photos/seed/${event.id}/800/600`} 
                        alt={event.title} 
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-4 text-white">
                        <p className="text-xs font-bold">{format(new Date(event.date), "MMM dd, yyyy")}</p>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="mb-2 text-lg font-bold text-foreground line-clamp-1">{event.title}</h3>
                      <div className="mb-4 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {format(new Date(event.date), "hh:mm a")}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {event.location}
                          </div>
                        )}
                      </div>
                      <Button asChild variant="outline" size="sm" className="w-full rounded-lg">
                        <Link to="/events">Register Now</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center">
                <p className="text-muted-foreground">No live events scheduled at the moment.</p>
              </div>
            )}
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
