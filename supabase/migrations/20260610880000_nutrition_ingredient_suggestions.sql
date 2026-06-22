-- User-submitted whole-food ingredient suggestions (meal builder).

create table public.nutrition_ingredient_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  search_query text not null,
  suggested_name text not null,
  category_hint text,
  notes text,
  status text not null default 'pending' check (
    status in ('pending', 'reviewed', 'added', 'rejected')
  ),
  created_at timestamptz not null default now()
);

create index nutrition_ingredient_suggestions_status_created_idx
  on public.nutrition_ingredient_suggestions (status, created_at desc);

create index nutrition_ingredient_suggestions_user_created_idx
  on public.nutrition_ingredient_suggestions (user_id, created_at desc);

alter table public.nutrition_ingredient_suggestions enable row level security;

create policy "Users insert own ingredient suggestions"
  on public.nutrition_ingredient_suggestions for insert
  with check (auth.uid() = user_id);
