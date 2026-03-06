
-- Add new role values
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'content_manager';

-- Home sections (key-value for dynamic home page)
CREATE TABLE public.home_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  section_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_visible boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read visible home sections" ON public.home_sections FOR SELECT USING (is_visible = true);
CREATE POLICY "Admins can manage home sections" ON public.home_sections FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_home_sections_updated_at BEFORE UPDATE ON public.home_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Advisors table
CREATE TABLE public.advisors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  photo text DEFAULT '',
  designation text DEFAULT '',
  department text DEFAULT '',
  role_type text NOT NULL DEFAULT 'Advisor',
  bio text DEFAULT '',
  email text DEFAULT '',
  linkedin text DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.advisors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active advisors" ON public.advisors FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can insert advisors" ON public.advisors FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update advisors" ON public.advisors FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete advisors" ON public.advisors FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_advisors_updated_at BEFORE UPDATE ON public.advisors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Alumni table
CREATE TABLE public.alumni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  photo text DEFAULT '',
  batch text DEFAULT '',
  current_position text DEFAULT '',
  organization text DEFAULT '',
  linkedin text DEFAULT '',
  testimonial text DEFAULT '',
  location text DEFAULT '',
  is_featured boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.alumni ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read alumni" ON public.alumni FOR SELECT USING (true);
CREATE POLICY "Admins can insert alumni" ON public.alumni FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update alumni" ON public.alumni FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete alumni" ON public.alumni FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_alumni_updated_at BEFORE UPDATE ON public.alumni FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Pages table for navigation management
CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  is_visible boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read visible pages" ON public.pages FOR SELECT USING (is_visible = true);
CREATE POLICY "Admins can manage pages" ON public.pages FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Media library tracking table
CREATE TABLE public.media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text DEFAULT '',
  file_size bigint DEFAULT 0,
  folder text DEFAULT '',
  alt_text text DEFAULT '',
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read media" ON public.media_library FOR SELECT USING (true);
CREATE POLICY "Admins can insert media" ON public.media_library FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update media" ON public.media_library FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete media" ON public.media_library FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default home sections
INSERT INTO public.home_sections (section_key, section_data, display_order) VALUES
('hero', '{"title":"Biomedical Engineering Society","subtitle":"Chittagong University of Engineering & Technology","description":"Bridging engineering and medicine — advancing healthcare innovation through research, collaboration, and community since our founding at CUET.","button_text":"Join BMES","button_link":"/members","button2_text":"Explore Projects","button2_link":"/projects","background_image":""}'::jsonb, 1),
('stats', '{"items":[{"value":"150+","label":"Active Members"},{"value":"50+","label":"Alumni Network"},{"value":"20+","label":"Ongoing Projects"},{"value":"30+","label":"Events Hosted"}]}'::jsonb, 2),
('features', '{"badge":"What We Do","title":"Empowering Future Biomedical Engineers","description":"From hands-on research to industry mentorship, BMES provides the tools and community to help you excel.","items":[{"icon":"FlaskConical","title":"Research Projects","desc":"Collaborative research in biomedical signal processing, biomechanics, and medical imaging."},{"icon":"Users","title":"Mentorship","desc":"Connect with alumni mentors working in top healthcare and engineering firms worldwide."},{"icon":"Calendar","title":"Events & Workshops","desc":"Hands-on workshops, seminars, and competitions to sharpen your engineering skills."},{"icon":"BookOpen","title":"Publications","desc":"Platform to publish and showcase undergraduate research papers and case studies."},{"icon":"Award","title":"Achievements","desc":"Celebrating competition wins, grants, and media coverage of our society impact."},{"icon":"Microscope","title":"Lab Access","desc":"Access to society-maintained lab resources and collaborative project tools."}]}'::jsonb, 3),
('cta', '{"title":"Ready to Make an Impact?","description":"Join CUET BMES and be part of the next generation of biomedical innovators.","button_text":"Get in Touch","button_link":"/contact"}'::jsonb, 4);

-- Seed default pages
INSERT INTO public.pages (page_name, slug, display_order) VALUES
('Home', '/', 1),
('About', '/about', 2),
('Members', '/members', 3),
('Projects', '/projects', 4),
('Events', '/events', 5),
('Blog', '/blog', 6),
('Achievements', '/achievements', 7),
('Alumni', '/alumni', 8),
('Contact', '/contact', 9);

-- Seed missing site_settings if not present
INSERT INTO public.site_settings (setting_key, setting_value, setting_group) VALUES
('site_name', 'CUET BMES', 'branding'),
('site_tagline', 'Biomedical Engineering Society', 'branding'),
('primary_color', '#0d9488', 'branding'),
('secondary_color', '#0284c7', 'branding')
ON CONFLICT (setting_key) DO NOTHING;
