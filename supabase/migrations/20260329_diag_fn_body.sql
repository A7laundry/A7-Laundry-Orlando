CREATE OR REPLACE FUNCTION public.admin_diag_fn_body(fn_name text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT pg_get_functiondef(p.oid)
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE p.proname = fn_name AND n.nspname = 'public'
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.admin_diag_fn_body(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_diag_fn_body(text) TO service_role;
