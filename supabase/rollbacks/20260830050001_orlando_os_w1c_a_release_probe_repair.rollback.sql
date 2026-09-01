-- Exceptional rollback for the W1C-A release-probe repair.
-- The probe is release-only and creates no durable business rows.

drop function if exists public.a7_orlando_w1c_a_transactional_smoke(text,text,uuid);

-- The preceding migration remains the source of truth for the operational
-- weight function. A rollback of this repair intentionally leaves that
-- function in its safer retry-first form rather than reintroducing a known
-- idempotency defect.

notify pgrst, 'reload schema';
