import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Users, MessageSquare, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const About = () => {
  const { data: settings = {}, isLoading } = useQuery({
    queryKey: ["about-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("setting_group", "about_page");
      const map: Record<string, string> = {};
      data?.forEach((s) => { map[s.setting_key] = s.setting_value || ""; });
      return map;
    },
  });

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <section 
        className="hero-gradient py-16 md:py-24 relative overflow-hidden"
        style={settings.about_hero_bg_image ? {
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.5)), url(${settings.about_hero_bg_image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {}}
      >
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container text-center relative z-10"
        >
          <span className="mb-3 inline-block rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground/90">
            About Us
          </span>
          <h1 className="text-4xl font-extrabold text-primary-foreground md:text-5xl">
            {settings.about_hero_title || "Department & Society"}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80 leading-relaxed whitespace-pre-wrap">
            {settings.about_hero_subtitle || "Discover the foundational information for both the Department of Biomedical Engineering and the BMES club."}
          </p>
        </motion.div>
      </section>

      <section className="container py-16">
        <Tabs defaultValue="messages" className="w-full">
          <div className="flex justify-center mb-10">
            <TabsList className="h-auto flex-wrap justify-center gap-2 bg-slate-200/50 dark:bg-slate-900/50 p-1.5 backdrop-blur-sm border border-slate-300/50 dark:border-slate-800 rounded-2xl">
              <TabsTrigger value="messages" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-slate-600 dark:text-slate-400 gap-1.5 text-xs md:text-sm">
                <MessageSquare className="h-4 w-4" /> {settings.about_tab_messages || "Messages"}
              </TabsTrigger>
              <TabsTrigger value="dept" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-slate-600 dark:text-slate-400 gap-1.5 text-xs md:text-sm">
                <Building className="h-4 w-4" /> {settings.about_tab_dept || "Dept Profile"}
              </TabsTrigger>
              <TabsTrigger value="bmes" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-slate-600 dark:text-slate-400 gap-1.5 text-xs md:text-sm">
                <Users className="h-4 w-4" /> {settings.about_tab_bmes || "BMES Profile"}
              </TabsTrigger>
              <TabsTrigger value="constitution" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-slate-600 dark:text-slate-400 gap-1.5 text-xs md:text-sm">
                <FileText className="h-4 w-4" /> {settings.about_tab_constitution || "Constitution"}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="messages">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <SectionHeading 
                title={settings.about_messages_title || "Leadership Messages"} 
                description={settings.about_messages_desc || "Welcome notes from the Head of the Department and BMES President."} 
              />
              <div className="mt-10 grid gap-8 md:grid-cols-2">
                <Card className="overflow-hidden">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">{settings.about_hod_title || "Message from the Head of the Department"}</h3>
                    <div className="prose prose-sm dark:prose-invert">
                      <p className="italic text-muted-foreground whitespace-pre-wrap">
                        "{settings.about_hod_message || "Welcome to the Department of Biomedical Engineering at CUET. Our mission is to bridge the gap between engineering and medicine to improve healthcare outcomes..."}"
                      </p>
                    </div>
                    <div className="mt-6 flex items-center gap-4">
                      {settings.about_hod_image ? (
                        <img src={settings.about_hod_image} alt={settings.about_hod_name} className="h-12 w-12 rounded-full object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">HOD</div>
                      )}
                      <div>
                        <p className="font-semibold">{settings.about_hod_name || "Prof. Dr. [Name]"}</p>
                        <p className="text-xs text-muted-foreground">{settings.about_hod_role || "Head, Dept. of BME, CUET"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">{settings.about_pres_title || "Message from the BMES President"}</h3>
                    <div className="prose prose-sm dark:prose-invert">
                      <p className="italic text-muted-foreground whitespace-pre-wrap">
                        "{settings.about_pres_message || "The Biomedical Engineering Society (BMES) is dedicated to fostering innovation, collaboration, and professional development among our students..."}"
                      </p>
                    </div>
                    <div className="mt-6 flex items-center gap-4">
                      {settings.about_pres_image ? (
                        <img src={settings.about_pres_image} alt={settings.about_pres_name} className="h-12 w-12 rounded-full object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">PRES</div>
                      )}
                      <div>
                        <p className="font-semibold">{settings.about_pres_name || "[Student Name]"}</p>
                        <p className="text-xs text-muted-foreground">{settings.about_pres_role || "President, BMES"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="dept">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <SectionHeading 
                title={settings.about_dept_title || "Department Profile"} 
                description={settings.about_dept_desc || "Mission, vision, and the history of BME at CUET."} 
              />
              <div className="mt-10 space-y-6">
                <Card>
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">{settings.about_dept_history_title || "History"}</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {settings.about_dept_history || "The Department of Biomedical Engineering at CUET was established to address the growing need for healthcare technology professionals in Bangladesh..."}
                    </p>
                  </CardContent>
                </Card>
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardContent className="p-8">
                      <h3 className="text-xl font-bold mb-4 text-primary">{settings.about_dept_mission_title || "Mission"}</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {settings.about_dept_mission || "To provide world-class education and conduct cutting-edge research in biomedical engineering."}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-8">
                      <h3 className="text-xl font-bold mb-4 text-primary">{settings.about_dept_vision_title || "Vision"}</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {settings.about_dept_vision || "To be a globally recognized center of excellence in biomedical engineering education and innovation."}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="bmes">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <SectionHeading 
                title={settings.about_bmes_title || "BMES Profile"} 
                description={settings.about_bmes_desc || "The society's history and objectives."} 
              />
              <div className="mt-10 space-y-6">
                <Card>
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">{settings.about_bmes_about_title || "About BMES"}</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {settings.about_bmes_about || "The Biomedical Engineering Society (BMES) at CUET is a student-run organization that aims to promote biomedical engineering through various activities, seminars, and workshops."}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">{settings.about_bmes_objectives_title || "Objectives"}</h3>
                    <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                      {settings.about_bmes_objectives ? (
                        settings.about_bmes_objectives.split('\n').filter(Boolean).map((obj, i) => (
                          <li key={i}>{obj}</li>
                        ))
                      ) : (
                        <>
                          <li>Organize technical seminars and workshops.</li>
                          <li>Facilitate industry-academia collaboration.</li>
                          <li>Promote research and innovation among students.</li>
                          <li>Host the annual BME Fest.</li>
                        </>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="constitution">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <SectionHeading 
                title={settings.about_constitution_title || "Official Constitution"} 
                description={settings.about_constitution_desc_main || "Download the official constitution of BMES."} 
              />
              <div className="mt-10 text-center">
                <Card>
                  <CardContent className="p-12 flex flex-col items-center justify-center">
                    <FileText className="h-16 w-16 text-primary mb-6" />
                    <h3 className="text-2xl font-bold mb-2">{settings.about_constitution_card_title || "BMES Constitution"}</h3>
                    <p className="text-muted-foreground mb-6 max-w-md whitespace-pre-wrap">{settings.about_constitution_desc || "Read the rules, regulations, and operational guidelines of the Biomedical Engineering Society."}</p>
                    {settings.about_constitution_pdf_url ? (
                      <a 
                        href={settings.about_constitution_pdf_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                      >
                        {settings.about_constitution_btn_text || "Download PDF"}
                      </a>
                    ) : (
                      <button disabled className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                        PDF Not Available
                      </button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </section>
    </PageLayout>
  );
};

export default About;
