-- MoveThisOut — one-shot remote setup (safe to re-run)
-- Supabase Dashboard → SQL Editor → paste & Run:
-- https://supabase.com/dashboard/project/idrjqczlvfvatgdwfxei/sql/new

-- ========== Migrations 0006–0009 (idempotent) ==========
alter table profiles add column if not exists referral_code text;
alter table profiles add column if not exists account_credit numeric not null default 0;
alter table pricing_config add column if not exists referral_credit_amount numeric not null default 10;
alter table jobs add column if not exists credit_applied numeric;

update profiles set referral_code = substr(md5(random()::text || id::text), 1, 8)
where referral_code is null;

do $$ begin
  alter table profiles alter column referral_code set not null;
exception when others then null;
end $$;

create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references profiles(id),
  referred_id uuid not null references profiles(id) unique,
  referral_code text not null,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (referrer_id != referred_id)
);
create index if not exists idx_referrals_referrer_id on referrals(referrer_id);

alter table pricing_config
  add column if not exists peak_weekend_morning boolean not null default true,
  add column if not exists peak_evening boolean not null default true;

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

alter table jobs add column if not exists stripe_payment_intent_id text;
alter table jobs add column if not exists promo_code text;
alter table jobs add column if not exists promo_discount numeric default 0;
alter table jobs add column if not exists payment_method text;
alter table jobs add column if not exists paid_at timestamptz;

alter table pricing_config add column if not exists cancel_fee_open numeric not null default 0;
alter table pricing_config add column if not exists support_email text not null default 'support@movethisout.com';
alter table pricing_config add column if not exists support_phone text;

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

alter table saved_addresses enable row level security;
alter table promo_codes enable row level security;
alter table mover_payouts enable row level security;
alter table notifications enable row level security;
alter table referrals enable row level security;

do $$ begin create policy "saved_addresses_own" on saved_addresses for all using (auth.uid() = user_id) with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "promo_codes_admin" on promo_codes for all using (public.is_admin()) with check (public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "promo_codes_read_active" on promo_codes for select using (active = true); exception when duplicate_object then null; end $$;
do $$ begin create policy "mover_payouts_admin" on mover_payouts for all using (public.is_admin()) with check (public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "mover_payouts_select_self" on mover_payouts for select using (auth.uid() = mover_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "notifications_own" on notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "referrals_admin_all" on referrals for all using (public.is_admin()) with check (public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "referrals_select_participant" on referrals for select using (auth.uid() = referrer_id or auth.uid() = referred_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "referrals_insert_referred" on referrals for insert with check (auth.uid() = referred_id and status = 'pending'); exception when duplicate_object then null; end $$;

do $$ begin
  create policy "jobs_update_requester_confirm" on jobs
    for update using (auth.uid() = requester_id and status = 'draft')
    with check (auth.uid() = requester_id and status = 'open');
exception when duplicate_object then null;
end $$;

-- ========== Seed pricing (if missing) ==========
insert into pricing_config (rate_per_km, rate_small, rate_medium, rate_large, rate_extra_large, peak_multiplier, commission_rate)
select 2.50, 10, 25, 50, 90, 1.2, 0.20
where not exists (select 1 from pricing_config limit 1);

-- ========== Launch promo ==========
insert into promo_codes (code, discount_type, discount_value, max_uses, valid_until, active)
values ('KAMLOOPS20', 'percent', 20, 500, now() + interval '1 year', true)
on conflict (code) do nothing;

-- ========== Default admin (run after signup at /admin/login) ==========
-- Email:    admin@movethisout.com
-- Password: Admin@Kamloops2026!

update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email = 'admin@movethisout.com';

update public.profiles
set role = 'admin', full_name = coalesce(full_name, 'MoveThisOut Admin')
where id = (select id from auth.users where email = 'admin@movethisout.com' limit 1);

-- ========== Mover can claim jobs without edge function (0010) ==========
do $$ begin
  create policy "jobs_update_mover_claim" on jobs
    for update using (
      status = 'open'
      and exists (
        select 1 from mover_profiles mp
        where mp.id = auth.uid() and mp.status = 'active'
      )
    )
    with check (auth.uid() = mover_id and status = 'claimed');
exception when duplicate_object then null;
end $$;

-- Optional: approve a mover by email (replace with your mover's email)
-- update mover_profiles set status = 'active'
-- where id = (select id from auth.users where email = 'mover@example.com' limit 1);

-- ========== 0011 Admin theme config ==========
create table if not exists theme_config (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null default 'MoveThisOut',
  accent_color text not null default '#E85D04',
  accent_hover_color text not null default '#D45303',
  accent_soft_color text not null default '#FFF4ED',
  ink_color text not null default '#1A1A1A',
  ink_muted_color text not null default '#6B7280',
  surface_muted_color text not null default '#F5F5F7',
  mover_color text not null default '#1E293B',
  header_color text not null default '#1A1A1A',
  updated_at timestamptz not null default now()
);

insert into theme_config (brand_name)
select 'MoveThisOut'
where not exists (select 1 from theme_config limit 1);

alter table theme_config enable row level security;

do $$ begin
  create policy "theme_config_select_all" on theme_config for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "theme_config_admin_write" on theme_config
    for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null;
end $$;
