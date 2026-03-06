import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Microscope, BookOpen, FileText, FlaskConical } from "lucide-react";

const Research = () => {
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
          <TabsList className="mx-auto mb-10 grid w-full max-w-2xl grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="labs" className="gap-1.5 text-xs md:text-sm"><FlaskConical className="h-4 w-4" /> Laboratories</TabsTrigger>
            <TabsTrigger value="areas" className="gap-1.5 text-xs md:text-sm"><Microscope className="h-4 w-4" /> Areas</TabsTrigger>
            <TabsTrigger value="publications" className="gap-1.5 text-xs md:text-sm"><BookOpen className="h-4 w-4" /> Publications</TabsTrigger>
            <TabsTrigger value="projects" className="gap-1.5 text-xs md:text-sm"><FileText className="h-4 w-4" /> Projects</TabsTrigger>
          </TabsList>

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
            <div className="mt-10">
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">Ongoing projects details will be updated shortly.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </PageLayout>
  );
};

export default Research;
