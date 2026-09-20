-- Migration: Ensure official society email bmes@cuet.ac.bd is super_admin
DO $$ 
DECLARE 
  target_user_id UUID;
BEGIN
  -- Search for the official society user by email
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'bmes@cuet.ac.bd';
  
  IF target_user_id IS NOT NULL THEN
    -- Delete existing roles for this user to avoid conflicts
    DELETE FROM public.user_roles WHERE user_id = target_user_id;
    -- Insert super_admin role
    INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'super_admin');
  END IF;
END $$;
