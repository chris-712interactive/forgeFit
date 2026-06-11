-- Phase 7: Stripe Pro subscription fields on profiles

create type public.subscription_tier as enum ('free', 'pro');

create type public.subscription_status as enum (
  'inactive',
  'trialing',
  'active',
  'past_due',
  'canceled'
);

alter table public.profiles
  add column subscription_tier public.subscription_tier not null default 'free',
  add column subscription_status public.subscription_status not null default 'inactive',
  add column stripe_customer_id text,
  add column stripe_subscription_id text,
  add column subscription_current_period_end timestamptz;

create unique index profiles_stripe_customer_id_key
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index profiles_stripe_subscription_id_key
  on public.profiles (stripe_subscription_id)
  where stripe_subscription_id is not null;

comment on column public.profiles.subscription_tier is 'free or pro — updated by Stripe webhooks';
comment on column public.profiles.subscription_status is 'Stripe subscription lifecycle';
