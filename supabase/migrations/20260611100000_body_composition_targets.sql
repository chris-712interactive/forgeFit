-- Body composition targets: fat-loss pace, recomp priority, optional goal weight

create type public.fat_loss_pace as enum (
  'steady',
  'moderate',
  'aggressive'
);

create type public.recomp_priority as enum (
  'muscle',
  'balanced',
  'lean_out'
);

alter table public.profiles
  add column fat_loss_pace public.fat_loss_pace,
  add column recomp_priority public.recomp_priority,
  add column goal_weight_kg numeric(5, 1)
    check (goal_weight_kg is null or (goal_weight_kg between 30 and 300));

comment on column public.profiles.fat_loss_pace is
  'User-selected fat loss speed; maps to evidence daily_deficit_kcal min/optimal/max.';

comment on column public.profiles.recomp_priority is
  'Recomp trade-off: prioritize muscle, balanced, or faster lean-out.';

comment on column public.profiles.goal_weight_kg is
  'Optional target weight for projections and goal-date forecasts (Pro).';
