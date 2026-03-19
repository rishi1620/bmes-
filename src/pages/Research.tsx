import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Microscope, BookOpen, FileText, FlaskConical, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Lab {
  id: string;
  title: string;
  description: string;
}

interface ResearchArea {
  id: string;
  title: string;
  description: string;
}

interface Publication {
  id: string;
  title: string;
  authors: string;
  source: string;
  year: string;
  link?: string;
}

const Research = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [labs, setLabs] = useState<Lab[]>([]);
  const [areas, setAreas] = useState<ResearchArea[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("setting_group", "research_page");
      const map: Record<string, string> = {};
      data?.forEach((s) => { map[s.setting_key] = s.setting_value; });
      setSettings(map);

      if (map.research_labs_json) {
        try { setLabs(JSON.parse(map.research_labs_json)); } catch (e) { console.error(e); }
      }
      if (map.research_areas_json) {
        try { setAreas(JSON.parse(map.research_areas_json)); } catch (e) { console.error(e); }
      }
      if (map.research_publications_json) {
        try { setPublications(JSON.parse(map.research_publications_json)); } catch (e) { console.error(e); }
      }
    };
    fetchSettings();
  }, []);

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
          <h1 className="text-4xl font-extrabold text-primary-foreground md:text-5xl">
            {settings.research_hero_title || "Highlighting Technical Capabilities"}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80 leading-relaxed">
            {settings.research_hero_subtitle || "Explore our laboratories, research areas, publications, and ongoing projects."}
          </p>
        </div>
      </section>

      <section className="container py-16">
        <Tabs defaultValue="labs" className="w-full">
          <div className="flex justify-center mb-10">
            <TabsList className="h-auto flex-wrap justify-center gap-2 bg-slate-200/50 dark:bg-slate-900/50 p-1.5 backdrop-blur-sm border border-slate-300/50 dark:border-slate-800 rounded-2xl">
              <TabsTrigger value="labs" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-600 dark:text-slate-400 gap-1.5 text-xs md:text-sm">
                <FlaskConical className="h-4 w-4" /> Laboratories
              </TabsTrigger>
              <TabsTrigger value="areas" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-600 dark:text-slate-400 gap-1.5 text-xs md:text-sm">
                <Microscope className="h-4 w-4" /> Areas
              </TabsTrigger>
              <TabsTrigger value="publications" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-600 dark:text-slate-400 gap-1.5 text-xs md:text-sm">
                <BookOpen className="h-4 w-4" /> Publications
              </TabsTrigger>
              <TabsTrigger value="projects" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-600 dark:text-slate-400 gap-1.5 text-xs md:text-sm">
                <FileText className="h-4 w-4" /> Projects
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="labs">
            <SectionHeading title="Laboratories" description="Individual pages for each lab detailing the equipment available." />
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {labs.length === 0 ? (
                <>
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
                </>
              ) : (
                labs.map((lab) => (
                  <Card key={lab.id}>
                    <CardHeader><CardTitle>{lab.title}</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">{lab.description}</p></CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="areas">
            <SectionHeading title="Research Areas" description="Broad topics the faculty and students are researching." />
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {areas.length === 0 ? (
                <>
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
                </>
              ) : (
                areas.map((area) => (
                  <Card key={area.id}>
                    <CardHeader><CardTitle>{area.title}</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">{area.description}</p></CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="publications">
            <SectionHeading title="Publications" description="A running list of journal papers, conference proceedings, and patents." />
            <div className="mt-10 space-y-4">
              {publications.length === 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <p className="text-center text-muted-foreground">Publications list will be updated shortly.</p>
                  </CardContent>
                </Card>
              ) : (
                publications.map((pub) => (
                  <Card key={pub.id}>
                    <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{pub.title}</h3>
                        <p className="text-sm text-muted-foreground">{pub.authors}</p>
                        <p className="text-xs text-primary font-medium">{pub.source} ({pub.year})</p>
                      </div>
                      {pub.link && (
                        <Button variant="outline" size="sm" asChild className="shrink-0">
                          <a href={pub.link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" /> View Paper
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
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
