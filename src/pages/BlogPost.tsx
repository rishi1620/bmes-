import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, useScroll, useSpring } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import PageLayout from "@/components/layout/PageLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, Clock } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { ShareButtons } from "@/components/shared/ShareButtons";
import LazyImage from "@/components/shared/LazyImage";

const BlogPost = () => {
  const { slug } = useParams();
  const [redirecting, setRedirecting] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .single();
      
      if (error) throw error;
      return data as Tables<"blog_posts">;
    },
  });

  const estimatedReadingTime = useMemo(() => {
    if (!post?.content) return "1 min read";
    const wordsCount = post.content.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(wordsCount / 200));
    return `${minutes} min read`;
  }, [post?.content]);

  useEffect(() => {
    if (post?.external_url) {
      setRedirecting(true);
      window.location.href = post.external_url;
    }
  }, [post]);

  if (isLoading || redirecting) {
    return (
      <PageLayout>
        <div className="container py-16 max-w-3xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-96 w-full rounded-xl" />
          {redirecting && (
            <div className="mt-8 text-center text-muted-foreground animate-pulse">
              Redirecting to external article...
            </div>
          )}
        </div>
      </PageLayout>
    );
  }

  if (!post) {
    return (
      <PageLayout>
        <div className="container py-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <Button asChild>
            <Link to="/blog">Back to Blog</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Smooth reading progress bar fixed at the top of the viewport */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/90 to-accent origin-left z-[60] shadow-[0_1px_4px_rgba(0,0,0,0.15)]"
        style={{ scaleX }}
        aria-label="Reading progress"
        role="progressbar"
      />

      <article className="container py-16 max-w-4xl">
        <Button asChild variant="ghost" className="mb-8 pl-0 hover:bg-transparent hover:text-primary">
          <Link to="/blog" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
        </Button>

        {post.category && (
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            {post.category}
          </span>
        )}

        <h1 className="text-4xl font-bold text-foreground md:text-5xl mb-6 leading-tight">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-6 text-sm text-muted-foreground mb-8 border-b border-border pb-8">
          <div className="flex flex-wrap items-center gap-6">
            {post.author && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{post.author}</span>
              </div>
            )}
            {post.published_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(post.published_at), "MMMM d, yyyy")}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{post.excerpt || estimatedReadingTime}</span>
            </div>
          </div>
          <ShareButtons url={window.location.href} title={post.title} />
        </div>

        {post.featured_image && (
          <div className="mb-10 overflow-hidden rounded-2xl border border-border bg-muted">
            <LazyImage 
              src={post.featured_image} 
              alt={post.title} 
              className="w-full object-cover max-h-[500px]"
              containerClassName="w-full"
              priority={true}
            />
          </div>
        )}

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <ReactMarkdown>{post.content || ""}</ReactMarkdown>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
                <span key={tag} className="rounded-md bg-muted px-3 py-1 text-sm font-medium text-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>
    </PageLayout>
  );
};

export default BlogPost;
