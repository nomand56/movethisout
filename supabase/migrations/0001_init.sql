-- MoveThisOut — initial schema
-- Matches SRS section 7 (Data Model) and 7.4 (RLS Summary), reconciled against
-- the exact columns/enums/FK names/buckets/channels the frontend already queries.

create extension if not exists pgcrypto;

-- =========================================================================
-- Tables
-- =========================================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  phone text not null default '',
  role text not null default 'requester' check (role in ('requester', 'mover', 'admin')),
  is_suspended boolean not null default false,
  created_at timestamptz not null default now()
);

create table mover_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  vehicle_type text not null check (vehicle_type in ('cargo_van', 'small_truck', 'large_truck')),
  vehicle_capacity numeric not null,
  service_radius numeric not null,
  home_base_address text not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  is_online boolean not null default false,
  avg_rating numeric not null default 0,
  total_jobs integer not null default 0,
  licence_url text,
  registration_url text,
  created_at timestamptz not null default now()
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id),
  mover_id uuid references profiles(id),
  pickup_address text not null,
  pickup_lat double precision not null,
  pickup_lng double precision not null,
  dropoff_address text not null,
  dropoff_lat double precision not null,
  dropoff_lng double precision not null,
  scheduled_date date not null,
  time_window text not null check (time_window in ('morning', 'afternoon', 'evening')),
  status text not null default 'draft' check (status in ('draft', 'open', 'claimed', 'in_progress', 'completed', 'cancelled')),
  quoted_price numeric,
  platform_fee numeric,
  mover_payout numeric,
  distance_km numeric,
  notes text,
  completion_photo_url text,
  signature_url text,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table job_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  name text not null,
  size text not null check (size in ('small', 'medium', 'large', 'extra_large')),
  quantity integer not null check (quantity >= 1),
  photo_url text
);

create table job_status_history (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  status text not null,
  created_at timestamptz not null default now()
);

create table location_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now()
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references jobs(id) on delete cascade,
  requester_id uuid not null references profiles(id),
  mover_id uuid not null references profiles(id),
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create table pricing_config (
  id uuid primary key default gen_random_uuid(),
  rate_per_km numeric not null,
  rate_small numeric not null,
  rate_medium numeric not null,
  rate_large numeric not null,
  rate_extra_large numeric not null,
  peak_multiplier numeric not null default 1.2,
  commission_rate numeric not null default 0.20
);

insert into pricing_config (rate_per_km, rate_small, rate_medium, rate_large, rate_extra_large, peak_multiplier, commission_rate)
values (2.50, 10, 25, 50, 90, 1.2, 0.20);

-- =========================================================================
-- Indexes (NFR-303: every FK and every common WHERE-clause column)
-- =========================================================================

create index idx_jobs_requester_id on jobs(requester_id);
create index idx_jobs_mover_id on jobs(mover_id);
create index idx_jobs_status on jobs(status);
create index idx_jobs_scheduled_date on jobs(scheduled_date);
create index idx_job_items_job_id on job_items(job_id);
create index idx_job_status_history_job_id on job_status_history(job_id);
create index idx_location_events_job_id_created_at on location_events(job_id, created_at desc);
create index idx_reviews_mover_id on reviews(mover_id);
create index idx_push_subscriptions_user_id on push_subscriptions(user_id);
create index idx_mover_profiles_status on mover_profiles(status);
create index idx_mover_profiles_is_online on mover_profiles(is_online);

-- =========================================================================
-- Realtime (RequestCenterPage + JobDetailPage subscribe to postgres_changes on jobs)
-- =========================================================================

do $$
begin
  alter publication supabase_realtime add table jobs;
exception
  when duplicate_object then null;
end $$;

-- =========================================================================
-- Helper: is_admin() — SECURITY DEFINER so it can read profiles without
-- recursing into the RLS policies defined below.
-- =========================================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- =========================================================================
-- Trigger: create a profile row when a new auth user is created, copying
-- full_name / phone / role out of the signup metadata (RegisterPage passes
-- these via `supabase.auth.signUp({ options: { data: {...} } })`).
-- This is the fix for the "full_name is null -> dashboard crashes" bug.
-- =========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'role', 'requester')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: create profile rows for any auth.users that predate this
-- migration (e.g. signups from before the schema was wiped/rebuilt), and
-- fix any existing profile rows that have a blank full_name.
insert into public.profiles (id, email, full_name, phone, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', ''),
  coalesce(u.raw_user_meta_data->>'phone', ''),
  coalesce(u.raw_user_meta_data->>'role', 'requester')
from auth.users u
on conflict (id) do nothing;

update public.profiles p
set
  full_name = coalesce(nullif(p.full_name, ''), u.raw_user_meta_data->>'full_name', ''),
  phone = coalesce(nullif(p.phone, ''), u.raw_user_meta_data->>'phone', '')
from auth.users u
where u.id = p.id
  and (p.full_name = '' or p.full_name is null or p.phone = '' or p.phone is null);

-- =========================================================================
-- Trigger: keep jobs.updated_at current
-- =========================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger jobs_set_updated_at
  before update on jobs
  for each row execute function public.set_updated_at();

-- =========================================================================
-- Trigger: append to job_status_history whenever a job is created or its
-- status changes (FR-217 status timeline; queried as job_status_history(*)).
-- =========================================================================

create or replace function public.log_job_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    insert into public.job_status_history (job_id, status) values (new.id, new.status);
  end if;
  return new;
end;
$$;

create trigger job_status_history_trigger
  after insert or update on jobs
  for each row execute function public.log_job_status_change();

-- =========================================================================
-- Trigger: bump mover_profiles.total_jobs when a job they hold completes
-- (FR-301 dashboard stat).
-- =========================================================================

create or replace function public.increment_mover_total_jobs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' and new.mover_id is not null then
    update public.mover_profiles set total_jobs = total_jobs + 1 where id = new.mover_id;
  end if;
  return new;
end;
$$;

create trigger jobs_increment_mover_total_jobs
  after update on jobs
  for each row execute function public.increment_mover_total_jobs();

-- =========================================================================
-- Trigger: recompute mover_profiles.avg_rating whenever a review lands
-- (FR-301 dashboard stat).
-- =========================================================================

create or replace function public.update_mover_avg_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.mover_profiles
  set avg_rating = (select coalesce(avg(rating), 0) from public.reviews where mover_id = new.mover_id)
  where id = new.mover_id;
  return new;
end;
$$;

create trigger reviews_update_mover_avg_rating
  after insert on reviews
  for each row execute function public.update_mover_avg_rating();

-- =========================================================================
-- Row Level Security
-- =========================================================================

alter table profiles enable row level security;
alter table mover_profiles enable row level security;
alter table jobs enable row level security;
alter table job_items enable row level security;
alter table job_status_history enable row level security;
alter table location_events enable row level security;
alter table reviews enable row level security;
alter table push_subscriptions enable row level security;
alter table pricing_config enable row level security;

-- ---- profiles ----
-- Section 7.4 says "own row" for requester/mover, but FR-214 requires a
-- requester to see their assigned mover's name/phone (and vice versa isn't
-- needed today, but the same rule covers it), so we add a narrow
-- counterparty-visibility policy on top of "own row".

create policy "profiles_admin_all" on profiles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "profiles_select_self" on profiles
  for select using (auth.uid() = id);

create policy "profiles_select_job_counterparty" on profiles
  for select using (
    exists (
      select 1 from jobs j
      where (j.requester_id = auth.uid() and j.mover_id = profiles.id)
         or (j.mover_id = auth.uid() and j.requester_id = profiles.id)
    )
  );

-- Self-update is allowed, but role/is_suspended may not be changed by the
-- user themselves — only via the admin_all policy above.
create policy "profiles_update_self" on profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from profiles p where p.id = auth.uid())
    and is_suspended = (select is_suspended from profiles p where p.id = auth.uid())
  );

-- ---- mover_profiles ----
-- Section 7.4: requester "None" directly, but FR-214 requires showing
-- vehicle_type/rating for the mover assigned to the requester's own job.

create policy "mover_profiles_admin_all" on mover_profiles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "mover_profiles_select_self" on mover_profiles
  for select using (auth.uid() = id);

create policy "mover_profiles_select_requester_counterparty" on mover_profiles
  for select using (
    exists (select 1 from jobs j where j.mover_id = mover_profiles.id and j.requester_id = auth.uid())
  );

create policy "mover_profiles_insert_self" on mover_profiles
  for insert with check (auth.uid() = id);

-- Movers may edit their own vehicle/contact info, but not self-approve or
-- fabricate their own rating/job count — those only change via triggers or
-- the admin/approve-mover Edge Function (service role bypasses RLS).
create policy "mover_profiles_update_self" on mover_profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and status = (select status from mover_profiles mp where mp.id = auth.uid())
    and avg_rating = (select avg_rating from mover_profiles mp where mp.id = auth.uid())
    and total_jobs = (select total_jobs from mover_profiles mp where mp.id = auth.uid())
  );

-- ---- jobs ----

create policy "jobs_admin_all" on jobs
  for all using (public.is_admin()) with check (public.is_admin());

create policy "jobs_select_requester" on jobs
  for select using (auth.uid() = requester_id);

create policy "jobs_select_mover" on jobs
  for select using (status = 'open' or auth.uid() = mover_id);

create policy "jobs_insert_requester" on jobs
  for insert with check (auth.uid() = requester_id and status in ('draft', 'open'));

-- Requester may only cancel from draft/open (FR-219/220); claim/complete
-- happen exclusively through the claim-job / complete-job Edge Functions.
create policy "jobs_update_requester_cancel" on jobs
  for update using (auth.uid() = requester_id and status in ('draft', 'open'))
  with check (auth.uid() = requester_id and status = 'cancelled');

-- Mover may advance claimed -> in_progress directly (ActiveJobPage); the
-- open -> claimed and in_progress -> completed transitions are atomic and
-- only ever performed by the claim-job / complete-job Edge Functions.
create policy "jobs_update_mover" on jobs
  for update using (auth.uid() = mover_id)
  with check (auth.uid() = mover_id and status in ('claimed', 'in_progress'));

-- ---- job_items ----

create policy "job_items_admin_all" on job_items
  for all using (public.is_admin()) with check (public.is_admin());

create policy "job_items_select_requester" on job_items
  for select using (exists (select 1 from jobs j where j.id = job_items.job_id and j.requester_id = auth.uid()));

-- Movers can see items for any open job (Request Center detail view, FR-314)
-- or their own claimed job.
create policy "job_items_select_mover" on job_items
  for select using (
    exists (select 1 from jobs j where j.id = job_items.job_id and (j.status = 'open' or j.mover_id = auth.uid()))
  );

create policy "job_items_insert_requester" on job_items
  for insert with check (exists (select 1 from jobs j where j.id = job_items.job_id and j.requester_id = auth.uid()));

-- ---- job_status_history ----
-- No client insert policy: rows are only ever written by the
-- log_job_status_change() trigger (SECURITY DEFINER, bypasses RLS).

create policy "job_status_history_admin_all" on job_status_history
  for all using (public.is_admin()) with check (public.is_admin());

create policy "job_status_history_select_participant" on job_status_history
  for select using (
    exists (select 1 from jobs j where j.id = job_status_history.job_id and (j.requester_id = auth.uid() or j.mover_id = auth.uid()))
  );

-- ---- location_events ----

create policy "location_events_admin_all" on location_events
  for all using (public.is_admin()) with check (public.is_admin());

create policy "location_events_select_participant" on location_events
  for select using (
    exists (select 1 from jobs j where j.id = location_events.job_id and (j.requester_id = auth.uid() or j.mover_id = auth.uid()))
  );

create policy "location_events_insert_mover" on location_events
  for insert with check (
    exists (select 1 from jobs j where j.id = location_events.job_id and j.mover_id = auth.uid() and j.status = 'in_progress')
  );

-- ---- reviews ----
-- No update/delete policy for requester/mover: FR-225 says reviews are
-- immutable once submitted.

create policy "reviews_admin_all" on reviews
  for all using (public.is_admin()) with check (public.is_admin());

create policy "reviews_select_participant" on reviews
  for select using (auth.uid() = requester_id or auth.uid() = mover_id);

create policy "reviews_insert_requester" on reviews
  for insert with check (
    auth.uid() = requester_id
    and exists (
      select 1 from jobs j
      where j.id = reviews.job_id and j.requester_id = auth.uid() and j.status = 'completed' and j.mover_id = reviews.mover_id
    )
  );

-- ---- push_subscriptions ----

create policy "push_subscriptions_admin_all" on push_subscriptions
  for all using (public.is_admin()) with check (public.is_admin());

create policy "push_subscriptions_owner" on push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- pricing_config ----

create policy "pricing_config_select_all" on pricing_config
  for select using (auth.role() = 'authenticated');

create policy "pricing_config_admin_write" on pricing_config
  for all using (public.is_admin()) with check (public.is_admin());

-- =========================================================================
-- Storage buckets (NFR-404: JPEG/PNG for photos, PDF allowed for docs, 10MB max)
-- =========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('item-photos', 'item-photos', true, 10485760, array['image/jpeg', 'image/png']),
  ('completion-photos', 'completion-photos', true, 10485760, array['image/jpeg', 'image/png']),
  ('mover-documents', 'mover-documents', false, 10485760, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do nothing;

-- item-photos: owner-only write, public read (bucket is public)
create policy "item_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "item_photos_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "item_photos_select" on storage.objects
  for select using (bucket_id = 'item-photos');

-- completion-photos: only the assigned mover writes, public read
create policy "completion_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'completion-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "completion_photos_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'completion-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "completion_photos_select" on storage.objects
  for select using (bucket_id = 'completion-photos');

-- mover-documents: private — owner or admin only (admin needs this to
-- generate signed URLs in the approval queue)
create policy "mover_documents_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'mover-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "mover_documents_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'mover-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
