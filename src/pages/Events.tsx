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
import { isRegistrationOpen, getRegistrationMessage } from "@/lib/utils";

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
                  
                  <div className="flex justify-center border-t border-border pt-3">
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
