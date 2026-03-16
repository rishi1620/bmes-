import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const categories = ["All", "Web", "CLI", "UI"];

  const filteredProjects = projects.filter((p) => {
    const matchesCategory = filter === "All" || p.category === filter;
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const ongoing = filteredProjects.filter((p) => p.status === "ongoing" || p.status === "In Progress" || p.status === "Planning" || p.status === "Paused");
  const completed = filteredProjects.filter((p) => p.status === "completed" || p.status === "Completed");

  return (
    <PageLayout>
      <section className="hero-gradient py-16">
        <div className="container text-center">
          <h1 className="text-4xl font-bold text-primary-foreground md:text-5xl">Projects</h1>
          <p className="mt-4 text-primary-foreground/80 max-w-2xl mx-auto">Explore our ongoing research and completed innovations in biomedical engineering.</p>
        </div>
      </section>

      <section className="container py-16 animate-fade-up">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <Input 
            placeholder="Search projects..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="max-w-sm"
          />
          <div className="flex gap-2">
            {categories.map((cat) => (
              <Button 
                key={cat} 
                variant={filter === cat ? "default" : "outline"} 
                onClick={() => setFilter(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
        <SectionHeading badge="Active" title="Ongoing Projects" />
        {isLoading ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
          </div>
        ) : ongoing.length === 0 ? (
          <p className="mt-10 text-center text-muted-foreground">No ongoing projects matching your criteria.</p>
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
                {p.team_members && p.team_members.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.team_members.map((member, i) => (
                      <span key={i} className="inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground border border-border/50">
                        {member}
                      </span>
                    ))}
                  </div>
                )}
                {p.description && <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{Number(p.progress) || 0}%</span>
                  </div>
                  <Progress value={Number(p.progress) || 0} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {completed.length > 0 && (
        <section className="bg-muted/50 py-16 animate-fade-up animate-fade-up-delay-200">
          <div className="container">
            <SectionHeading badge="Archive" title="Completed Projects" />
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {completed.map((p) => (
                <div key={p.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-elevated">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent font-bold text-sm">
                    {new Date(p.created_at).getFullYear()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{p.title}</h3>
                    {p.lead && <p className="text-sm text-muted-foreground">Lead: {p.lead}</p>}
                    {p.team_members && p.team_members.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.team_members.map((member, i) => (
                          <span key={i} className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/30">
                            {member}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{Number(p.progress) || 0}%</span>
                      </div>
                      <Progress value={Number(p.progress) || 0} className="h-1.5" />
                    </div>
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
