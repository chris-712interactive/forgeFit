-- Daily admin revenue snapshots for MRR trend charts (Phase B)

create table if not exists public.admin_revenue_snapshots (
  snapshot_date date primary key,
  mrr_usd numeric(12, 2) not null default 0,
  arr_usd numeric(12, 2) not null default 0,
  paid_subscribers integer not null default 0,
  comp_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists admin_revenue_snapshots_date_idx
  on public.admin_revenue_snapshots (snapshot_date desc);

alter table public.admin_revenue_snapshots enable row level security;

-- No policies: admin UI uses service role only.
