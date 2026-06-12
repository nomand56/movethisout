-- schema_v3.sql — Run in Supabase SQL Editor after schema_v2.sql

-- ── Extend profiles with mover-specific fields ──
alter table public.profiles
  add column if not exists is_mover         boolean default false,
  add column if not exists mover_status     text check (mover_status in ('pending', 'active', 'suspended')),
  add column if not exists vehicle_type     text check (vehicle_type in ('sedan','suv','pickup','van','truck','other')),
  add column if not exists vehicle_capacity text check (vehicle_capacity in ('light','medium','heavy')),
  add column if not exists service_city     text,
  add column if not exists bio              text;

-- ── Add ETA field to offers ──
alter table public.offers
  add column if not exists eta_minutes int;

-- ── Allow movers to view all open requests ──
-- (The existing policy already uses `using (true)` so all rows are visible.
-- If you previously tightened RLS, run the following to ensure movers can browse.)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'requests'
      and policyname = 'Anyone can view open requests'
  ) then
    create policy "Anyone can view open requests"
      on public.requests for select using (true);
  end if;
end $$;

-- ── Movers can update offers they sent (e.g. cancel) ──
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'offers'
      and policyname = 'Movers can update own offers'
  ) then
    create policy "Movers can update own offers"
      on public.offers for update
      using (auth.uid() = mover_id);
  end if;
end $$;

-- ── Index for fast mover offer lookups ──
create index if not exists offers_mover_id_idx on public.offers (mover_id);
create index if not exists offers_request_id_idx on public.offers (request_id);
create index if not exists profiles_is_mover_idx on public.profiles (is_mover) where is_mover = true;

-- ── Enable realtime on offers if not already enabled ──
do $$
begin
  perform pg_catalog.pg_get_publication_tables('supabase_realtime');
  -- Attempt to add; silently fails if already present
  begin
    alter publication supabase_realtime add table public.offers;
  exception when others then null;
  end;
end $$;
