import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, BookOpen, DollarSign, Newspaper, ExternalLink, Calendar } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const placeColor = (place: string) => {
  if (place?.includes("1st")) return "default";
  if (place?.includes("2nd")) return "secondary";
  return "outline" as const;
};

const Achievements = () => {
  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ["public-achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const competitions = achievements.filter((a) => {
    const cat = a.category?.toLowerCase() || "";
    return cat === "competition" || cat === "competitions" || cat === "award" || cat === "awards";
  });
  const publications = achievements.filter((a) => {
    const cat = a.category?.toLowerCase() || "";
    return cat === "publication" || cat === "publications";
  });
  const grants = achievements.filter((a) => {
    const cat = a.category?.toLowerCase() || "";
    return cat === "grant" || cat === "grants";
  });
  const media = achievements.filter((a) => {
    const cat = a.category?.toLowerCase() || "";
    return cat === "media" || cat === "news" || cat === "event" || cat === "events";
  });

  const LoadingSkeleton = () => (
    <div className="mt-10 grid gap-5 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
    </div>
  );

  return (
    <PageLayout>
      <section className="hero-gradient py-16 md:py-24">
        <div className="container text-center">
          <span className="mb-3 inline-block rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground/90">
            Our Achievements
          </span>
          <h1 className="text-4xl font-extrabold text-primary-foreground md:text-5xl">Recognition & Impact</h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80 leading-relaxed">
            Celebrating the competition wins, publications, grants, and media recognition that showcase our society's contributions to biomedical engineering.
          </p>
        </div>
      </section>

      <section className="container py-16 animate-fade-up animate-fade-up-delay-200">
        <Tabs defaultValue="competitions" className="w-full">
          <TabsList className="mx-auto mb-10 grid w-full max-w-2xl grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="competitions" className="gap-1.5 text-xs md:text-sm"><Trophy className="h-4 w-4" /> Competitions</TabsTrigger>
            <TabsTrigger value="publications" className="gap-1.5 text-xs md:text-sm"><BookOpen className="h-4 w-4" /> Publications</TabsTrigger>
            <TabsTrigger value="grants" className="gap-1.5 text-xs md:text-sm"><DollarSign className="h-4 w-4" /> Grants</TabsTrigger>
            <TabsTrigger value="media" className="gap-1.5 text-xs md:text-sm"><Newspaper className="h-4 w-4" /> Media</TabsTrigger>
          </TabsList>

          <TabsContent value="competitions">
            <SectionHeading title="Competition Wins" description="Our teams consistently excel in national and international biomedical engineering competitions." />
            {isLoading ? <LoadingSkeleton /> : competitions.length === 0 ? (
              <p className="mt-10 text-center text-muted-foreground">No competitions recorded yet.</p>
            ) : (
              <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {competitions.map((c) => (
                  <Card key={c.id} className="group overflow-hidden transition-all hover:shadow-glow hover:-translate-y-1">
                    {c.image_url && (
                      <div className="h-48 w-full overflow-hidden bg-muted">
                        <img src={c.image_url} alt={c.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        {c.place && <Badge variant={placeColor(c.place)}>{c.place}</Badge>}
                        <span className="text-xs text-muted-foreground">{c.year}</span>
                      </div>
                      <CardTitle className="mt-2 text-base">{c.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {c.description && <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>}
                      {c.team && <p className="mt-3 text-xs font-medium text-primary">{c.team}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="publications">
            <SectionHeading title="Research Publications" description="Peer-reviewed papers and conference proceedings authored by BMES members." />
            {isLoading ? <LoadingSkeleton /> : publications.length === 0 ? (
              <p className="mt-10 text-center text-muted-foreground">No publications recorded yet.</p>
            ) : (
              <div className="mt-10 space-y-4">
                {publications.map((p) => (
                  <Card key={p.id} className="overflow-hidden transition-all hover:shadow-elevated">
                    <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
                      {p.image_url && (
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                          <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{p.title}</h3>
                        {p.authors && <p className="mt-1 text-sm text-muted-foreground">{p.authors}</p>}
                        <p className="mt-1 text-xs text-primary font-medium">{p.journal} · {p.year}</p>
                      </div>
                      {p.doi && (
                        <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline whitespace-nowrap mt-2 md:mt-0">
                          <ExternalLink className="h-3.5 w-3.5" /> DOI
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="grants">
            <SectionHeading title="Grants & Funding" description="Financial support secured to fuel our research and community projects." />
            {isLoading ? <LoadingSkeleton /> : grants.length === 0 ? (
              <p className="mt-10 text-center text-muted-foreground">No grants recorded yet.</p>
            ) : (
              <div className="mt-10 grid gap-5 md:grid-cols-2">
                {grants.map((g) => (
                  <Card key={g.id} className="overflow-hidden transition-all hover:shadow-elevated">
                    {g.image_url && (
                      <div className="h-40 w-full overflow-hidden bg-muted">
                        <img src={g.image_url} alt={g.title} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        {g.status && <Badge variant={g.status === "Active" ? "default" : "secondary"}>{g.status}</Badge>}
                        {g.amount && <span className="text-sm font-bold text-primary">{g.amount}</span>}
                      </div>
                      <CardTitle className="mt-2 text-base">{g.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {g.description && <p className="text-sm text-muted-foreground leading-relaxed">{g.description}</p>}
                      {g.year && (
                        <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> {g.year}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="media">
            <SectionHeading title="Media Coverage" description="News articles, interviews, and features highlighting our society's work." />
            {isLoading ? <LoadingSkeleton /> : media.length === 0 ? (
              <p className="mt-10 text-center text-muted-foreground">No media coverage recorded yet.</p>
            ) : (
              <div className="mt-10 space-y-4">
                {media.map((m) => (
                  <Card key={m.id} className="overflow-hidden transition-all hover:shadow-elevated">
                    <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5">
                      {m.image_url ? (
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <img src={m.image_url} alt={m.title} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Newspaper className="h-6 w-6" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{m.title}</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {m.outlet} · {m.date_text} · <span className="text-primary">{m.media_type}</span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </PageLayout>
  );
};

export default Achievements;
