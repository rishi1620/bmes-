import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, BookOpen, Download, UserPlus } from "lucide-react";

const Portal = () => {
  return (
    <PageLayout>
      <section className="hero-gradient py-16 md:py-24">
        <div className="container text-center">
          <span className="mb-3 inline-block rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground/90">
            Student Portal / Resources
          </span>
          <h1 className="text-4xl font-extrabold text-primary-foreground md:text-5xl">Interactive Zone</h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80 leading-relaxed">
            A highly practical section driving daily traffic to your site.
          </p>
        </div>
      </section>

      <section className="container py-16">
        <Tabs defaultValue="notices" className="w-full">
          <TabsList className="mx-auto mb-10 grid w-full max-w-2xl grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="notices" className="gap-1.5 text-xs md:text-sm"><Bell className="h-4 w-4" /> Notices</TabsTrigger>
            <TabsTrigger value="library" className="gap-1.5 text-xs md:text-sm"><BookOpen className="h-4 w-4" /> Library</TabsTrigger>
            <TabsTrigger value="software" className="gap-1.5 text-xs md:text-sm"><Download className="h-4 w-4" /> Software</TabsTrigger>
            <TabsTrigger value="membership" className="gap-1.5 text-xs md:text-sm"><UserPlus className="h-4 w-4" /> Membership</TabsTrigger>
          </TabsList>

          <TabsContent value="notices">
            <SectionHeading title="Notice Board" description="A searchable archive of all official notices." />
            <div className="mt-10">
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">Notice board will be updated shortly.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="library">
            <SectionHeading title="Resource Library" description="Gated or open access to lecture notes, reference books, and previous years' question banks." />
            <div className="mt-10">
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">Resource library will be available soon.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="software">
            <SectionHeading title="Software Links" description="Guides and links to university-licensed software." />
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader><CardTitle>MATLAB</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">Numerical computing environment and programming language.</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>SolidWorks</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">3D CAD design software for biomedical device modeling.</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>LabVIEW</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">System-design platform and development environment for visual programming language.</p></CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="membership">
            <SectionHeading title="Membership Portal" description="Information on how to join BMES, membership benefits, and an online registration/renewal form." />
            <div className="mt-10">
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">Membership portal will be available soon.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </PageLayout>
  );
};

export default Portal;
