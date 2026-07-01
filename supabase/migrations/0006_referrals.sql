-- Referral program (Workstream 5): every user gets a unique referral_code at
-- signup. Sharing ?ref=CODE and having the referred user complete their
-- first job credits BOTH the referrer and the referred user a flat
-- account_credit amount (pricing_config.referral_credit_amount, not
-- hardcoded). Credit is auto-applied (up to the quote total) at booking
-- time via calculate-price's apply_credit flag and consumed atomically by
-- the jobs_consume_referral_credit trigger below.

alter table profiles add column referral_code text unique;

update profiles set referral_code = substr(md5(random()::text || id::text), 1, 8) where referral_code is null;

alter table profiles alter column referral_code set not null;

alter table profiles add column account_credit numeric not null default 0;

alter table pricing_config add column referral_credit_amount numeric not null default 10;

-- Reproduces handle_new_user() from 0003_oauth_signup.sql (full_name/name and
-- avatar_url/picture fallbacks for OAuth signups), extended to also generate
-- a referral_code for every new profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role, avatar_url, referral_code)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'role', 'requester'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null),
    substr(md5(random()::text || new.id::text), 1, 8)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- =========================================================================
-- Table: referrals — tracks a pending/completed referral relationship
-- between the referrer (existing user whose code was shared) and the
-- referred user (new signup who supplied ?ref=CODE).
-- =========================================================================

create table referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references profiles(id),
  referred_id uuid not null references profiles(id) unique,
  referral_code text not null,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (referrer_id != referred_id)
);

create index idx_referrals_referrer_id on referrals(referrer_id);

alter table jobs add column credit_applied numeric;

-- =========================================================================
-- Trigger: consume account credit at job-creation time. Runs before insert
-- so the credit_applied amount on the new job is atomically deducted from
-- the requester's balance in the same statement (mirrors the other
-- SECURITY DEFINER trigger functions in 0001_init.sql, e.g.
-- log_job_status_change / increment_mover_total_jobs).
-- =========================================================================

create or replace function public.consume_referral_credit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_credit numeric;
begin
  if new.credit_applied is not null and new.credit_applied > 0 then
    select account_credit into current_credit from public.profiles where id = new.requester_id;
    if new.credit_applied > current_credit then
      raise exception 'Insufficient account credit';
    end if;
    update public.profiles set account_credit = account_credit - new.credit_applied where id = new.requester_id;
  end if;
  return new;
end;
$$;

create trigger jobs_consume_referral_credit
  before insert on jobs
  for each row execute function public.consume_referral_credit();

-- =========================================================================
-- Row Level Security
-- =========================================================================

alter table referrals enable row level security;

create policy "referrals_admin_all" on referrals
  for all using (public.is_admin()) with check (public.is_admin());

create policy "referrals_select_participant" on referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referred_id);

create policy "referrals_insert_referred" on referrals
  for insert with check (auth.uid() = referred_id and status = 'pending');
