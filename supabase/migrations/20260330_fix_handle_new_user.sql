-- Fix handle_new_user trigger: make profile insert non-fatal.
-- If the insert fails for any reason (type cast, RLS, constraint), it logs
-- a warning but does NOT block user creation. The profile is created/updated
-- later by activate-client.ts via upsert anyway.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(
      NULLIF(new.raw_user_meta_data->>'role', '')::user_role,
      'client'::user_role
    )
  )
  ON CONFLICT (id) DO NOTHING;  -- idempotent: skip if profile already exists

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log but never block auth user creation
  RAISE WARNING 'handle_new_user: profile insert failed for user %: %', new.id, SQLERRM;
  RETURN new;
END;
$$;
