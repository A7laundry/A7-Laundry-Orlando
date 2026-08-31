-- One accepted Orlando order can settle through only one Stripe PaymentIntent.
-- This is additive hardening for the already-applied P0 lifecycle schema.

create unique index if not exists a7_orlando_payments_order_unique_idx
  on public.a7_orlando_payments (order_id);
