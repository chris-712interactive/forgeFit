-- Community interaction: cheer/react on peer wins in the same goal + experience bucket.

create table if not exists community_win_cheers (
  id uuid primary key default gen_random_uuid(),
  win_id uuid not null references community_wins (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (win_id, user_id)
);

create index if not exists community_win_cheers_win_idx
  on community_win_cheers (win_id);

alter table community_win_cheers enable row level security;

create policy "Read cheers for wins in same bucket"
  on community_win_cheers
  for select
  using (
    exists (
      select 1
      from community_wins cw
      where cw.id = community_win_cheers.win_id
        and cw.bucket_goal = (
          select primary_goal::text from profiles where id = auth.uid()
        )
        and cw.bucket_experience = (
          select experience_level::text from profiles where id = auth.uid()
        )
    )
  );

create policy "Opted-in users cheer wins in same bucket"
  on community_win_cheers
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.gamification_opt_in = true
    )
    and exists (
      select 1
      from community_wins cw
      where cw.id = community_win_cheers.win_id
        and cw.bucket_goal = (
          select primary_goal::text from profiles where id = auth.uid()
        )
        and cw.bucket_experience = (
          select experience_level::text from profiles where id = auth.uid()
        )
    )
  );

create policy "Users remove own cheers"
  on community_win_cheers
  for delete
  using (auth.uid() = user_id);
