-- Wake clock time for bedtime suggestions (imported from Fitbit / Google Health sleep sessions).

alter table daily_sleep_logs
  add column if not exists wake_at timestamptz,
  add column if not exists wake_local_minutes integer
    check (
      wake_local_minutes is null
      or (wake_local_minutes >= 0 and wake_local_minutes < 1440)
    );
