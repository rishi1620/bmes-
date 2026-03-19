
-- Create event_registrations table
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for event_registrations
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Policies for event_registrations
CREATE POLICY "Anyone can register for events" ON public.event_registrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins and Editors can read event registrations" ON public.event_registrations
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'editor'::app_role) OR 
    has_role(auth.uid(), 'content_manager'::app_role)
  );

CREATE POLICY "Admins and Editors can manage event registrations" ON public.event_registrations
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'editor'::app_role) OR 
    has_role(auth.uid(), 'content_manager'::app_role)
  );

-- Create membership_registrations table
CREATE TABLE IF NOT EXISTS public.membership_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  student_id TEXT NOT NULL,
  department TEXT NOT NULL,
  year_semester TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for membership_registrations
ALTER TABLE public.membership_registrations ENABLE ROW LEVEL SECURITY;

-- Policies for membership_registrations
CREATE POLICY "Anyone can apply for membership" ON public.membership_registrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins and Editors can read membership registrations" ON public.membership_registrations
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'editor'::app_role) OR 
    has_role(auth.uid(), 'content_manager'::app_role)
  );

CREATE POLICY "Admins and Editors can manage membership registrations" ON public.membership_registrations
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'editor'::app_role) OR 
    has_role(auth.uid(), 'content_manager'::app_role)
  );
