-- Travel mode: keep a home equipment snapshot while using a reduced set on the road.

alter table public.profiles
  add column if not exists is_travel_mode boolean not null default false,
  add column if not exists home_equipment_types text[] not null default '{}',
  add column if not exists home_recovery_equipment_types text[] not null default '{}',
  add column if not exists home_equipment_location public.equipment_location;

-- Seed home snapshots from existing inventory for onboarded users.
update public.profiles p
set
  home_equipment_types = coalesce(
    (
      select array_agg(ei.equipment_type order by ei.equipment_type)
      from public.equipment_inventory ei
      where ei.user_id = p.id
    ),
    '{}'
  ),
  home_recovery_equipment_types = coalesce(
    (
      select array_agg(re.equipment_type order by re.equipment_type)
      from public.recovery_equipment re
      where re.user_id = p.id
    ),
    '{}'
  ),
  home_equipment_location = (
    select ei.location
    from public.equipment_inventory ei
    where ei.user_id = p.id
    limit 1
  )
where p.onboarding_complete = true;
