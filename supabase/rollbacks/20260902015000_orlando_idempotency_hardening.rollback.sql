-- No automatic SQL rollback: restoring the non-deterministic driver functions is
-- unsafe even when the evidence tables are empty. The function signatures remain
-- backward compatible, so application rollback leaves this hardening safely inert.
do $$
begin
  raise exception 'Rollback blocked: restoring pre-hardening driver authority is unsafe';
end;
$$;
