import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserCheck, GraduationCap, Briefcase, Linkedin, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Person {
  id: string;
  name: string;
  role?: string | null;
  designation?: string | null;
  department?: string | null;
  bio?: string | null;
  email?: string | null;
  linkedin?: string | null;
  image_url?: string | null;
  photo?: string | null;
  team?: string | null;
  role_type?: string | null;
}

const PersonCard = ({ person }: { person: Person }) => (
  <Card className="overflow-hidden transition-all hover:shadow-md h-full flex flex-col">
    <div className="aspect-square w-full overflow-hidden bg-muted relative group">
      {person.image_url || person.photo ? (
        <img
          src={person.image_url || person.photo}
          alt={person.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-primary/10 text-4xl font-bold text-primary">
          {person.name.charAt(0)}
        </div>
      )}
      
      {/* Overlay with social links */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
        {person.linkedin && (
          <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-white rounded-full text-[#0077b5] hover:scale-110 transition-transform">
            <Linkedin className="h-5 w-5" />
          </a>
        )}
        {person.email && (
          <a href={`mailto:${person.email}`} className="p-2 bg-white rounded-full text-primary hover:scale-110 transition-transform">
            <Mail className="h-5 w-5" />
          </a>
        )}
      </div>
    </div>
    <CardContent className="p-5 text-center flex-1 flex flex-col">
      <h3 className="font-bold text-lg line-clamp-1 mb-1">{person.name}</h3>
      <p className="text-sm text-primary font-medium mb-2 line-clamp-1">{person.role || person.designation}</p>
      {person.department && <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{person.department}</p>}
      {person.bio && <p className="text-xs text-muted-foreground line-clamp-3 mt-auto">{person.bio}</p>}
    </CardContent>
  </Card>
);

const People = () => {
  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data } = await supabase
        .from("members")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      return data || [];
    },
  });

  const { data: advisors, isLoading: isLoadingAdvisors } = useQuery({
    queryKey: ["advisors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("advisors")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      return data || [];
    },
  });

  const faculty = advisors?.filter(p => p.role_type === "Faculty") || [];
  const staff = members?.filter(p => p.team === "Staff") || [];
  const advisory = advisors?.filter(p => p.role_type === "Advisor" || p.role_type === "Moderator") || [];

  const isLoading = isLoadingMembers || isLoadingAdvisors;

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
            <TabsTrigger value="ec" className="gap-1.5 text-xs md:text-sm"><Users className="h-4 w-4" /> BMES EC & Members</TabsTrigger>
            <TabsTrigger value="advisory" className="gap-1.5 text-xs md:text-sm"><UserCheck className="h-4 w-4" /> Advisory</TabsTrigger>
          </TabsList>

          <TabsContent value="faculty">
            <SectionHeading title="Faculty Members" description="Profiles including photos, designations, educational backgrounds, research interests, and contact emails." />
            {isLoading ? (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
              </div>
            ) : faculty.length > 0 ? (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {faculty.map((person) => <PersonCard key={person.id} person={person} />)}
              </div>
            ) : (
              <div className="mt-10 text-center p-12 border rounded-xl bg-muted/20">
                <p className="text-muted-foreground">Faculty profiles will be updated shortly.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="staff">
            <SectionHeading title="Technical & Admin Staff" description="Details of lab assistants and office staff." />
            {isLoading ? (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
              </div>
            ) : staff.length > 0 ? (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {staff.map((person) => <PersonCard key={person.id} person={person} />)}
              </div>
            ) : (
              <div className="mt-10 text-center p-12 border rounded-xl bg-muted/20">
                <p className="text-muted-foreground">Staff details will be updated shortly.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ec">
            <SectionHeading title="BMES Executive Committee & Members" description="Photos and roles of the current student panel and members." />
            {isLoading ? (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
              </div>
            ) : members.length > 0 ? (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {members.map((person) => <PersonCard key={person.id} person={person} />)}
              </div>
            ) : (
              <div className="mt-10 text-center p-12 border rounded-xl bg-muted/20">
                <p className="text-muted-foreground">Current EC and member details will be updated shortly.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="advisory">
            <SectionHeading title="Advisory Board & Past ECs" description="Archival list of previous committees to honor alumni contributions." />
            {isLoading ? (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
              </div>
            ) : advisory.length > 0 ? (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {advisory.map((person) => <PersonCard key={person.id} person={person} />)}
              </div>
            ) : (
              <div className="mt-10 text-center p-12 border rounded-xl bg-muted/20">
                <p className="text-muted-foreground">Advisory board details will be updated shortly.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </PageLayout>
  );
};

export default People;

