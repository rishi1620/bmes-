import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Users, FlaskConical, Calendar, Award, Microscope, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import StatCard from "@/components/shared/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { CountdownTimer } from "@/components/shared/CountdownTimer";
import { RegistrationForm } from "@/components/shared/RegistrationForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tables } from "@/integrations/supabase/types";
import heroBg from "@/assets/hero-bg.jpg";
import { motion } from "framer-motion";

const iconMap: Record<string, React.ElementType> = {
  FlaskConical, Users, Calendar, BookOpen, Award, Microscope,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

const Index = () => {
  const [selectedEvent, setSelectedEvent] = useState<Tables<"events"> | null>(null);
  const [isRegOpen, setIsRegOpen] = useState(false);

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getSection = (key: string) => (sections?.find((s) => s.section_key === key)?.section_data || {}) as Record<string, any>;

  const hero = getSection("hero");
  const quickLinks = getSection("quick_links");
  const announcements = getSection("announcements");
  const upcomingEvents = getSection("upcoming_events");
  const recentAchievementsSection = getSection("recent_achievements");
  const featuredProjectsSection = getSection("featured_projects");
  const recentBlogSection = getSection("recent_blog");
  const stats = getSection("stats");
  const features = getSection("features");
  const cta = getSection("cta");

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
            <motion.img 
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 10, ease: "easeOut" }}
              src={(hero.background_image as string) || heroBg} 
              alt="" 
              className="h-full w-full object-cover" 
            />
            <div className="absolute inset-0 hero-gradient opacity-85" />
          </div>
          <div className="container relative z-10 flex flex-col items-center py-16 text-center md:py-24">
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-4 inline-block rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground/90"
            >
              {hero.subtitle as string}
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-4xl text-3xl font-extrabold leading-tight text-primary-foreground sm:text-4xl md:text-6xl"
            >
              {hero.title as string}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6 max-w-2xl text-base text-primary-foreground/80 md:text-lg leading-relaxed"
            >
              {hero.description as string}
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-8 flex flex-wrap gap-4 justify-center"
            >
              {hero.button_text && (
                <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold">
                  <Link to="/portal?tab=membership">{hero.button_text as string} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* Quick Links */}
      {quickLinks?.links && (
        <section className="container mt-8 relative z-20">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-4 md:grid-cols-4"
          >
            {(quickLinks.links as Record<string, string>[]).map((link) => (
              <motion.div key={link.label} variants={itemVariants}>
                <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2 bg-card hover:bg-primary/5 hover:text-primary transition-colors shadow-sm w-full">
                  <Link to={link.url}>
                    <span className="font-semibold">{link.label}</span>
                  </Link>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* Latest Announcements */}
      {announcements && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="container py-8"
        >
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
        </motion.section>
      )}

      {/* Dynamic Upcoming Events */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="container py-8 bg-muted/30 rounded-3xl mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <SectionHeading 
            title={upcomingEvents?.title as string || "Upcoming Events"} 
            description={upcomingEvents?.description as string || "Join us for our next major gatherings and workshops."} 
            align="left" 
            className="mb-0" 
          />
          <Button asChild variant="outline" className="group">
            <Link to="/events">
              See All Events
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {isLoadingEvents ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        ) : recentEvents && recentEvents.length > 0 ? (
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Featured Event */}
            <div className="lg:col-span-4">
              {recentEvents[0] && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="relative h-full min-h-[300px] sm:min-h-[400px] overflow-hidden rounded-3xl bg-[#3E82A7] p-8 text-white shadow-xl flex flex-col"
                >
                  <div className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-90">
                    <Bell className="h-4 w-4" />
                    Next Major Event
                  </div>
                  <h3 className="mb-8 text-3xl font-bold leading-tight">
                    {recentEvents[0].title}
                  </h3>
                  
                  <div className="mb-auto">
                    <CountdownTimer targetDate={recentEvents[0].date} />
                  </div>

                  <div className="mt-8">
                    <Dialog open={isRegOpen && selectedEvent?.id === recentEvents[0].id} onOpenChange={(open) => {
                      setIsRegOpen(open);
                      if (open) setSelectedEvent(recentEvents[0] as Tables<"events">);
                    }}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-white text-[#3E82A7] hover:bg-white/90 font-bold py-6 text-lg rounded-xl">
                          Register Now
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Register for {recentEvents[0].title}</DialogTitle>
                        </DialogHeader>
                        <RegistrationForm 
                          eventId={recentEvents[0].id} 
                          eventTitle={recentEvents[0].title} 
                          onSuccess={() => setIsRegOpen(false)} 
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Other Events */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="lg:col-span-8 grid gap-6 md:grid-cols-2"
            >
              {recentEvents.slice(1, 3).map((event: Tables<"events">) => (
                <motion.div key={event.id} variants={itemVariants} className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={event.image_url || "https://picsum.photos/seed/event/800/600"} 
                      alt={event.title} 
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <p className="text-sm font-bold">{format(new Date(event.date), "MMM dd, yyyy")}</p>
                    </div>
                    {event.location && (
                      <div className="absolute bottom-4 right-4 rounded-lg bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        {event.location}
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="mb-2 text-xl font-bold text-foreground line-clamp-1">{event.title}</h3>
                    <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(event.date), "hh:mm a")}
                    </div>
                    <Button asChild variant="outline" className="w-full rounded-xl py-6 font-semibold border-border hover:bg-primary/5 hover:text-primary">
                      <Link to="/events">View Details</Link>
                    </Button>
                  </div>
                </motion.div>
              ))}
              {recentEvents.length === 1 && (
                <div className="flex items-center justify-center rounded-3xl border border-dashed border-border bg-muted/20 p-8 text-center md:col-span-2">
                  <p className="text-muted-foreground">Stay tuned for more upcoming events!</p>
                </div>
              )}
            </motion.div>
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-sm">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No upcoming events scheduled.</p>
            <Button asChild variant="link" className="mt-2">
              <Link to="/events">Check past events</Link>
            </Button>
          </div>
        )}
      </motion.section>

      {/* Dynamic Achievements */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="container py-8 bg-muted/30 rounded-3xl mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <SectionHeading 
            title={recentAchievementsSection?.title as string || "Recent Achievements"} 
            description={recentAchievementsSection?.description as string || "Celebrating our latest recognition and impact."} 
            align="left" 
            className="mb-0" 
          />
          <Button asChild variant="outline" className="group">
            <Link to="/achievements">
              See All Achievements
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
        {isLoadingAchievements ? (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-3xl" />)}
          </div>
        ) : recentAchievements && recentAchievements.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-10 grid gap-6 md:grid-cols-3"
          >
            {recentAchievements.map((achievement: Record<string, unknown>) => (
              <motion.div key={achievement.id as string} variants={itemVariants} className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={(achievement.image_url as string) || `https://picsum.photos/seed/${achievement.id}/800/600`} 
                    alt={achievement.title as string} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <span className="inline-block rounded-full bg-primary/90 px-2 py-0.5 text-xs font-semibold text-primary-foreground capitalize backdrop-blur-sm">
                      {achievement.category as string}
                    </span>
                  </div>
                  {(achievement.year || achievement.date_text) && (
                    <div className="absolute bottom-4 right-4 rounded-lg bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      {(achievement.year || achievement.date_text) as string}
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="mb-2 text-xl font-bold text-foreground line-clamp-1" title={achievement.title as string}>
                    {achievement.title as string}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 line-clamp-2">
                    {(achievement.description || achievement.authors) as string}
                  </p>
                  <Button asChild variant="outline" className="w-full rounded-xl py-6 font-semibold border-border hover:bg-primary/5 hover:text-primary">
                    <Link to="/achievements">View Details</Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="mt-10 rounded-xl border border-border bg-card p-6 shadow-sm text-center">
            <p className="text-sm text-muted-foreground italic">No recent achievements recorded.</p>
          </div>
        )}
      </motion.section>

      {/* Dynamic Featured Projects */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="container py-8 mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <SectionHeading 
            title={featuredProjectsSection?.title as string || "Featured Projects"} 
            description={featuredProjectsSection?.description as string || "Innovative solutions developed by our members."} 
            align="left" 
            className="mb-0" 
          />
          <Button asChild variant="outline" className="group">
            <Link to="/projects">
              See All Projects
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
        {isLoadingProjects ? (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : featuredProjects && featuredProjects.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-10 grid gap-6 md:grid-cols-3"
          >
            {featuredProjects.map((project: Record<string, unknown>) => (
              <motion.div key={project.id as string} variants={itemVariants} className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col transition-all hover:shadow-glow hover:-translate-y-1">
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary capitalize">{project.category as string}</span>
                  <span className="text-xs font-medium text-muted-foreground">{project.status as string}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{project.title as string}</h3>
                {project.lead && <p className="text-xs text-muted-foreground mb-1">Lead: {project.lead as string}</p>}
                {Array.isArray(project.team_members) && (project.team_members as string[]).length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {(project.team_members as string[]).map((member, i) => (
                      <span key={i} className="text-[9px] bg-muted px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground">
                        {member}
                      </span>
                    ))}
                  </div>
                )}
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
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="mt-10 rounded-xl border border-border bg-card p-6 shadow-sm text-center">
            <p className="text-sm text-muted-foreground italic">No featured projects available.</p>
          </div>
        )}
      </motion.section>

      {/* Dynamic Blog Previews */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="container py-8 bg-muted/30 rounded-3xl mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <SectionHeading 
            title={recentBlogSection?.title as string || "Latest from the Blog"} 
            description={recentBlogSection?.description as string || "Insights, news, and stories from our community."} 
            align="left" 
            className="mb-0" 
          />
          <Button asChild variant="outline" className="group">
            <Link to="/blog">
              See All Posts
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
        {isLoadingBlog ? (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : recentBlogPosts && recentBlogPosts.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-10 grid gap-6 md:grid-cols-3"
          >
            {recentBlogPosts.map((post: Record<string, unknown>) => (
              <motion.div key={post.id as string} variants={itemVariants} className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col transition-all hover:shadow-glow hover:-translate-y-1">
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary capitalize">{post.category as string}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{post.title as string}</h3>
                <p className="text-sm text-primary font-medium mb-3">{format(new Date(post.created_at as string), "PPP")}</p>
                <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-3">{post.excerpt as string}</p>
                <Button asChild variant="outline" size="sm" className="w-full mt-auto">
                  <Link to={`/blog/${post.slug}`}>Read More</Link>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="mt-10 rounded-xl border border-border bg-card p-6 shadow-sm text-center">
            <p className="text-sm text-muted-foreground italic">No recent blog posts available.</p>
          </div>
        )}
      </motion.section>

      {/* Stats */}
      {stats?.items && (
        <section className="container -mt-12 relative z-20">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-4 md:grid-cols-4"
          >
            {stats.items.map((s: { label: string; value: string }) => (
              <motion.div key={s.label} variants={itemVariants}>
                <StatCard value={s.value} label={s.label} />
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* Features */}
      {features && (
        <section className="container py-12">
          <SectionHeading badge={features.badge} title={features.title} description={features.description} />
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {features.items?.map((f: { title: string; icon: string; desc: string }) => {
              const Icon = iconMap[f.icon] || FlaskConical;
              return (
                <motion.div key={f.title} variants={itemVariants} className="group rounded-xl border border-border bg-card p-6 shadow-elevated transition-all hover:shadow-glow hover:-translate-y-1">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </section>
      )}

      {/* CTA */}
      {cta && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="hero-gradient py-10"
        >
          <div className="container text-center">
            <h2 className="text-3xl font-bold text-primary-foreground">{cta.title}</h2>
            <p className="mt-3 text-primary-foreground/80">{cta.description}</p>
            {cta.button_text && (
              <Button asChild size="lg" className="mt-6 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold">
                <Link to="/portal?tab=membership">{cta.button_text} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            )}
          </div>
        </motion.section>
      )}
    </PageLayout>
  );
};

export default Index;
