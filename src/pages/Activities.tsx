import { motion, Variants } from "framer-motion";
import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, BookOpen, CalendarDays, MapPin, ArrowRight, Download, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Tables } from "@/integrations/supabase/types";

interface ActivitiesSettings {
  activities_hero_title?: string;
  activities_hero_subtitle?: string;
  activities_gallery_content?: string;
  activities_gallery_images?: string;
  activities_publications_content?: string;
  activities_publications_pdf_url?: string;
  gallery_images?: string[];
  [key: string]: string | string[] | undefined;
}

const Activities = () => {
  const { data: settings = {} as ActivitiesSettings, isLoading, isError: isErrorSettings } = useQuery({
    queryKey: ["activities-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("setting_group", "activities_page");
      if (error) throw error;
      
      const map: ActivitiesSettings = {};
      data?.forEach((s) => { map[s.setting_key] = s.setting_value || ""; });
      
      if (map.activities_gallery_images) {
        try {
          map.gallery_images = JSON.parse(map.activities_gallery_images as string);
        } catch {
          map.gallery_images = [];
        }
      } else {
        map.gallery_images = [];
      }
      
      return map as ActivitiesSettings;
    },
  });

  const { data: events = [], isLoading: isLoadingEvents, isError: isErrorEvents } = useQuery({
    queryKey: ["upcoming-activities-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_upcoming", true)
        .order("date", { ascending: true })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

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

  if (isErrorSettings || isErrorEvents) {
    return (
      <PageLayout>
        <div className="container py-24 flex flex-col items-center justify-center text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-2xl font-bold">Oops! Something went wrong</h2>
          <p className="text-muted-foreground max-w-md">
            We couldn't load the activities content. Please try refreshing the page or contact support if the problem persists.
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <section className="hero-gradient py-16 md:py-24">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container text-center"
        >
          <span className="mb-3 inline-block rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground/90">
            BMES Activities & Events
          </span>
          <h1 className="text-4xl font-extrabold text-primary-foreground md:text-5xl">
            {settings.activities_hero_title || "The Vibrant Side of BME"}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80 leading-relaxed">
            {settings.activities_hero_subtitle || "Showcasing student life, flagship events, seminars, workshops, and publications."}
          </p>
        </motion.div>
      </section>

      <section className="container py-16">
        <Tabs defaultValue="events" className="w-full">
          <div className="flex justify-center mb-10">
            <TabsList className="h-auto flex-wrap justify-center gap-2 bg-slate-200/50 dark:bg-slate-900/50 p-1.5 backdrop-blur-sm border border-slate-300/50 dark:border-slate-800 rounded-2xl">
              <TabsTrigger value="events" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-600 dark:text-slate-400 gap-1.5 text-xs md:text-sm transition-all">
                <CalendarDays className="h-4 w-4" /> Events
              </TabsTrigger>
              <TabsTrigger value="gallery" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-600 dark:text-slate-400 gap-1.5 text-xs md:text-sm transition-all">
                <Image className="h-4 w-4" /> Gallery
              </TabsTrigger>
              <TabsTrigger value="publications" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-600 dark:text-slate-400 gap-1.5 text-xs md:text-sm transition-all">
                <BookOpen className="h-4 w-4" /> Publications
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="events">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="flex items-center justify-between mb-8">
                <SectionHeading title="Live Events" description="Join our upcoming sessions and workshops." />
                <Button asChild variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                  <Link to="/events" className="flex items-center gap-1">
                    View all <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              {events.length > 0 ? (
                <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {events.map((event: Tables<"events">) => (
                    <motion.div 
                      key={event.id} 
                      variants={itemVariants}
                      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={event.image_url || `https://picsum.photos/seed/${event.id}/800/600`} 
                          alt={event.title} 
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-4 left-4 text-white">
                          <p className="text-xs font-bold uppercase tracking-wider opacity-90">{format(new Date(event.date), "MMM dd, yyyy")}</p>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="mb-3 text-xl font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{event.title}</h3>
                        <div className="mb-5 space-y-2">
                          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                            <CalendarDays className="h-4 w-4 text-primary/70" />
                            {format(new Date(event.date), "hh:mm a")}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 text-primary/70" />
                              <span className="line-clamp-1">{event.location}</span>
                            </div>
                          )}
                        </div>
                        <Button asChild variant="outline" size="sm" className="w-full rounded-xl border-primary/20 hover:bg-primary hover:text-white transition-all">
                          <Link to="/events">Register Now</Link>
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  variants={itemVariants}
                  className="mt-10 rounded-2xl border border-dashed border-border p-16 text-center bg-muted/30"
                >
                  <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Upcoming Events</h3>
                  <p className="text-muted-foreground mt-1">Check back later for new sessions and workshops.</p>
                </motion.div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="gallery">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <SectionHeading title="Gallery" description="Organized photo and video albums of tours, cultural events, and competitions." />
              
              {settings.activities_gallery_content && (
                <motion.div variants={itemVariants} className="mt-6 mb-10 text-center max-w-3xl mx-auto">
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {settings.activities_gallery_content}
                  </p>
                </motion.div>
              )}

              <div className="mt-10">
                {settings.gallery_images && settings.gallery_images.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {settings.gallery_images.map((url: string, idx: number) => (
                      <motion.div 
                        key={idx} 
                        variants={itemVariants}
                        className="group relative aspect-square overflow-hidden rounded-2xl border bg-muted shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
                      >
                        <img 
                          src={url} 
                          alt={`Gallery image ${idx + 1}`} 
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center backdrop-blur-[2px]">
                          <Button variant="secondary" size="sm" asChild className="rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <a href={url} target="_blank" rel="noreferrer">View Full</a>
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div variants={itemVariants}>
                    <Card className="border-dashed bg-muted/30">
                      <CardContent className="p-16">
                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                            <Image className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium">Gallery is Empty</h3>
                            <p className="text-muted-foreground mt-1">
                              Photos and videos will be updated shortly.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="publications">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <SectionHeading title="Publications/Magazine" description="Digital copies of the annual club magazine, newsletters, or student-written articles." />
              <motion.div variants={itemVariants} className="mt-10 max-w-4xl mx-auto">
                <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-emerald-50 to-white dark:from-slate-900 dark:to-slate-950 ring-1 ring-emerald-100 dark:ring-slate-800">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/3 bg-emerald-600 flex items-center justify-center p-12 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent opacity-50" />
                        <BookOpen className="h-24 w-24 text-white relative z-10" />
                      </div>
                      <div className="md:w-2/3 p-8 md:p-12 flex flex-col justify-center space-y-6">
                        <div className="space-y-3">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                            Featured
                          </div>
                          <h3 className="text-3xl font-bold text-foreground">Latest Publication</h3>
                          <p className="text-muted-foreground leading-relaxed text-lg">
                            {settings.activities_publications_content || "Our latest magazine and newsletters are available for digital download. Stay updated with the latest trends and student research in Biomedical Engineering."}
                          </p>
                        </div>
                        
                        {settings.activities_publications_pdf_url ? (
                          <div className="flex flex-wrap gap-4 pt-4">
                            <Button asChild className="rounded-xl px-8 py-6 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all hover:scale-105">
                              <a 
                                href={settings.activities_publications_pdf_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                              >
                                <Download className="h-5 w-5" /> Download PDF
                              </a>
                            </Button>
                            <Button variant="outline" asChild className="rounded-xl px-8 py-6 border-emerald-200 hover:bg-emerald-50 dark:border-slate-800 dark:hover:bg-slate-900 transition-all">
                              <a 
                                href={settings.activities_publications_pdf_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                Read Online
                              </a>
                            </Button>
                          </div>
                        ) : (
                          <div className="pt-4 flex items-center gap-3 text-muted-foreground italic">
                            <div className="h-1 w-12 bg-emerald-200 dark:bg-slate-800 rounded-full" />
                            <p className="text-sm">
                              Digital copies will be available soon.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </section>
    </PageLayout>
  );
};

export default Activities;
