DROP POLICY IF EXISTS "Admins and Editors can read membership registrations" ON public.membership_registrations;

CREATE POLICY "Admins and Editors can read membership registrations" 
ON public.membership_registrations 
FOR SELECT 
USING (
  auth.role() = 'authenticated'
);
