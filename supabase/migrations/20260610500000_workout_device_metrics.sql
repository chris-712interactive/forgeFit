-- Phase 5: per-workout device correlation (Fitbit / Google Health exercise sessions)

create type public.device_match_confidence as enum (
  'high',
  'medium',
  'low',
  'none'
);

create type public.session_intensity_band as enum (
  'low',
  'moderate',
  'high'
);

create type public.session_intensity_verdict as enum (
  'on_target',
  'too_easy',
  'too_hard',
  'inconclusive'
);

create type public.rir_agreement as enum (
  'aligned',
  'harder_than_logged',
  'easier_than_logged'
);

create table public.workout_device_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  workout_session_id uuid not null references public.workout_sessions (id) on delete cascade,
  source text not null default 'google_health',
  external_exercise_id text,
  overlap_ratio numeric(4, 3) check (
    overlap_ratio is null or (overlap_ratio >= 0 and overlap_ratio <= 1)
  ),
  match_confidence public.device_match_confidence not null default 'none',
  avg_heart_rate_bpm integer check (
    avg_heart_rate_bpm is null or avg_heart_rate_bpm >= 0
  ),
  active_zone_minutes integer check (
    active_zone_minutes is null or active_zone_minutes >= 0
  ),
  calories_kcal numeric(8, 2) check (calories_kcal is null or calories_kcal >= 0),
  zone_light_seconds integer check (zone_light_seconds is null or zone_light_seconds >= 0),
  zone_fat_burn_seconds integer check (
    zone_fat_burn_seconds is null or zone_fat_burn_seconds >= 0
  ),
  zone_cardio_seconds integer check (
    zone_cardio_seconds is null or zone_cardio_seconds >= 0
  ),
  zone_peak_seconds integer check (zone_peak_seconds is null or zone_peak_seconds >= 0),
  exercise_type text,
  display_name text,
  logged_avg_rir numeric(4, 2),
  logged_hard_sets integer check (logged_hard_sets is null or logged_hard_sets >= 0),
  intensity_band public.session_intensity_band,
  intensity_verdict public.session_intensity_verdict not null default 'inconclusive',
  rir_agreement public.rir_agreement,
  evidence_rule_id text,
  raw_summary jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workout_session_id)
);

create index workout_device_metrics_user_idx
  on public.workout_device_metrics (user_id);

create index workout_device_metrics_session_idx
  on public.workout_device_metrics (workout_session_id);

alter table public.workout_device_metrics enable row level security;

create policy "Users read own workout device metrics"
  on public.workout_device_metrics
  for select
  using (auth.uid() = user_id);

-- Allow google_health as external activity source (cardio not matched to lift sessions).
alter table public.external_activity_logs
  drop constraint if exists external_activity_logs_source_check;

alter table public.external_activity_logs
  add constraint external_activity_logs_source_check
  check (source in ('strava', 'google_health'));
