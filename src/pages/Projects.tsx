import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const Projects = () => {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["public-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const ongoing = projects.filter((p) => p.status === "ongoing");
  const completed = projects.filter((p) => p.status === "completed");

  return (
    <PageLayout>
      <section className="hero-gradient py-16">
        <div className="container text-center">
          <h1 className="text-4xl font-bold text-primary-foreground md:text-5xl">Projects</h1>
          <p className="mt-4 text-primary-foreground/80 max-w-2xl mx-auto">Explore our ongoing research and completed innovations in biomedical engineering.</p>
        </div>
      </section>

      <section className="container py-16">
        <SectionHeading badge="Active" title="Ongoing Projects" />
        {isLoading ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
          </div>
        ) : ongoing.length === 0 ? (
          <p className="mt-10 text-center text-muted-foreground">No ongoing projects at the moment.</p>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {ongoing.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-card p-6 shadow-elevated">
                {p.category && (
                  <div className="mb-3">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{p.category}</span>
                  </div>
                )}
                <h3 className="text-lg font-semibold text-foreground">{p.title}</h3>
                {p.lead && <p className="mt-1 text-sm text-muted-foreground">Lead: {p.lead}</p>}
                {p.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{p.progress}%</span>
                  </div>
                  <Progress value={p.progress} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {completed.length > 0 && (
        <section className="bg-muted/50 py-16">
          <div className="container">
            <SectionHeading badge="Archive" title="Completed Projects" />
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {completed.map((p) => (
                <div key={p.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-elevated">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent font-bold text-sm">
                    {new Date(p.created_at).getFullYear()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{p.title}</h3>
                    {p.lead && <p className="text-sm text-muted-foreground">Lead: {p.lead}</p>}
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

export default Projects;
