-- Backfill starting weight for users who onboarded before onboarding wrote body_measurements.
-- Only inserts when the user has no measurement rows yet (profile.weight_kg still reflects onboarding).

insert into public.body_measurements (
  user_id,
  measured_date,
  weight_kg,
  waist_cm,
  chest_cm,
  arms_cm,
  legs_cm,
  neck_cm,
  hips_cm,
  notes
)
select
  p.id,
  coalesce(p.health_disclaimer_accepted_at::date, p.created_at::date),
  p.weight_kg,
  p.waist_cm,
  p.chest_cm,
  p.arms_cm,
  p.legs_cm,
  p.neck_cm,
  p.hips_cm,
  'From onboarding'
from public.profiles p
where p.onboarding_complete = true
  and p.weight_kg is not null
  and not exists (
    select 1
    from public.body_measurements bm
    where bm.user_id = p.id
  )
on conflict (user_id, measured_date) do nothing;
