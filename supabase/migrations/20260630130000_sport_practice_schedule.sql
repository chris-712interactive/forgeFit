-- Phase 9I: sport practice days + gym-on-practice-day policy for schedule blocking.

create type public.sport_practice_gym_policy as enum (
  'avoid',
  'allow_light',
  'allow'
);

alter table public.profiles
  add column if not exists sport_practice_days integer[] not null default '{}',
  add column if not exists sport_practice_gym_policy public.sport_practice_gym_policy,
  add column if not exists sport_practice_schedule_varies boolean not null default false;

comment on column public.profiles.sport_practice_days is
  'Weekday indices when sport practice usually occurs (0=Mon … 6=Sun).';
comment on column public.profiles.sport_practice_gym_policy is
  'Whether gym sessions may land on practice days; avoid blocks scheduling when set.';
comment on column public.profiles.sport_practice_schedule_varies is
  'When true, practice days are not used to block gym scheduling.';
