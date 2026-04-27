CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  details TEXT,
  student_id TEXT,
  batch TEXT,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can register for events" ON public.event_registrations;
CREATE POLICY "Anyone can register for events" ON public.event_registrations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins and Editors can read event registrations" ON public.event_registrations;
CREATE POLICY "Admins and Editors can read event registrations" ON public.event_registrations FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'editor'::app_role) OR 
  has_role(auth.uid(), 'content_manager'::app_role)
);

DROP POLICY IF EXISTS "Admins and Editors can manage event registrations" ON public.event_registrations;
CREATE POLICY "Admins and Editors can manage event registrations" ON public.event_registrations FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'editor'::app_role) OR 
  has_role(auth.uid(), 'content_manager'::app_role)
);

GRANT ALL ON public.event_registrations TO anon, authenticated, service_role;

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS registration_start_date TIMESTAMPTZ;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS registration_end_date TIMESTAMPTZ;

NOTIFY pgrst, 'reload schema';
