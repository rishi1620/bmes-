import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserCheck, GraduationCap, Briefcase } from "lucide-react";

const People = () => {
  return (
    <PageLayout>
      <section className="hero-gradient py-16 md:py-24">
        <div className="container text-center">
          <span className="mb-3 inline-block rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground/90">
            People
          </span>
          <h1 className="text-4xl font-extrabold text-primary-foreground md:text-5xl">The Faces of BME</h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80 leading-relaxed">
            Showcasing the individuals who make the department and club run.
          </p>
        </div>
      </section>

      <section className="container py-16">
        <Tabs defaultValue="faculty" className="w-full">
          <TabsList className="mx-auto mb-10 grid w-full max-w-2xl grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="faculty" className="gap-1.5 text-xs md:text-sm"><GraduationCap className="h-4 w-4" /> Faculty</TabsTrigger>
            <TabsTrigger value="staff" className="gap-1.5 text-xs md:text-sm"><Briefcase className="h-4 w-4" /> Staff</TabsTrigger>
            <TabsTrigger value="ec" className="gap-1.5 text-xs md:text-sm"><Users className="h-4 w-4" /> BMES EC</TabsTrigger>
            <TabsTrigger value="advisory" className="gap-1.5 text-xs md:text-sm"><UserCheck className="h-4 w-4" /> Advisory</TabsTrigger>
          </TabsList>

          <TabsContent value="faculty">
            <SectionHeading title="Faculty Members" description="Profiles including photos, designations, educational backgrounds, research interests, and contact emails." />
            <div className="mt-10">
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">Faculty profiles will be updated shortly.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="staff">
            <SectionHeading title="Technical & Admin Staff" description="Details of lab assistants and office staff." />
            <div className="mt-10">
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">Staff details will be updated shortly.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ec">
            <SectionHeading title="BMES Executive Committee" description="Photos and roles of the current student panel." />
            <div className="mt-10">
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">Current EC details will be updated shortly.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="advisory">
            <SectionHeading title="Advisory Board & Past ECs" description="Archival list of previous committees to honor alumni contributions." />
            <div className="mt-10">
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">Advisory board details will be updated shortly.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </PageLayout>
  );
};

export default People;
