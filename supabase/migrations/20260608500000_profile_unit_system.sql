-- Preferred measurement units (display + input; storage stays metric)

create type public.unit_system as enum (
  'metric',
  'imperial'
);

alter table public.profiles
  add column unit_system public.unit_system not null default 'metric';
