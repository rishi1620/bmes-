import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Calendar, Users } from "lucide-react";
import Markdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";

interface Notice {
  title: string;
  content: string;
  date: string;
  category?: "departmental" | "club";
}

const Notices = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("*")
          .eq("setting_group", "portal_page");
        
        if (error) throw error;

        const map: Record<string, string> = {};
        data?.forEach((s) => { map[s.setting_key] = s.setting_value || ""; });
        setSettings(map);
      } catch (error) {
        console.error("Error loading notices data:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const notices = (() => {
    try {
      return JSON.parse(settings.portal_notices_json || "[]");
    } catch {
      return [];
    }
  })();

  if (loading) {
    return (
      <PageLayout>
        <div className="container py-24 text-center">
          <p>Loading notices...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <section className="hero-gradient py-16 md:py-24">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="mb-3 inline-block rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground/90">
              Announcements
            </span>
            <h1 className="text-4xl font-extrabold text-primary-foreground md:text-5xl">
              Notice Board
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80 leading-relaxed">
              {settings.portal_notices_content || "Stay updated with the latest departmental and club news."}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Departmental Notices */}
          <Card className="overflow-hidden border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3 text-slate-900 dark:text-slate-100">
                  <BookOpen className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-bold">{settings.portal_dept_notices_title || "Departmental Notices"}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {notices.filter((n: Notice) => n.category === "departmental" || !n.category).length > 0 ? (
                notices
                  .filter((n: Notice) => n.category === "departmental" || !n.category)
                  .map((notice: Notice, i: number) => (
                    <Dialog key={i}>
                      <DialogTrigger asChild>
                        <div className="group cursor-pointer border-b border-border/50 pb-4 last:border-0 last:pb-0">
                          <h3 className="font-semibold text-lg group-hover:text-emerald-500 transition-colors line-clamp-1">{notice.title}</h3>
                          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="text-sm">{notice.date}</span>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold text-emerald-600">{notice.title}</DialogTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                            <Calendar className="h-4 w-4" />
                            {notice.date}
                          </div>
                        </DialogHeader>
                        <div className="mt-6 prose dark:prose-invert max-w-none">
                          <Markdown>{notice.content}</Markdown>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))
              ) : (
                <p className="text-muted-foreground text-sm italic">No departmental notices found.</p>
              )}
            </CardContent>
          </Card>

          {/* Club News */}
          <Card className="overflow-hidden border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 text-emerald-600 dark:text-emerald-400">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-bold">{settings.portal_club_news_title || "Club News"}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {notices.filter((n: Notice) => n.category === "club").length > 0 ? (
                notices
                  .filter((n: Notice) => n.category === "club")
                  .map((notice: Notice, i: number) => (
                    <Dialog key={i}>
                      <DialogTrigger asChild>
                        <div className="group cursor-pointer border-b border-border/50 pb-4 last:border-0 last:pb-0">
                          <h3 className="font-semibold text-lg group-hover:text-emerald-500 transition-colors line-clamp-1">{notice.title}</h3>
                          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="text-sm">{notice.date}</span>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold text-emerald-600">{notice.title}</DialogTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                            <Calendar className="h-4 w-4" />
                            {notice.date}
                          </div>
                        </DialogHeader>
                        <div className="mt-6 prose dark:prose-invert max-w-none">
                          <Markdown>{notice.content}</Markdown>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))
              ) : (
                <p className="text-muted-foreground text-sm italic">No club news found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </PageLayout>
  );
};

export default Notices;
