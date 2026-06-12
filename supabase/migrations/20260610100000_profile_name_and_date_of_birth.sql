-- Profile identity: first/last name + date of birth (age derived in app).

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists date_of_birth date;

alter table public.profiles
  add constraint profiles_date_of_birth_range check (
    date_of_birth is null
    or (
      date_of_birth <= (current_date - interval '13 years')::date
      and date_of_birth >= (current_date - interval '120 years')::date
    )
  );

create index if not exists profiles_date_of_birth_idx
  on public.profiles (date_of_birth)
  where date_of_birth is not null;
