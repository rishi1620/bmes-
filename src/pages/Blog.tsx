import { Clock, User, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/layout/PageLayout";
import SectionHeading from "@/components/shared/SectionHeading";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { motion } from "framer-motion";

const Blog = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

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
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <PageLayout>
      <section className="hero-gradient py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container text-center"
        >
          <h1 className="text-4xl font-bold text-primary-foreground md:text-5xl">Blog</h1>
          <p className="mt-4 text-primary-foreground/80 max-w-2xl mx-auto">Insights, tutorials, and stories from the CUET biomedical engineering community.</p>
        </motion.div>
      </section>

      <section className="container py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <SectionHeading badge="Latest" title="Recent Articles" />
        </motion.div>
        
        {isLoading ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : !posts?.length ? (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 text-center text-muted-foreground"
          >
            No blog posts published yet. Check back soon!
          </motion.p>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mt-10 grid gap-6 md:grid-cols-2"
          >
            {posts.map((p) => (
              <motion.article 
                variants={itemVariants}
                key={p.id} 
                className="group rounded-xl border border-border bg-card overflow-hidden shadow-elevated transition-all hover:shadow-glow hover:-translate-y-1 flex flex-col h-full"
              >
                {p.featured_image && (
                  <div className="aspect-video w-full overflow-hidden border-b">
                    <img 
                      src={p.featured_image} 
                      alt={p.title} 
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  <div>
                    {p.category && (
                      <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{p.category}</span>
                    )}
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">{p.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {p.excerpt}
                      {p.external_url ? (
                        <a href={p.external_url} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold ml-1 hover:underline inline-flex items-center gap-1">
                          Read More <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <Link to={`/blog/${p.slug}`} className="text-primary font-semibold ml-1 hover:underline">Read More</Link>
                      )}
                    </p>
                  </div>
                  
                  <div className="mt-auto pt-4">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    {p.author && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{p.author}</span>}
                    {p.published_at && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{format(new Date(p.published_at), "MMM d, yyyy")}</span>}
                  </div>
                  {p.tags && p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {p.tags.map((tag: string) => (
                        <span key={tag} className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                  )}
                  <Button asChild variant="link" className="p-0 h-auto font-semibold text-primary hover:text-primary/80">
                    {p.external_url ? (
                      <a href={p.external_url} target="_blank" rel="noopener noreferrer">
                        Read Article <ExternalLink className="ml-1 h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <Link to={`/blog/${p.slug}`}>Read Article <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
                    )}
                  </Button>
                </div>
              </div>
            </motion.article>
            ))}
          </motion.div>
        )}
      </section>
    </PageLayout>
  );
};

export default Blog;
