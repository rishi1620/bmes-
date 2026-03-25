ALTER TABLE public.membership_registrations ADD COLUMN user_id UUID REFERENCES public.profiles(id);
