-- Platform features: payments, promos, saved addresses, mover payouts, in-app notifications

-- ---------------------------------------------------------------------------
-- Saved addresses (requester convenience — Uber/Noon-style)
-- ---------------------------------------------------------------------------
create table if not exists saved_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  label text not null default 'Saved',
  address text not null,
  lat double precision not null,
  lng double precision not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_saved_addresses_user_id on saved_addresses(user_id);

-- ---------------------------------------------------------------------------
-- Promo codes (separate from referral credits)
-- ---------------------------------------------------------------------------
create table if not exists promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric not null check (discount_value > 0),
  max_uses integer,
  uses_count integer not null default 0,
  valid_until timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Job payment + promo fields
-- ---------------------------------------------------------------------------
alter table jobs add column if not exists stripe_payment_intent_id text;
alter table jobs add column if not exists promo_code text;
alter table jobs add column if not exists promo_discount numeric default 0;
alter table jobs add column if not exists payment_method text;
alter table jobs add column if not exists paid_at timestamptz;

-- ---------------------------------------------------------------------------
-- Pricing: cancel fee + support contact
-- ---------------------------------------------------------------------------
alter table pricing_config add column if not exists cancel_fee_open numeric not null default 0;
alter table pricing_config add column if not exists support_email text not null default 'support@movethisout.com';
alter table pricing_config add column if not exists support_phone text;

-- Ensure referral_credit_amount exists (from 0006)
alter table pricing_config add column if not exists referral_credit_amount numeric not null default 10;

-- ---------------------------------------------------------------------------
-- Mover payout ledger
-- ---------------------------------------------------------------------------
create table if not exists mover_payouts (
  id uuid primary key default gen_random_uuid(),
  mover_id uuid not null references profiles(id),
  job_id uuid not null references jobs(id) unique,
  amount numeric not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_mover_payouts_mover_id on mover_payouts(mover_id);

-- Auto-create payout row when job completes
create or replace function public.create_mover_payout_on_complete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' and new.mover_id is not null and new.mover_payout is not null then
    insert into public.mover_payouts (mover_id, job_id, amount, status)
    values (new.mover_id, new.id, new.mover_payout, 'pending')
    on conflict (job_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists jobs_create_mover_payout on jobs;
create trigger jobs_create_mover_payout
  after update on jobs
  for each row execute function public.create_mover_payout_on_complete();

-- ---------------------------------------------------------------------------
-- In-app notification inbox
-- ---------------------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text not null,
  url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_notifications_unread on notifications(user_id) where read_at is null;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table saved_addresses enable row level security;
alter table promo_codes enable row level security;
alter table mover_payouts enable row level security;
alter table notifications enable row level security;

create policy "saved_addresses_own" on saved_addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "promo_codes_admin" on promo_codes
  for all using (public.is_admin()) with check (public.is_admin());

create policy "promo_codes_read_active" on promo_codes
  for select using (active = true);

create policy "mover_payouts_admin" on mover_payouts
  for all using (public.is_admin()) with check (public.is_admin());

create policy "mover_payouts_select_self" on mover_payouts
  for select using (auth.uid() = mover_id);

create policy "notifications_own" on notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
