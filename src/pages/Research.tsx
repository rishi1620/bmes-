import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Microscope, BookOpen, FileText, FlaskConical } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const Research = () => {
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

  const ongoing = projects.filter((p) => p.status === "ongoing" || p.status === "In Progress" || p.status === "Planning");

  return (
    <PageLayout>
      <section className="hero-gradient py-16 md:py-24">
        <div className="container text-center">
          <span className="mb-3 inline-block rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground/90">
            Research & Facilities
          </span>
          <h1 className="text-4xl font-extrabold text-primary-foreground md:text-5xl">Highlighting Technical Capabilities</h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80 leading-relaxed">
            Explore our laboratories, research areas, publications, and ongoing projects.
          </p>
        </div>
      </section>

      <section className="container py-16">
        <Tabs defaultValue="labs" className="w-full">
          <div className="flex justify-center mb-10">
            <TabsList className="h-auto flex-wrap justify-center gap-2 bg-slate-900/50 p-1.5 backdrop-blur-sm border border-slate-800 rounded-2xl">
              <TabsTrigger value="labs" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white gap-1.5 text-xs md:text-sm">
                <FlaskConical className="h-4 w-4" /> Laboratories
              </TabsTrigger>
              <TabsTrigger value="areas" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white gap-1.5 text-xs md:text-sm">
                <Microscope className="h-4 w-4" /> Areas
              </TabsTrigger>
              <TabsTrigger value="publications" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white gap-1.5 text-xs md:text-sm">
                <BookOpen className="h-4 w-4" /> Publications
              </TabsTrigger>
              <TabsTrigger value="projects" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white gap-1.5 text-xs md:text-sm">
                <FileText className="h-4 w-4" /> Projects
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="labs">
            <SectionHeading title="Laboratories" description="Individual pages for each lab detailing the equipment available." />
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader><CardTitle>Medical Electronics Lab</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">Equipped with oscilloscopes, function generators, and biomedical sensors.</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Biomechanics Lab</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">Features motion capture systems and force plates.</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Biomedical Signal Processing Lab</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">High-performance computing for EEG, ECG, and EMG analysis.</p></CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="areas">
            <SectionHeading title="Research Areas" description="Broad topics the faculty and students are researching." />
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader><CardTitle>Telemedicine</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">Remote patient monitoring and healthcare delivery systems.</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Tissue Engineering</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">Biomaterials and scaffolding for organ regeneration.</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Bioinformatics</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">Computational biology and genomic data analysis.</p></CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="publications">
            <SectionHeading title="Publications" description="A running list of journal papers, conference proceedings, and patents." />
            <div className="mt-10">
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">Publications list will be updated shortly.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projects">
            <SectionHeading title="Ongoing Projects" description="Highlights of current final-year thesis projects or funded research." />
            {isLoading ? (
              <div className="mt-10 grid gap-6 md:grid-cols-2">
                {[1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
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
                        <span>{p.progress}%</span>
                      </div>
                      <Progress value={p.progress} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </PageLayout>
  );
};

export default Research;
