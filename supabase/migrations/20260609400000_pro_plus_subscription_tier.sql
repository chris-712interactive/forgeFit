-- Add Pro+ tier to subscription enum (two-tier paid model)

ALTER TYPE public.subscription_tier ADD VALUE IF NOT EXISTS 'pro_plus' AFTER 'pro';

COMMENT ON COLUMN public.profiles.subscription_tier IS
  'free, pro, or pro_plus — updated by Stripe webhooks from price ID';
