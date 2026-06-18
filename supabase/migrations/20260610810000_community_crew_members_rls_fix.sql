-- Fix infinite RLS recursion on community_crew_members (policies must not
-- subquery the same table under RLS). Use SECURITY DEFINER helpers instead.

create or replace function public.is_community_crew_member(p_crew_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.community_crew_members
    where crew_id = p_crew_id
      and user_id = p_user_id
  );
$$;

create or replace function public.community_crew_member_count(p_crew_id uuid)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from public.community_crew_members
  where crew_id = p_crew_id;
$$;

create or replace function public.user_has_community_crew(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.community_crew_members
    where user_id = p_user_id
  );
$$;

grant execute on function public.is_community_crew_member(uuid, uuid) to authenticated;
grant execute on function public.community_crew_member_count(uuid) to authenticated;
grant execute on function public.user_has_community_crew(uuid) to authenticated;

drop policy if exists "Read crew members in shared crew" on community_crew_members;
drop policy if exists "Join crew when opted in and same bucket" on community_crew_members;
drop policy if exists "Create crew when opted in" on community_crews;

create policy "Read crew members in shared crew"
  on community_crew_members
  for select
  using (
    user_id = auth.uid()
    or public.is_community_crew_member(crew_id, auth.uid())
  );

create policy "Join crew when opted in and same bucket"
  on community_crew_members
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from profiles me
      where me.id = auth.uid()
        and me.gamification_opt_in = true
    )
    and exists (
      select 1
      from community_crews c
      join profiles me on me.id = auth.uid()
      where c.id = crew_id
        and c.bucket_goal = me.primary_goal::text
        and c.bucket_experience = me.experience_level::text
    )
    and public.community_crew_member_count(crew_id) < 8
    and not public.user_has_community_crew(auth.uid())
  );

create policy "Create crew when opted in"
  on community_crews
  for insert
  with check (
    auth.uid() = owner_id
    and exists (
      select 1
      from profiles me
      where me.id = auth.uid()
        and me.gamification_opt_in = true
        and me.primary_goal::text = bucket_goal
        and me.experience_level::text = bucket_experience
    )
    and not public.user_has_community_crew(auth.uid())
  );
