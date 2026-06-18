-- Ensure notification updates succeed with explicit WITH CHECK.

drop policy if exists "Update own notifications" on community_notifications;

create policy "Update own notifications"
  on community_notifications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
