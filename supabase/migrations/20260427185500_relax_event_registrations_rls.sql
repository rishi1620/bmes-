DROP POLICY IF EXISTS "Admins and Editors can read event registrations" ON public.event_registrations;

CREATE POLICY "Admins and Editors can read event registrations" 
ON public.event_registrations 
FOR SELECT 
USING (
  auth.role() = 'authenticated'
);
