-- Run this in Supabase SQL Editor after schema.sql

-- Offers table: movers propose terms, requesters accept/decline
create table if not exists public.offers (
  id uuid default uuid_generate_v4() primary key,
  request_id uuid references public.requests(id) on delete cascade not null,
  mover_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  proposed_value int,                -- informational only, not a charge
  status text check (status in ('pending', 'accepted', 'declined')) default 'pending',
  created_at timestamptz default now(),
  unique (request_id, mover_id)      -- one offer per mover per request
);

alter table public.offers enable row level security;

create policy "Requester and mover can view offer"
  on public.offers for select
  using (
    auth.uid() = mover_id or
    auth.uid() = (select requester_id from public.requests where id = request_id)
  );

create policy "Movers can insert offers"
  on public.offers for insert
  with check (auth.uid() = mover_id);

create policy "Requester or mover can update offer"
  on public.offers for update
  using (
    auth.uid() = mover_id or
    auth.uid() = (select requester_id from public.requests where id = request_id)
  );

-- Enable realtime for offers
alter publication supabase_realtime add table public.offers;

-- Add phone to profiles if missing
alter table public.profiles add column if not exists phone text;
