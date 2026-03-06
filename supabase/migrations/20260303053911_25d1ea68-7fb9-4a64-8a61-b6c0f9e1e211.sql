
-- Blog posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  excerpt TEXT DEFAULT '',
  featured_image TEXT DEFAULT '',
  category TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  author TEXT DEFAULT '',
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published blog posts" ON public.blog_posts
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can do anything with blog posts" ON public.blog_posts
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Site settings table (key-value store)
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT DEFAULT '',
  setting_group TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read site settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage site settings" ON public.site_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Contact form submissions
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT DEFAULT '',
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage submissions" ON public.contact_submissions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Media storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

CREATE POLICY "Public can view media" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Admins can upload media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete media" ON storage.objects
  FOR DELETE USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));

-- Seed default site settings
INSERT INTO public.site_settings (setting_key, setting_value, setting_group) VALUES
  ('site_title', 'BMES CUET', 'branding'),
  ('meta_description', 'BMES CUET Student Chapter', 'seo'),
  ('logo_url', '', 'branding'),
  ('favicon_url', '', 'branding'),
  ('facebook_url', '', 'social'),
  ('instagram_url', '', 'social'),
  ('linkedin_url', '', 'social'),
  ('twitter_url', '', 'social'),
  ('youtube_url', '', 'social'),
  ('footer_text', '© BMES CUET Student Chapter. All rights reserved.', 'branding'),
  ('contact_email', '', 'general'),
  ('contact_phone', '', 'general'),
  ('contact_address', '', 'general');
