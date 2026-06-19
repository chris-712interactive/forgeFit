-- Phase B: Spotify workout music OAuth + profile prefs

alter type integration_provider add value if not exists 'spotify';

alter table public.profiles
  add column if not exists workout_music_auto_start boolean not null default false,
  add column if not exists workout_music_default_vibe text
    check (
      workout_music_default_vibe is null
      or workout_music_default_vibe in ('focus', 'pump', 'cardio', 'cooldown')
    );

comment on column public.profiles.workout_music_auto_start is
  'When true and Spotify is connected, start default vibe playlist on workout begin.';
comment on column public.profiles.workout_music_default_vibe is
  'Default ForgeRep workout music vibe for auto-start and profile picker.';
