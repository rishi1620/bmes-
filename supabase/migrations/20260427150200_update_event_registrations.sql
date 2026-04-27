CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.event_registrations ADD COLUMN student_id TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE public.event_registrations ADD COLUMN batch TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE public.event_registrations ADD COLUMN department TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can register for events" ON public.event_registrations FOR INSERT WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins and Editors can read event registrations" ON public.event_registrations FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'editor'::app_role) OR 
    has_role(auth.uid(), 'content_manager'::app_role)
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins and Editors can manage event registrations" ON public.event_registrations FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'editor'::app_role) OR 
    has_role(auth.uid(), 'content_manager'::app_role)
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

GRANT ALL ON public.event_registrations TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
