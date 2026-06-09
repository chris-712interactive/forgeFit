-- User-declared one-rep maxes for load prescription

create table public.user_one_rep_maxes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  exercise_id text not null,
  weight_kg numeric(6, 2) not null check (weight_kg > 0 and weight_kg <= 500),
  source text not null default 'user_declared',
  updated_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);

create index user_one_rep_maxes_user_id_idx on public.user_one_rep_maxes (user_id);

alter table public.user_one_rep_maxes enable row level security;

create policy "Users manage own one rep maxes"
  on public.user_one_rep_maxes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger user_one_rep_maxes_updated_at
  before update on public.user_one_rep_maxes
  for each row execute function public.handle_updated_at();
