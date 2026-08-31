-- Add attribution columns to payments table
-- Run this once in Supabase Dashboard → SQL Editor

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS lp_slug      text,
  ADD COLUMN IF NOT EXISTS utm_source   text,
  ADD COLUMN IF NOT EXISTS utm_medium   text,
  ADD COLUMN IF NOT EXISTS utm_campaign text;
-- Index for common analytics queries
CREATE INDEX IF NOT EXISTS idx_payments_utm_source   ON payments (utm_source);
CREATE INDEX IF NOT EXISTS idx_payments_lp_slug      ON payments (lp_slug);
CREATE INDEX IF NOT EXISTS idx_payments_utm_campaign ON payments (utm_campaign);
COMMENT ON COLUMN payments.lp_slug      IS 'Landing page slug that originated the checkout (e.g. cleaning-a)';
COMMENT ON COLUMN payments.utm_source   IS 'UTM source (e.g. facebook, google, instagram)';
COMMENT ON COLUMN payments.utm_medium   IS 'UTM medium (e.g. paid, cpc, social)';
COMMENT ON COLUMN payments.utm_campaign IS 'UTM campaign name (e.g. cleaning-jan2026)';
