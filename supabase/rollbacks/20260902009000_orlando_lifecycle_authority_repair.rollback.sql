-- No automatic rollback: the previous function is known to omit canonical transitions.
-- Application rollback remains safe because this signature is backward compatible.
do $$ begin
  raise exception 'Rollback blocked: restoring the incomplete lifecycle authority is unsafe';
end $$;
