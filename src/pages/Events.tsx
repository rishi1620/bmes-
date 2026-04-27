import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, MapPin } from "lucide-react";
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

import { Tables } from "@/integrations/supabase/types";

const Events = () => {
  const [selectedEvent, setSelectedEvent] = useState<Tables<"events"> | null>(null);
  const [isRegOpen, setIsRegOpen] = useState(false);

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
              <div key={e.id} id={e.id} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-elevated transition-all hover:shadow-glow hover:-translate-y-1">
                <div className="relative h-48 w-full overflow-hidden">
                  <img 
                    src={e.image_url || "https://picsum.photos/seed/event/800/600"} 
                    alt={e.title} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {e.type && (
                    <div className="absolute top-4 left-4">
                      <span className="rounded-full bg-primary/90 px-3 py-1 text-xs font-bold text-primary-foreground backdrop-blur-sm">
                        {e.type}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 p-6">
                  <h3 className="text-xl font-bold text-foreground">{e.title}</h3>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{format(new Date(e.date), "PPP")}</p>
                    {e.location && <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{e.location}</p>}
                  </div>
                  {e.description && <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{e.description}</p>}
                  
                  <div className="mt-6 border-t border-border pt-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Starts In</p>
                    <CountdownTimer targetDate={e.date} />
                  </div>
                </div>
                
                <div className="px-6 pb-6 space-y-4">
                  <Dialog open={isRegOpen && selectedEvent?.id === e.id} onOpenChange={(open) => {
                    setIsRegOpen(open);
                    if (open) setSelectedEvent(e);
                  }}>
                    <DialogTrigger asChild>
                      <Button className="w-full">Register Now</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Register for {e.title}</DialogTitle>
                      </DialogHeader>
                      <RegistrationForm 
                        eventId={e.id} 
                        eventTitle={e.title} 
                        onSuccess={() => setIsRegOpen(false)} 
                      />
                    </DialogContent>
                  </Dialog>
                  
                  <div className="flex justify-center border-t border-border pt-4">
                    <ShareButtons url={`${window.location.origin}/events#${e.id}`} title={e.title} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="bg-muted/50 py-16 animate-fade-up animate-fade-up-delay-200">
          <div className="container">
            <SectionHeading badge="Archive" title="Past Events" />
            <div className="mt-10 space-y-4">
              {past.map((e) => (
                <div key={e.id} id={e.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-elevated">
                  <div>
                    <h3 className="font-semibold text-foreground">{e.title}</h3>
                    <p className="text-sm text-muted-foreground">{format(new Date(e.date), "PPP")}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    {e.type && <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{e.type}</span>}
                    <ShareButtons url={`${window.location.origin}/events#${e.id}`} title={e.title} />
                  </div>
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
