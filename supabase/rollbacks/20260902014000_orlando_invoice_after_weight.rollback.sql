-- Safe application rollback leaves this additive function inert. Execute this
-- SQL rollback only after the application no longer calls the v2 authority.
drop function if exists public.a7_orlando_w1c_b1_review_invoice_v2(
  text,integer,integer,text,text,text,text,timestamptz
);
