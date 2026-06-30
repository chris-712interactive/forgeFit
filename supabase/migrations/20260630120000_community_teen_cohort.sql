-- Phase 9G: teen-only community cohort (age < 18) + parent-consent gate support.

create or replace function public.profile_age_cohort(profile_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p.date_of_birth is not null
      and p.date_of_birth > (current_date - interval '18 years')::date
      then 'teen'
    when p.age is not null and p.age < 18 then 'teen'
    else 'adult'
  end
  from public.profiles p
  where p.id = profile_id;
$$;

alter table public.leaderboard_entries
  add column if not exists bucket_age_cohort text not null default 'adult'
    check (bucket_age_cohort in ('teen', 'adult'));

alter table public.community_wins
  add column if not exists bucket_age_cohort text not null default 'adult'
    check (bucket_age_cohort in ('teen', 'adult'));

alter table public.community_league_tiers
  add column if not exists bucket_age_cohort text not null default 'adult'
    check (bucket_age_cohort in ('teen', 'adult'));

alter table public.community_crews
  add column if not exists bucket_age_cohort text not null default 'adult'
    check (bucket_age_cohort in ('teen', 'adult'));

alter table public.community_weekly_challenge_status
  add column if not exists bucket_age_cohort text not null default 'adult'
    check (bucket_age_cohort in ('teen', 'adult'));

update public.leaderboard_entries le
set bucket_age_cohort = public.profile_age_cohort(le.user_id);

update public.community_wins cw
set bucket_age_cohort = public.profile_age_cohort(cw.user_id);

update public.community_league_tiers lt
set bucket_age_cohort = public.profile_age_cohort(lt.user_id);

update public.community_crews c
set bucket_age_cohort = public.profile_age_cohort(c.owner_id);

create index if not exists leaderboard_entries_bucket_cohort_idx
  on public.leaderboard_entries (bucket_goal, bucket_experience, bucket_age_cohort, week_start desc);

drop policy if exists "Read leaderboard in same bucket" on public.leaderboard_entries;

create policy "Read leaderboard in same bucket"
  on public.leaderboard_entries
  for select
  using (
    bucket_goal = (
      select primary_goal::text from public.profiles where id = auth.uid()
    )
    and bucket_experience = (
      select experience_level::text from public.profiles where id = auth.uid()
    )
    and bucket_age_cohort = public.profile_age_cohort(auth.uid())
  );

drop policy if exists "Read wins in same bucket" on public.community_wins;

create policy "Read wins in same bucket"
  on public.community_wins
  for select
  using (
    bucket_goal = (
      select primary_goal::text from public.profiles where id = auth.uid()
    )
    and bucket_experience = (
      select experience_level::text from public.profiles where id = auth.uid()
    )
    and bucket_age_cohort = public.profile_age_cohort(auth.uid())
  );

comment on column public.leaderboard_entries.bucket_age_cohort is
  'Teen (<18) vs adult community cohort — never mixed on leaderboards.';
