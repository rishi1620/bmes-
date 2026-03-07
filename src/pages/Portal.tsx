import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Bell, BookOpen, Download, UserPlus, ExternalLink } from "lucide-react";

const Portal = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("setting_group", "portal_page");
      const map: Record<string, string> = {};
      data?.forEach((s) => { map[s.setting_key] = s.setting_value; });
      setSettings(map);
      setLoading(false);
    };
    load();
  }, []);

  const softwareLinks = (() => {
    try {
      return JSON.parse(settings.portal_software_json || "[]");
    } catch {
      return [];
    }
  })();

  const libraryLinks = (() => {
    try {
      return JSON.parse(settings.portal_library_json || "[]");
    } catch {
      return [];
    }
  })();

  return (
    <PageLayout>
      <section className="hero-gradient py-16 md:py-24">
        <div className="container text-center">
          <span className="mb-3 inline-block rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground/90">
            Student Portal / Resources
          </span>
          <h1 className="text-4xl font-extrabold text-primary-foreground md:text-5xl">
            {settings.portal_hero_title || "Interactive Zone"}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80 leading-relaxed whitespace-pre-wrap">
            {settings.portal_hero_subtitle || "A highly practical section driving daily traffic to your site."}
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
                  {settings.portal_notices_content ? (
                    <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                      {settings.portal_notices_content}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">Notice board will be updated shortly.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="library">
            <SectionHeading title="Resource Library" description="Gated or open access to lecture notes, reference books, and previous years' question banks." />
            <div className="mt-10 space-y-8">
              {settings.portal_library_content && (
                <Card>
                  <CardContent className="p-6">
                    <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                      {settings.portal_library_content}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {libraryLinks.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {libraryLinks.map((item: { title: string; url: string; description: string; category: string }, i: number) => (
                    <Card key={i} className="flex flex-col">
                      <CardHeader className="pb-3">
                        <div className="mb-2">
                          <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary uppercase tracking-wider">
                            {item.category || "Document"}
                          </span>
                        </div>
                        <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col">
                        <p className="text-muted-foreground text-sm mb-4 flex-1">{item.description}</p>
                        {item.url && (
                          <Button asChild variant="outline" className="w-full mt-auto" size="sm">
                            <a href={item.url} target="_blank" rel="noopener noreferrer">
                              <Download className="mr-2 h-4 w-4" /> Download / View
                            </a>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                !settings.portal_library_content && (
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-center text-muted-foreground">Resource library will be available soon.</p>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </TabsContent>

          <TabsContent value="software">
            <SectionHeading title="Software Links" description="Guides and links to university-licensed software." />
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {softwareLinks.length > 0 ? (
                softwareLinks.map((item: { title: string; url: string; description: string }, i: number) => (
                  <Card key={i} className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {item.title}
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-muted-foreground text-sm">{item.description}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <>
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
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="membership">
            <SectionHeading title="Membership Portal" description="Information on how to join BMES, membership benefits, and an online registration/renewal form." />
            <div className="mt-10">
              <Card>
                <CardContent className="p-6 space-y-6">
                  {settings.portal_membership_content ? (
                    <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                      {settings.portal_membership_content}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">Membership portal will be available soon.</p>
                  )}
                  
                  {settings.portal_membership_url && (
                    <div className="flex justify-center">
                      <Button asChild size="lg">
                        <a href={settings.portal_membership_url} target="_blank" rel="noopener noreferrer">
                          Register / Renew Membership
                        </a>
                      </Button>
                    </div>
                  )}
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
