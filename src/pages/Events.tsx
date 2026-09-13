import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, MapPin, FileCheck2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CountdownTimer } from "@/components/shared/CountdownTimer";
import { RegistrationForm } from "@/components/shared/RegistrationForm";
import { ShareButtons } from "@/components/shared/ShareButtons";
import { isRegistrationOpen, getRegistrationMessage } from "@/lib/utils";
import EmbeddedGoogleForm from "@/components/shared/EmbeddedGoogleForm";
import { useGoogleFormsConfig } from "@/hooks/useGoogleFormsConfig";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Tables } from "@/integrations/supabase/types";

const Events = () => {
  const { config: formsConfig } = useGoogleFormsConfig();
  const [selectedEvent, setSelectedEvent] = useState<Tables<"events"> | null>(null);
  const [isRegOpen, setIsRegOpen] = useState(false);
  const [modalRegTab, setModalRegTab] = useState<"standard" | "google-form">("standard");
  const [showEmbeddedGoogleFormSection, setShowEmbeddedGoogleFormSection] = useState(true);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["public-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getGoogleCalendarUrl = (e: Tables<"events">) => {
    try {
      const startDate = new Date(e.date);
      const startStr = format(startDate, "yyyyMMdd'T'HHmmss");
      const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
      const endStr = format(endDate, "yyyyMMdd'T'HHmmss");
      const params = new URLSearchParams({
        action: "TEMPLATE",
        text: `[BMES CUET] ${e.title}`,
        dates: `${startStr}/${endStr}`,
        details: e.description || "Official Event by Biomedical Engineering Society, CUET",
        location: e.location || "CUET Campus, Chittagong",
      });
      return `https://calendar.google.com/calendar/render?${params.toString()}`;
    } catch {
      return "https://calendar.google.com";
    }
  };

  const upcoming = events
    .filter((e) => new Date(e.date) >= today || e.is_upcoming)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
  const past = events
    .filter((e) => new Date(e.date) < today && !e.is_upcoming)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <PageLayout>
      <section className="hero-gradient py-16">
        <div className="container text-center">
          <h1 className="text-4xl font-bold text-primary-foreground md:text-5xl">Events</h1>
          <p className="mt-4 text-primary-foreground/80 max-w-2xl mx-auto">Workshops, seminars, and competitions shaping the future of biomedical engineering.</p>
        </div>
      </section>

      <section className="container py-16 animate-fade-up">
        <SectionHeading badge="Coming Up" title="Upcoming Events" />
        
        {isLoading ? (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
          </div>
        ) : upcoming.length === 0 ? (
          <p className="mt-10 text-center text-muted-foreground">No upcoming events at the moment.</p>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {upcoming.map((e) => (
              <div key={e.id} id={e.id} className="group flex flex-col h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/20 hover:-translate-y-2">
                <div className="relative h-48 w-full overflow-hidden">
                  <img 
                    src={e.image_url || "https://picsum.photos/seed/event/800/600"} 
                    alt={e.title} 
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110 p-2"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                  {e.type && (
                    <div className="absolute top-4 left-4">
                      <span className="rounded-full bg-primary/90 px-3 py-1 text-xs font-bold text-primary-foreground backdrop-blur-sm shadow-sm">
                        {e.type}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col flex-1 p-5 gap-3">
                  <h3 className="text-lg font-bold text-foreground leading-tight line-clamp-1">{e.title}</h3>
                  <div className="space-y-1.5 text-sm text-muted-foreground mt-1">
                    <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{format(new Date(e.date), "PPP")}</p>
                    {e.location && <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{e.location}</p>}
                  </div>
                  
                  <div className="flex-1" />
                  
                  <div className="mt-3 border-t border-border pt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Starts In</p>
                    <CountdownTimer targetDate={e.date} />
                  </div>
                </div>
                
                <div className="px-5 pb-5 space-y-3 mt-auto">
                  <Dialog open={isRegOpen && selectedEvent?.id === e.id} onOpenChange={(open) => {
                    if (isRegistrationOpen(e.registration_start_date, e.registration_end_date)) {
                      setIsRegOpen(open);
                      if (open) setSelectedEvent(e);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <div className="w-full flex flex-col gap-2">
                        <Button 
                          className="w-full rounded-xl py-6 font-semibold"
                          disabled={!isRegistrationOpen(e.registration_start_date, e.registration_end_date)}
                        >
                          Register Now
                        </Button>
                        {!isRegistrationOpen(e.registration_start_date, e.registration_end_date) && (
                          <div className="text-center text-xs font-semibold text-destructive">
                            {getRegistrationMessage(e.registration_start_date, e.registration_end_date)}
                          </div>
                        )}
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-base font-bold">Register for {e.title}</DialogTitle>
                      </DialogHeader>

                      <Tabs value={modalRegTab} onValueChange={(val) => setModalRegTab(val as "standard" | "google-form")} className="w-full mt-2">
                        <TabsList className="grid grid-cols-2 h-9 w-full rounded-lg bg-muted/60 p-1">
                          <TabsTrigger value="standard" className="text-xs font-semibold">
                            Website Registration
                          </TabsTrigger>
                          <TabsTrigger value="google-form" className="text-xs font-semibold gap-1.5">
                            <FileCheck2 className="h-3.5 w-3.5 text-blue-600" />
                            Google Form
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="standard" className="pt-3">
                          <RegistrationForm 
                            eventId={e.id} 
                            eventTitle={e.title} 
                            onSuccess={() => setIsRegOpen(false)} 
                          />
                        </TabsContent>

                        <TabsContent value="google-form" className="pt-3">
                          <div className="space-y-3">
                            <p className="text-xs text-muted-foreground">
                              Submit your registration details directly through our official event Google Form. Responses are synced in real-time to the executive committee.
                            </p>
                            <EmbeddedGoogleForm
                              formUrlOrId={formsConfig.eventRegistrationFormUrl}
                              title={`${e.title} - Registration`}
                              defaultHeight={540}
                              className="border-blue-500/20"
                            />
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                  
                  <div className="flex items-center justify-between border-t border-border pt-3 gap-2">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-muted-foreground hover:text-foreground font-medium gap-1.5 px-2"
                    >
                      <a href={getGoogleCalendarUrl(e)} target="_blank" rel="noopener noreferrer">
                        <CalendarDays className="h-3.5 w-3.5 text-primary" />
                        <span>Add to Calendar</span>
                      </a>
                    </Button>
                    <ShareButtons url={`${window.location.origin}/events#${e.id}`} title={e.title} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Embedded Google Forms Event Registration Section */}
      {formsConfig.eventRegistrationEnabled && (
        <section className="container py-10">
          <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-500/5 via-card to-card p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/80">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                    <FileCheck2 className="h-3.5 w-3.5" />
                    Google Forms Integration
                  </span>
                  <span className="text-xs text-muted-foreground">• Live Form Sync</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {formsConfig.eventRegistrationTitle || "Official Event & Workshop Registration"}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Prefer registering with your Google account? Fill out our official Google Form below. All responses are logged directly into our committee dashboard.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEmbeddedGoogleFormSection(!showEmbeddedGoogleFormSection)}
                  className="h-8 text-xs gap-1.5"
                >
                  {showEmbeddedGoogleFormSection ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" />
                      <span>Collapse Form</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" />
                      <span>Expand Form</span>
                    </>
                  )}
                </Button>

                <Button
                  asChild
                  variant="default"
                  size="sm"
                  className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <a
                    href={formsConfig.eventRegistrationFormUrl.replace(/[?&]embedded=true/, "")}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Open in New Tab</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </div>

            {showEmbeddedGoogleFormSection && (
              <div className="pt-6 animate-fade-in">
                <EmbeddedGoogleForm
                  formUrlOrId={formsConfig.eventRegistrationFormUrl}
                  title={formsConfig.eventRegistrationTitle || "BMES CUET Event Registration"}
                  description="Fill out the registration form below. Confirmation and credentials will be sent to your student email."
                  defaultHeight={640}
                  className="border-blue-500/30 shadow-md"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="bg-muted/50 py-16 animate-fade-up animate-fade-up-delay-200">
          <div className="container">
            <SectionHeading badge="Archive" title="Past Events" />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {past.map((e) => (
                <div key={e.id} className="rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                  <h3 className="font-semibold text-foreground text-sm line-clamp-1">{e.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(e.date), "PPP")}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </PageLayout>
  );
};

export default Events;
