-- Phase 3: active zone minutes, sedentary time, total calories (Fitbit via Google Health).

alter table daily_activity_logs
  add column if not exists active_zone_minutes integer
    check (active_zone_minutes is null or active_zone_minutes >= 0),
  add column if not exists sedentary_minutes integer
    check (sedentary_minutes is null or sedentary_minutes >= 0),
  add column if not exists total_calories numeric(8, 2)
    check (total_calories is null or total_calories >= 0);
