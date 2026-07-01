-- MoveThisOut — in-app chat between requester and mover (Workstream 4)
-- Messages are only sendable while the job is 'claimed' or 'in_progress';
-- history remains readable afterward. Enforced at the RLS layer, not just UI.

create table messages (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index idx_messages_job_id_created_at on messages(job_id, created_at);

-- =========================================================================
-- Realtime (ChatPanel subscribes to postgres_changes on messages)
-- =========================================================================

do $$
begin
  alter publication supabase_realtime add table messages;
exception
  when duplicate_object then null;
end $$;

-- =========================================================================
-- Row Level Security
-- =========================================================================

alter table messages enable row level security;

create policy "messages_admin_all" on messages
  for all using (public.is_admin()) with check (public.is_admin());

create policy "messages_select_participant" on messages
  for select using (
    exists (select 1 from jobs j where j.id = messages.job_id and (j.requester_id = auth.uid() or j.mover_id = auth.uid()))
  );

-- Sending is only allowed while the job is claimed/in_progress — this is the
-- DB-level enforcement backing the read-only-after-job-ends UI rule.
create policy "messages_insert_participant" on messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from jobs j
      where j.id = messages.job_id
        and (j.requester_id = auth.uid() or j.mover_id = auth.uid())
        and j.status in ('claimed', 'in_progress')
    )
  );

-- A participant may mark the OTHER side's messages as read, but may not
-- touch content/sender_id/job_id/created_at — only read_at may change.
-- Mirrors the "pin unchanged columns to their old value" technique used by
-- mover_profiles_update_self / profiles_update_self in 0001_init.sql.
create policy "messages_update_read_participant" on messages
  for update using (
    exists (select 1 from jobs j where j.id = messages.job_id and (j.requester_id = auth.uid() or j.mover_id = auth.uid()))
  )
  with check (
    sender_id <> auth.uid()
    and job_id = (select m.job_id from messages m where m.id = messages.id)
    and sender_id = (select m.sender_id from messages m where m.id = messages.id)
    and content = (select m.content from messages m where m.id = messages.id)
    and created_at = (select m.created_at from messages m where m.id = messages.id)
  );
