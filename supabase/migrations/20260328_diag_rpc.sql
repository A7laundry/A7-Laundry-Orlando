-- Diagnostic RPC: returns triggers on auth.users + NOT NULL columns in profiles
-- Used once to debug "Database error creating new user". Safe to keep.
CREATE OR REPLACE FUNCTION public.admin_diag_auth()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public, pg_catalog
AS $$
DECLARE
  triggers jsonb;
  profile_cols jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'trigger_name', t.tgname,
    'function',     p.proname,
    'timing',       CASE t.tgtype & 2 WHEN 2 THEN 'BEFORE' ELSE 'AFTER' END,
    'events',       CASE
                      WHEN t.tgtype & 4 = 4 THEN 'INSERT'
                      WHEN t.tgtype & 8 = 8 THEN 'DELETE'
                      WHEN t.tgtype & 16 = 16 THEN 'UPDATE'
                    END
  ))
  INTO triggers
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_proc p ON p.oid = t.tgfoid
  WHERE n.nspname = 'auth' AND c.relname = 'users' AND NOT t.tgisinternal;

  SELECT jsonb_agg(jsonb_build_object(
    'column',     a.attname,
    'not_null',   a.attnotnull,
    'has_default', a.atthasdef
  ))
  INTO profile_cols
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'profiles'
    AND a.attnum > 0 AND NOT a.attisdropped;

  RETURN jsonb_build_object(
    'auth_users_triggers', COALESCE(triggers, '[]'::jsonb),
    'profiles_columns',    COALESCE(profile_cols, '[]'::jsonb)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.admin_diag_auth() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_diag_auth() TO service_role;
