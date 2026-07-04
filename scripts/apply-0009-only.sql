-- Run once in Supabase Dashboard → SQL Editor → Run
-- https://supabase.com/dashboard/project/idrjqczlvfvatgdwfxei/sql/new
--
-- Allows confirming draft jobs without the confirm-payment edge function.

do $$ begin
  create policy "jobs_update_requester_confirm" on jobs
    for update using (auth.uid() = requester_id and status = 'draft')
    with check (auth.uid() = requester_id and status = 'open');
exception when duplicate_object then null;
end $$;
