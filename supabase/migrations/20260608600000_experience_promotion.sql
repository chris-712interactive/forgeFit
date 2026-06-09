-- Experience promotion tracking (adherence-based level-ups)

alter table public.profiles
  add column if not exists experience_promoted_at timestamptz,
  add column if not exists promotion_snoozed_until timestamptz;

comment on column public.profiles.experience_promoted_at is
  'Last time experience_level was elevated via adherence promotion';
comment on column public.profiles.promotion_snoozed_until is
  'Hide promotion nudge until this timestamp (user chose Not yet)';
