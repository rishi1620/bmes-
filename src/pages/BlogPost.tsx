import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/layout/PageLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, Clock } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

const BlogPost = () => {
  const { slug } = useParams();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container py-16 max-w-3xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-96 w-full rounded-xl" />
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

        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-8 border-b border-border pb-8">
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
          {post.read_time && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{post.read_time} min read</span>
            </div>
          )}
        </div>

        {post.image_url && (
          <div className="mb-10 overflow-hidden rounded-2xl border border-border bg-muted">
            <img 
              src={post.image_url} 
              alt={post.title} 
              className="w-full object-cover max-h-[500px]"
              referrerPolicy="no-referrer"
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
