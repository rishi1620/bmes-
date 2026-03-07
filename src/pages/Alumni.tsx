import { Briefcase, MapPin, GraduationCap, Linkedin, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Skeleton } from "@/components/ui/skeleton";

const Alumni = () => {
  const { data: alumni, isLoading } = useQuery({
    queryKey: ["alumni"],
    queryFn: async () => {
      const { data } = await supabase.from("alumni").select("*").order("display_order");
      return data ?? [];
    },
  });

  const featured = alumni?.filter((a) => a.is_featured) ?? [];
  const all = alumni ?? [];

  return (
    <PageLayout>
      <section className="hero-gradient py-16">
        <div className="container text-center">
          <h1 className="text-4xl font-bold text-primary-foreground md:text-5xl">Alumni Network</h1>
          <p className="mt-4 text-primary-foreground/80 max-w-2xl mx-auto">Connect with CUET BME graduates making an impact worldwide.</p>
        </div>
      </section>

      {/* Featured testimonials */}
      {featured.length > 0 && (
        <section className="bg-muted/50 py-16">
          <div className="container">
            <SectionHeading badge="Spotlight" title="Featured Alumni" />
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {featured.map((a) => (
                <blockquote key={a.id} className="rounded-xl border border-border bg-card p-6 shadow-elevated">
                  <div className="flex items-center gap-3 mb-4">
                    {a.photo ? (
                      <img src={a.photo} alt={a.name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">{a.name.charAt(0)}</div>
                    )}
                    <div>
                      <p className="font-semibold text-foreground flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> {a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.current_position} at {a.organization}</p>
                    </div>
                  </div>
                  {a.testimonial && <p className="text-sm text-muted-foreground leading-relaxed italic">"{a.testimonial}"</p>}
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container py-16">
        <SectionHeading badge="Directory" title="Alumni Directory" description="Our alumni are working across healthcare, research, and tech." />
        {isLoading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-44 rounded-xl" />)}
          </div>
        ) : all.length === 0 ? (
          <p className="mt-8 text-center text-muted-foreground">No alumni added yet.</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {all.map((a) => (
              <div key={a.id} className="rounded-xl border border-border bg-card p-6 shadow-elevated transition-all hover:shadow-glow hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-3">
                  {a.photo ? (
                    <img src={a.photo} alt={a.name} className="h-14 w-14 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                      {a.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-foreground">{a.name}</h3>
                    <p className="text-sm text-primary font-medium">{a.current_position}</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {a.organization && <p className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" />{a.organization}</p>}
                  {a.location && <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{a.location}</p>}
                  {a.batch && <p className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" />{a.batch}</p>}
                </div>
                {a.linkedin && (
                  <a href={a.linkedin} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="bg-muted/30 py-16">
        <div className="container">
          <SectionHeading badge="Give Back" title="Support the Next Generation" description="Information on how alumni can mentor current students, offer internships, or sponsor club events." />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-center">
              <h3 className="text-lg font-semibold mb-2">Mentorship</h3>
              <p className="text-sm text-muted-foreground">Guide current students through their academic and professional journeys.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-center">
              <h3 className="text-lg font-semibold mb-2">Internships</h3>
              <p className="text-sm text-muted-foreground">Provide valuable industry experience to our talented undergraduates.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-center">
              <h3 className="text-lg font-semibold mb-2">Sponsorship</h3>
              <p className="text-sm text-muted-foreground">Support BMES events, hackathons, and research projects.</p>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Alumni;
