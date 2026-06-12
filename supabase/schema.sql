-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  avatar_url text,
  rating_avg numeric(3,2) default 0,
  rating_count int default 0,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view all profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Requests (job posts)
create table public.requests (
  id uuid default uuid_generate_v4() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,

  -- Locations
  pickup_address text not null,
  pickup_lat numeric(10,7) not null,
  pickup_lng numeric(10,7) not null,
  dropoff_address text not null,
  dropoff_lat numeric(10,7) not null,
  dropoff_lng numeric(10,7) not null,

  -- Item details
  title text not null,
  description text,
  item_size text check (item_size in ('small', 'medium', 'large', 'extra_large')) default 'medium',
  photo_urls text[] default '{}',

  -- Scheduling
  preferred_time timestamptz,

  -- Calculated by system
  estimated_distance_km numeric(8,2),
  estimated_duration_min int,
  effort_score int check (effort_score between 0 and 100),

  -- Status
  status text check (status in ('open', 'accepted', 'in_progress', 'completed', 'cancelled')) default 'open',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.requests enable row level security;

create policy "Anyone can view open requests" on public.requests for select using (true);
create policy "Requesters can insert own requests" on public.requests for insert with check (auth.uid() = requester_id);
create policy "Requesters can update own requests" on public.requests for update using (auth.uid() = requester_id);

-- Jobs (accepted requests)
create table public.jobs (
  id uuid default uuid_generate_v4() primary key,
  request_id uuid references public.requests(id) on delete cascade not null unique,
  volunteer_id uuid references public.profiles(id) on delete cascade not null,
  accepted_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz,

  -- Ratings
  requester_rating int check (requester_rating between 1 and 5),
  requester_review text,
  volunteer_rating int check (volunteer_rating between 1 and 5),
  volunteer_review text,

  created_at timestamptz default now()
);

alter table public.jobs enable row level security;

create policy "Job participants can view jobs" on public.jobs for select
  using (
    auth.uid() = volunteer_id or
    auth.uid() = (select requester_id from public.requests where id = request_id)
  );
create policy "Volunteers can insert jobs" on public.jobs for insert with check (auth.uid() = volunteer_id);
create policy "Participants can update jobs" on public.jobs for update
  using (
    auth.uid() = volunteer_id or
    auth.uid() = (select requester_id from public.requests where id = request_id)
  );

-- Messages (realtime chat)
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.jobs(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Job participants can view messages" on public.messages for select
  using (
    exists (
      select 1 from public.jobs j
      join public.requests r on r.id = j.request_id
      where j.id = job_id
      and (auth.uid() = j.volunteer_id or auth.uid() = r.requester_id)
    )
  );

create policy "Job participants can send messages" on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.jobs j
      join public.requests r on r.id = j.request_id
      where j.id = job_id
      and (auth.uid() = j.volunteer_id or auth.uid() = r.requester_id)
    )
  );

-- Enable realtime for messages
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.jobs;
alter publication supabase_realtime add table public.requests;

-- Update updated_at on requests
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger requests_updated_at
  before update on public.requests
  for each row execute procedure public.set_updated_at();

-- Storage bucket for item photos
insert into storage.buckets (id, name, public) values ('item-photos', 'item-photos', true)
on conflict do nothing;

create policy "Anyone can view item photos" on storage.objects for select
  using (bucket_id = 'item-photos');

create policy "Authenticated users can upload item photos" on storage.objects for insert
  with check (bucket_id = 'item-photos' and auth.role() = 'authenticated');
