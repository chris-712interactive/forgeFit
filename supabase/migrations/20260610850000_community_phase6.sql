-- Phase 6 community: preset reactions/comments, anti-gaming flags, moderation, opt-in A/B.

alter table profiles
  add column if not exists is_community_moderator boolean not null default false,
  add column if not exists community_suspended boolean not null default false,
  add column if not exists community_opt_in_variant text not null default 'control'
    check (community_opt_in_variant in ('control', 'default_on_ui'));

alter table leaderboard_entries
  add column if not exists score_flagged boolean not null default false,
  add column if not exists flag_reason text;

alter table community_wins
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_by uuid references profiles (id) on delete set null;

create table if not exists community_win_reactions (
  win_id uuid not null references community_wins (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  reaction_key text not null check (
    reaction_key in ('fire', 'strong', 'clap', 'trophy', 'motivated')
  ),
  created_at timestamptz not null default now(),
  primary key (win_id, user_id)
);

create index if not exists community_win_reactions_win_idx
  on community_win_reactions (win_id);

create table if not exists community_win_preset_comments (
  win_id uuid not null references community_wins (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  comment_key text not null check (
    comment_key in ('lets_go', 'crushing_it', 'inspired', 'same_goal', 'well_done')
  ),
  created_at timestamptz not null default now(),
  primary key (win_id, user_id)
);

create index if not exists community_win_preset_comments_win_idx
  on community_win_preset_comments (win_id);

create table if not exists community_moderation_log (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references profiles (id) on delete cascade,
  action text not null check (
    action in (
      'hide_win',
      'unhide_win',
      'clear_score_flag',
      'suspend_user',
      'unsuspend_user'
    )
  ),
  target_user_id uuid references profiles (id) on delete set null,
  target_win_id uuid references community_wins (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists community_moderation_log_created_idx
  on community_moderation_log (created_at desc);

alter table community_win_reactions enable row level security;
alter table community_win_preset_comments enable row level security;
alter table community_moderation_log enable row level security;

-- Reactions: same bucket read; opted-in users react in bucket.
create policy "Read win reactions in same bucket"
  on community_win_reactions
  for select
  using (
    exists (
      select 1
      from community_wins cw
      join profiles me on me.id = auth.uid()
      where cw.id = community_win_reactions.win_id
        and cw.hidden_at is null
        and cw.bucket_goal = me.primary_goal::text
        and cw.bucket_experience = me.experience_level::text
    )
  );

create policy "Opted-in users react in same bucket"
  on community_win_reactions
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.gamification_opt_in = true
        and p.community_suspended = false
    )
    and exists (
      select 1
      from community_wins cw
      join profiles me on me.id = auth.uid()
      where cw.id = community_win_reactions.win_id
        and cw.hidden_at is null
        and cw.bucket_goal = me.primary_goal::text
        and cw.bucket_experience = me.experience_level::text
    )
  );

create policy "Users update own win reactions"
  on community_win_reactions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users remove own win reactions"
  on community_win_reactions
  for delete
  using (auth.uid() = user_id);

-- Preset comments: same pattern.
create policy "Read win preset comments in same bucket"
  on community_win_preset_comments
  for select
  using (
    exists (
      select 1
      from community_wins cw
      join profiles me on me.id = auth.uid()
      where cw.id = community_win_preset_comments.win_id
        and cw.hidden_at is null
        and cw.bucket_goal = me.primary_goal::text
        and cw.bucket_experience = me.experience_level::text
    )
  );

create policy "Opted-in users comment in same bucket"
  on community_win_preset_comments
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.gamification_opt_in = true
        and p.community_suspended = false
    )
    and exists (
      select 1
      from community_wins cw
      join profiles me on me.id = auth.uid()
      where cw.id = community_win_preset_comments.win_id
        and cw.hidden_at is null
        and cw.bucket_goal = me.primary_goal::text
        and cw.bucket_experience = me.experience_level::text
    )
  );

create policy "Users update own preset comments"
  on community_win_preset_comments
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users remove own preset comments"
  on community_win_preset_comments
  for delete
  using (auth.uid() = user_id);

-- Moderation log: moderators read; inserts via service role in app (admin client).
create policy "Moderators read moderation log"
  on community_moderation_log
  for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.is_community_moderator = true
    )
  );

-- Moderators can hide wins in bucket.
create policy "Moderators hide wins in bucket"
  on community_wins
  for update
  using (
    exists (
      select 1
      from profiles mod
      where mod.id = auth.uid()
        and mod.is_community_moderator = true
    )
    and bucket_goal = (
      select primary_goal::text from profiles where id = auth.uid()
    )
    and bucket_experience = (
      select experience_level::text from profiles where id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from profiles mod
      where mod.id = auth.uid()
        and mod.is_community_moderator = true
    )
  );

-- Moderators can clear flags on leaderboard rows in bucket.
create policy "Moderators clear score flags in bucket"
  on leaderboard_entries
  for update
  using (
    exists (
      select 1 from profiles mod
      where mod.id = auth.uid()
        and mod.is_community_moderator = true
    )
    and bucket_goal = (
      select primary_goal::text from profiles where id = auth.uid()
    )
    and bucket_experience = (
      select experience_level::text from profiles where id = auth.uid()
    )
  );

-- Moderators can suspend users in same bucket (profile update).
create policy "Moderators suspend peers in bucket"
  on profiles
  for update
  using (
    exists (
      select 1 from profiles mod
      where mod.id = auth.uid()
        and mod.is_community_moderator = true
        and mod.primary_goal = profiles.primary_goal
        and mod.experience_level = profiles.experience_level
    )
  )
  with check (
    exists (
      select 1 from profiles mod
      where mod.id = auth.uid()
        and mod.is_community_moderator = true
    )
  );
