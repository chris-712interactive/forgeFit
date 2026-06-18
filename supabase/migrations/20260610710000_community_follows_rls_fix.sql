-- Fix community_follows insert RLS: use unqualified followee_id in WITH CHECK.

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
      join profiles them on them.id = followee_id
      where me.id = auth.uid()
        and me.primary_goal::text = them.primary_goal::text
        and me.experience_level::text = them.experience_level::text
    )
  );
