import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Skeleton } from "@/components/ui/skeleton";

const Members = () => {
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["public-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const executive = members.filter((m) =>
    ["President", "Vice President", "Secretary", "Treasurer", "General Secretary"].some((r) =>
      m.role.toLowerCase().includes(r.toLowerCase())
    )
  );
  const teamMembers = members.filter((m) => !executive.includes(m));

  // Group team members by team
  const teams = teamMembers.reduce<Record<string, typeof teamMembers>>((acc, m) => {
    const team = m.team || "General";
    if (!acc[team]) acc[team] = [];
    acc[team].push(m);
    return acc;
  }, {});

  return (
    <PageLayout>
      <section className="hero-gradient py-16">
        <div className="container text-center">
          <h1 className="text-4xl font-bold text-primary-foreground md:text-5xl">Our Members</h1>
          <p className="mt-4 text-primary-foreground/80 max-w-2xl mx-auto">Meet the passionate students driving CUET BMES forward.</p>
        </div>
      </section>

      <section className="container py-16">
        <SectionHeading badge="Leadership" title="Executive Committee" />
        {isLoading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : executive.length === 0 ? (
          <p className="mt-10 text-center text-muted-foreground">No executive members found.</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {executive.map((e) => (
              <div key={e.id} className="group rounded-xl border border-border bg-card p-6 text-center shadow-elevated transition-all hover:shadow-glow hover:-translate-y-1">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
                  {e.name.split(" ").map(n => n[0]).join("")}
                </div>
                <h3 className="font-semibold text-foreground">{e.name}</h3>
                <p className="text-sm font-medium text-primary">{e.role}</p>
                {e.department && <p className="mt-1 text-xs text-muted-foreground">{e.department}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {Object.keys(teams).length > 0 && (
        <section className="bg-muted/50 py-16">
          <div className="container">
            <SectionHeading badge="Teams" title="Technical & Operations" />
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {Object.entries(teams).map(([teamName, teamList]) => (
                <div key={teamName} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-elevated">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg">
                    {teamList.length}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{teamName}</h3>
                    <p className="text-sm text-muted-foreground">{teamList.length} members</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container py-16 text-center">
        <SectionHeading badge="Join Us" title="Become a Member" description="Interested in biomedical engineering? Join BMES and become part of our growing community of innovators." />
        <a href="/contact" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          Apply for Membership
        </a>
      </section>
    </PageLayout>
  );
};

export default Members;
