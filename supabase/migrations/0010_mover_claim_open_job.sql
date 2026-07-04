-- Let approved movers claim open jobs from the app when claim-job edge function is not deployed.
do $$ begin
  create policy "jobs_update_mover_claim" on jobs
    for update using (
      status = 'open'
      and exists (
        select 1 from mover_profiles mp
        where mp.id = auth.uid() and mp.status = 'active'
      )
    )
    with check (
      auth.uid() = mover_id
      and status = 'claimed'
    );
exception when duplicate_object then null;
end $$;
