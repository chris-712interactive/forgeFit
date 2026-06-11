-- Pro: progress photo timeline (Supabase Storage + metadata)

create table public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  taken_date date not null default current_date,
  caption text,
  created_at timestamptz not null default now()
);

create index progress_photos_user_taken_idx
  on public.progress_photos (user_id, taken_date desc);

alter table public.progress_photos enable row level security;

create policy "Users read own progress photos"
  on public.progress_photos for select
  using (auth.uid() = user_id);

create policy "Users insert own progress photos"
  on public.progress_photos for insert
  with check (auth.uid() = user_id);

create policy "Users delete own progress photos"
  on public.progress_photos for delete
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'progress-photos',
  'progress-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "Users upload own progress photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'progress-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users read own progress photos storage"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'progress-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own progress photos storage"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'progress-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
