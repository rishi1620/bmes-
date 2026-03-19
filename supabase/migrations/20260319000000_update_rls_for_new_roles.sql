-- Update RLS policies to allow editor and content_manager roles to manage content

-- Home sections
DROP POLICY IF EXISTS "Admins can manage home sections" ON public.home_sections;
CREATE POLICY "Admins and Editors can manage home sections" ON public.home_sections FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'editor'::app_role) OR 
  has_role(auth.uid(), 'content_manager'::app_role)
);

-- Advisors
DROP POLICY IF EXISTS "Admins can insert advisors" ON public.advisors;
DROP POLICY IF EXISTS "Admins can update advisors" ON public.advisors;
DROP POLICY IF EXISTS "Admins can delete advisors" ON public.advisors;
CREATE POLICY "Admins and Editors can insert advisors" ON public.advisors FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'content_manager'::app_role));
CREATE POLICY "Admins and Editors can update advisors" ON public.advisors FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'content_manager'::app_role));
CREATE POLICY "Admins and Editors can delete advisors" ON public.advisors FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'content_manager'::app_role));

-- Alumni
DROP POLICY IF EXISTS "Admins can insert alumni" ON public.alumni;
DROP POLICY IF EXISTS "Admins can update alumni" ON public.alumni;
DROP POLICY IF EXISTS "Admins can delete alumni" ON public.alumni;
CREATE POLICY "Admins and Editors can insert alumni" ON public.alumni FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'content_manager'::app_role));
CREATE POLICY "Admins and Editors can update alumni" ON public.alumni FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'content_manager'::app_role));
CREATE POLICY "Admins and Editors can delete alumni" ON public.alumni FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'content_manager'::app_role));

-- Pages
DROP POLICY IF EXISTS "Admins can manage pages" ON public.pages;
CREATE POLICY "Admins and Editors can manage pages" ON public.pages FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'content_manager'::app_role));

-- Media Library
DROP POLICY IF EXISTS "Admins can insert media" ON public.media_library;
DROP POLICY IF EXISTS "Admins can update media" ON public.media_library;
DROP POLICY IF EXISTS "Admins can delete media" ON public.media_library;
CREATE POLICY "Admins and Editors can insert media" ON public.media_library FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'content_manager'::app_role));
CREATE POLICY "Admins and Editors can update media" ON public.media_library FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'content_manager'::app_role));
CREATE POLICY "Admins and Editors can delete media" ON public.media_library FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'content_manager'::app_role));

-- Members
DROP POLICY IF EXISTS "Admins can insert members" ON public.members;
DROP POLICY IF EXISTS "Admins can update members" ON public.members;
DROP POLICY IF EXISTS "Admins can delete members" ON public.members;
CREATE POLICY "Admins and Editors can insert members" ON public.members FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'content_manager'::app_role));
CREATE POLICY "Admins and Editors can update members" ON public.members FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'content_manager'::app_role));
CREATE POLICY "Admins and Editors can delete members" ON public.members FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'content_manager'::app_role));

-- Events
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
CREATE POLICY "Admins and Editors can insert events" ON public.events FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'content_manager'::app_role));
CREATE POLICY "Admins and Editors can update events" ON public.events FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'content_manager'::app_role));
CREATE POLICY "Admins and Editors can delete events" ON public.events FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'content_manager'::app_role));

-- Projects
DROP POLICY IF EXISTS "Admins can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;
CREATE POLICY "Admins and Editors can insert projects" ON public.projects FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'content_manager'::app_role));
CREATE POLICY "Admins and Editors can update projects" ON public.projects FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'content_manager'::app_role));
CREATE POLICY "Admins and Editors can delete projects" ON public.projects FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'content_manager'::app_role));

-- Achievements
DROP POLICY IF EXISTS "Admins can insert achievements" ON public.achievements;
DROP POLICY IF EXISTS "Admins can update achievements" ON public.achievements;
DROP POLICY IF EXISTS "Admins can delete achievements" ON public.achievements;
CREATE POLICY "Admins and Editors can insert achievements" ON public.achievements FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'content_manager'::app_role));
CREATE POLICY "Admins and Editors can update achievements" ON public.achievements FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'content_manager'::app_role));
CREATE POLICY "Admins and Editors can delete achievements" ON public.achievements FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'content_manager'::app_role));

-- Blog Posts
DROP POLICY IF EXISTS "Admins can do anything with blog posts" ON public.blog_posts;
CREATE POLICY "Admins and Editors can do anything with blog posts" ON public.blog_posts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'content_manager'::app_role));

-- Contact Submissions
DROP POLICY IF EXISTS "Admins can manage submissions" ON public.contact_submissions;
CREATE POLICY "Admins and Editors can manage submissions" ON public.contact_submissions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'content_manager'::app_role));

-- Note: Site Settings and User Roles remain restricted to admin and super_admin
