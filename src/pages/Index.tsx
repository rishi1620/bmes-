import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Users, FlaskConical, Calendar, Award, Microscope, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import StatCard from "@/components/shared/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import heroBg from "@/assets/hero-bg.jpg";

const iconMap: Record<string, React.ElementType> = {
  FlaskConical, Users, Calendar, BookOpen, Award, Microscope,
};

const Index = () => {
  const { data: sections, isLoading } = useQuery({
    queryKey: ["home-sections"],
    queryFn: async () => {
      const { data } = await supabase
        .from("home_sections")
        .select("*")
        .eq("is_visible", true)
        .order("display_order");
      return data ?? [];
    },
  });

  const { data: recentEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["home-recent-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("is_upcoming", true)
        .order("date", { ascending: true })
        .limit(3);
      return data ?? [];
    },
  });

  const { data: recentAchievements, isLoading: isLoadingAchievements } = useQuery({
    queryKey: ["home-recent-achievements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("achievements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  const { data: featuredProjects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["home-featured-projects"],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .order("progress", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  const { data: recentBlogPosts, isLoading: isLoadingBlog } = useQuery({
    queryKey: ["home-recent-blog"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  const getSection = (key: string) => sections?.find((s) => s.section_key === key)?.section_data as Record<string, unknown> | undefined;

  const hero = getSection("hero");
  const quickLinks = getSection("quick_links");
  const announcements = getSection("announcements");
  const upcomingEvents = getSection("upcoming_events");
  const stats = getSection("stats");
  const features = getSection("features");
  const cta = getSection("cta");
  const notice = getSection("notice");

  if (isLoading || isLoadingEvents || isLoadingAchievements) {
    return (
      <PageLayout>
        <div className="container py-24 space-y-8">
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Hero */}
      {hero && (
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img src={hero.background_image || heroBg} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 hero-gradient opacity-85" />
          </div>
          <div className="container relative z-10 flex flex-col items-center py-24 text-center md:py-36">
            <span className="animate-fade-up mb-4 inline-block rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground/90">
              {hero.subtitle}
            </span>
            <h1 className="animate-fade-up-delay-1 max-w-4xl text-4xl font-extrabold leading-tight text-primary-foreground md:text-6xl">
              {hero.title}
            </h1>
            <p className="animate-fade-up-delay-2 mt-6 max-w-2xl text-base text-primary-foreground/80 md:text-lg leading-relaxed">
              {hero.description}
            </p>
            <div className="animate-fade-up-delay-3 mt-8 flex flex-wrap gap-4 justify-center">
              {hero.button_text && (
                <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold">
                  <Link to={hero.button_link || "/members"}>{hero.button_text} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Quick Links */}
      {quickLinks?.links && (
        <section className="container mt-8 relative z-20">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {(quickLinks.links as Record<string, string>[]).map((link) => (
              <Button key={link.label} asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2 bg-card hover:bg-primary/5 hover:text-primary transition-colors shadow-sm">
                <Link to={link.url}>
                  <span className="font-semibold">{link.label}</span>
                </Link>
              </Button>
            ))}
          </div>
        </section>
      )}

      {/* Latest Announcements */}
      {announcements && (
        <section className="container py-16">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold">{announcements.dept_title || "Departmental Notices"}</h2>
              </div>
              <div className="space-y-4">
                {Array.isArray(announcements.dept_notices) && announcements.dept_notices.length > 0 ? (
                  (announcements.dept_notices as Record<string, string>[]).map((notice, i: number) => (
                    <div key={i} className="border-b border-border pb-3 last:border-0 last:pb-0">
                      <a href={notice.url || "#"} className="group block">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{notice.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{notice.date}</p>
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No recent departmental notices.</p>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold">{announcements.club_title || "Club News"}</h2>
              </div>
              <div className="space-y-4">
                {Array.isArray(announcements.club_news) && announcements.club_news.length > 0 ? (
                  (announcements.club_news as Record<string, string>[]).map((news, i: number) => (
                    <div key={i} className="border-b border-border pb-3 last:border-0 last:pb-0">
                      <a href={news.url || "#"} className="group block">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{news.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{news.date}</p>
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No recent club news.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Dynamic Upcoming Events */}
      <section className="container py-16 bg-muted/30 rounded-3xl mb-8">
        <SectionHeading title="Upcoming Events" description="Seminars, workshops, and fests." />
        {isLoadingEvents ? (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : recentEvents && recentEvents.length > 0 ? (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {recentEvents.map((event: Record<string, string>) => (
              <div key={event.id} className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col transition-all hover:shadow-glow hover:-translate-y-1">
                <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                <p className="text-sm text-primary font-medium mb-3">{format(new Date(event.date), "PPP")}</p>
                <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-2">{event.description}</p>
                <Button asChild variant="outline" size="sm" className="w-full mt-auto">
                  <Link to={`/events`}>View Details</Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-xl border border-border bg-card p-6 shadow-sm text-center">
            <p className="text-sm text-muted-foreground italic">No upcoming events scheduled.</p>
          </div>
        )}
      </section>

      {/* Dynamic Achievements */}
      <section className="container py-16 bg-muted/30 rounded-3xl mb-16">
        <SectionHeading title="Recent Achievements" description="Celebrating our latest recognition and impact." />
        {isLoadingAchievements ? (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : recentAchievements && recentAchievements.length > 0 ? (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {recentAchievements.map((achievement: Record<string, unknown>) => (
              <div key={achievement.id as string} className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col transition-all hover:shadow-glow hover:-translate-y-1">
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary capitalize">{achievement.category as string}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{achievement.title as string}</h3>
                <p className="text-sm text-primary font-medium mb-3">{(achievement.year || achievement.date_text || "Recent") as string}</p>
                <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-2">{(achievement.description || achievement.authors) as string}</p>
                <Button asChild variant="outline" size="sm" className="w-full mt-auto">
                  <Link to={`/achievements`}>View Details</Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-xl border border-border bg-card p-6 shadow-sm text-center">
            <p className="text-sm text-muted-foreground italic">No recent achievements recorded.</p>
          </div>
        )}
      </section>

      {/* Dynamic Featured Projects */}
      <section className="container py-16 mb-16">
        <SectionHeading title="Featured Projects" description="Innovative solutions developed by our members." />
        {isLoadingProjects ? (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : featuredProjects && featuredProjects.length > 0 ? (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {featuredProjects.map((project: Record<string, unknown>) => (
              <div key={project.id as string} className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col transition-all hover:shadow-glow hover:-translate-y-1">
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary capitalize">{project.category as string}</span>
                  <span className="text-xs font-medium text-muted-foreground">{project.status as string}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{project.title as string}</h3>
                <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-2">{project.description as string}</p>
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>{project.progress as number}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full mt-auto">
                  <Link to={`/projects`}>View Project</Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-xl border border-border bg-card p-6 shadow-sm text-center">
            <p className="text-sm text-muted-foreground italic">No featured projects available.</p>
          </div>
        )}
      </section>

      {/* Dynamic Blog Previews */}
      <section className="container py-16 bg-muted/30 rounded-3xl mb-16">
        <SectionHeading title="Latest from the Blog" description="Insights, news, and stories from our community." />
        {isLoadingBlog ? (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : recentBlogPosts && recentBlogPosts.length > 0 ? (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {recentBlogPosts.map((post: Record<string, unknown>) => (
              <div key={post.id as string} className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col transition-all hover:shadow-glow hover:-translate-y-1">
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary capitalize">{post.category as string}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{post.title as string}</h3>
                <p className="text-sm text-primary font-medium mb-3">{format(new Date(post.created_at as string), "PPP")}</p>
                <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-3">{post.excerpt as string}</p>
                <Button asChild variant="outline" size="sm" className="w-full mt-auto">
                  <Link to={`/blog/${post.slug}`}>Read More</Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-xl border border-border bg-card p-6 shadow-sm text-center">
            <p className="text-sm text-muted-foreground italic">No recent blog posts available.</p>
          </div>
        )}
      </section>

      {/* Notice (Legacy) */}
      {notice && (
        <section className="container mt-8 relative z-20">
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/20">
            <div className="flex items-start gap-4">
              <div className="mt-1 rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                <Bell className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">{notice.title || "Notice"}</h3>
                <p className="mt-2 text-sm text-blue-800/80 dark:text-blue-200/80 leading-relaxed whitespace-pre-wrap">
                  {notice.content}
                </p>
                {notice.link_text && notice.link_url && (
                  <Button asChild variant="link" className="mt-2 h-auto p-0 text-blue-600 dark:text-blue-400">
                    <Link to={notice.link_url}>{notice.link_text} <ArrowRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats */}
      {stats?.items && (
        <section className="container -mt-12 relative z-20">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.items.map((s: Record<string, unknown>) => (
              <StatCard key={s.label} value={s.value} label={s.label} />
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      {features && (
        <section className="container py-20">
          <SectionHeading badge={features.badge} title={features.title} description={features.description} />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.items?.map((f: Record<string, unknown>) => {
              const Icon = iconMap[f.icon] || FlaskConical;
              return (
                <div key={f.title} className="group rounded-xl border border-border bg-card p-6 shadow-elevated transition-all hover:shadow-glow hover:-translate-y-1">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* CTA */}
      {cta && (
        <section className="hero-gradient py-16">
          <div className="container text-center">
            <h2 className="text-3xl font-bold text-primary-foreground">{cta.title}</h2>
            <p className="mt-3 text-primary-foreground/80">{cta.description}</p>
            {cta.button_text && (
              <Button asChild size="lg" className="mt-6 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold">
                <Link to={cta.button_link || "/contact"}>{cta.button_text} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            )}
          </div>
        </section>
      )}
    </PageLayout>
  );
};

export default Index;
