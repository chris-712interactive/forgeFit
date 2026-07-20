-- Phase 14B: Partner commission ledger + payout batches

create table if not exists public.partner_commissions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete cascade,
  deal_id uuid references public.partner_deals (id) on delete set null,
  attribution_id uuid references public.user_attributions (id) on delete set null,
  entry_kind text not null default 'accrual'
    check (entry_kind in ('accrual', 'reversal')),
  reverses_commission_id uuid references public.partner_commissions (id) on delete set null,
  stripe_invoice_id text,
  stripe_charge_id text,
  stripe_refund_id text,
  period_month text not null,
  gross_cents integer not null default 0,
  fee_cents integer not null default 0,
  tax_cents integer not null default 0,
  base_cents integer not null default 0,
  commission_cents integer not null,
  commission_base text
    check (
      commission_base is null
      or commission_base in ('gross', 'net_of_fees', 'net_of_fees_and_tax')
    ),
  percent_bps integer,
  cpa_cents integer not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'payable', 'paid', 'reversed')),
  payout_id uuid,
  tier text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint partner_commissions_period_month_format
    check (period_month ~ '^[0-9]{4}-[0-9]{2}$'),
  constraint partner_commissions_accrual_invoice_required
    check (
      entry_kind <> 'accrual'
      or stripe_invoice_id is not null
    ),
  constraint partner_commissions_reversal_link_required
    check (
      entry_kind <> 'reversal'
      or reverses_commission_id is not null
    )
);

comment on table public.partner_commissions is
  'Append-only rev-share ledger. Accruals on invoice.paid; reversals on refunds.';
comment on column public.partner_commissions.base_cents is
  'Amount the percent was applied to after commission_base rules.';
comment on column public.partner_commissions.period_month is
  'UTC YYYY-MM of the invoice/refund for reporting buckets.';

create unique index if not exists partner_commissions_accrual_invoice_uidx
  on public.partner_commissions (stripe_invoice_id)
  where entry_kind = 'accrual' and stripe_invoice_id is not null;

create unique index if not exists partner_commissions_reversal_refund_uidx
  on public.partner_commissions (stripe_refund_id)
  where entry_kind = 'reversal' and stripe_refund_id is not null;

create index if not exists partner_commissions_partner_month_idx
  on public.partner_commissions (partner_id, period_month, created_at desc);

create index if not exists partner_commissions_status_idx
  on public.partner_commissions (status)
  where status in ('pending', 'payable');

create index if not exists partner_commissions_user_id_idx
  on public.partner_commissions (user_id);

create table if not exists public.partner_payouts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete restrict,
  period_month text not null,
  amount_cents integer not null,
  status text not null default 'paid'
    check (status in ('draft', 'paid', 'void')),
  paid_at timestamptz,
  external_reference text,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint partner_payouts_period_month_format
    check (period_month ~ '^[0-9]{4}-[0-9]{2}$')
);

comment on table public.partner_payouts is
  'Manual payout batches marking partner_commissions as paid.';

create index if not exists partner_payouts_partner_month_idx
  on public.partner_payouts (partner_id, period_month desc);

alter table public.partner_commissions
  drop constraint if exists partner_commissions_payout_id_fkey;

alter table public.partner_commissions
  add constraint partner_commissions_payout_id_fkey
  foreign key (payout_id) references public.partner_payouts (id) on delete set null;

alter table public.partner_commissions enable row level security;
alter table public.partner_payouts enable row level security;

-- No member policies: service role / admin only.
