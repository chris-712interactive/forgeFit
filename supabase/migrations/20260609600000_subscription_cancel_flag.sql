-- Track pending cancellation (subscription still active until period end)

alter table public.profiles
  add column subscription_cancel_at_period_end boolean not null default false;

comment on column public.profiles.subscription_cancel_at_period_end is
  'True when Stripe subscription is set to cancel at current_period_end';
