-- RPC: find auth user by email (includes soft-deleted users)
-- Used as fallback when createUser fails and listUsers pagination misses the user.
-- SECURITY DEFINER runs as postgres so it can query auth schema.

CREATE OR REPLACE FUNCTION public.admin_find_user_by_email(lookup_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT id
  FROM auth.users
  WHERE lower(email) = lower(lookup_email)
  LIMIT 1;
$$;
-- Revoke public access — only service role can call this
REVOKE ALL ON FUNCTION public.admin_find_user_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_find_user_by_email(text) TO service_role;
