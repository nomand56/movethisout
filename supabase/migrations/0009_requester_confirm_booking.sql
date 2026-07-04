-- Allow requesters to publish their own draft jobs (draft → open) without an Edge Function.
-- Needed when confirm-payment is not deployed; complements the edge function path.

create policy "jobs_update_requester_confirm" on jobs
  for update using (auth.uid() = requester_id and status = 'draft')
  with check (auth.uid() = requester_id and status = 'open');
