-- Follow insert RLS must not read followee profiles (own-row-only RLS).
-- Validate same bucket via leaderboard_entries, which peers can already read.

drop policy if exists "Follow peers in same bucket" on community_follows;

create policy "Follow peers in same bucket"
  on community_follows
  for insert
  with check (
    auth.uid() = follower_id
    and exists (
      select 1
      from profiles me
      where me.id = auth.uid()
        and me.gamification_opt_in = true
        and me.primary_goal is not null
        and me.experience_level is not null
    )
    and exists (
      select 1
      from profiles me
      join leaderboard_entries le on le.user_id = followee_id
      where me.id = auth.uid()
        and le.bucket_goal = me.primary_goal::text
        and le.bucket_experience = me.experience_level::text
    )
  );
