import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, MapPin } from "lucide-react";
import { format } from "date-fns";
import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Skeleton } from "@/components/ui/skeleton";

const Events = () => {
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

  const upcoming = events.filter((e) => e.is_upcoming);
  const past = events.filter((e) => !e.is_upcoming);

  return (
    <PageLayout>
      <section className="hero-gradient py-16">
        <div className="container text-center">
          <h1 className="text-4xl font-bold text-primary-foreground md:text-5xl">Events</h1>
          <p className="mt-4 text-primary-foreground/80 max-w-2xl mx-auto">Workshops, seminars, and competitions shaping the future of biomedical engineering.</p>
        </div>
      </section>

      <section className="container py-16">
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
              <div key={e.id} className="group rounded-xl border border-border bg-card p-6 shadow-elevated transition-all hover:shadow-glow hover:-translate-y-1">
                {e.type && <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{e.type}</span>}
                <h3 className="text-lg font-semibold text-foreground">{e.title}</h3>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{format(new Date(e.date), "PPP")}</p>
                  {e.location && <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{e.location}</p>}
                </div>
                {e.description && <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{e.description}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="bg-muted/50 py-16">
          <div className="container">
            <SectionHeading badge="Archive" title="Past Events" />
            <div className="mt-10 space-y-4">
              {past.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-elevated">
                  <div>
                    <h3 className="font-semibold text-foreground">{e.title}</h3>
                    <p className="text-sm text-muted-foreground">{format(new Date(e.date), "PPP")}</p>
                  </div>
                  {e.type && <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{e.type}</span>}
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
