-- Fix: "infinite recursion detected in policy for relation mover_profiles"
-- (Postgres error 42P17). mover_profiles_update_self's WITH CHECK subqueried
-- mover_profiles directly to read the pre-update values of status/avg_rating/
-- total_jobs; since RLS is enabled on that table, the subquery re-triggers
-- policy evaluation on itself. This hit anyone whose client issued an
-- upsert() against mover_profiles (INSERT ... ON CONFLICT DO UPDATE forces
-- Postgres to plan the row against the UPDATE policy too, even on first
-- insert with zero conflicting rows).
--
-- Same fix pattern already used by is_admin(): a SECURITY DEFINER function
-- reads the table bypassing RLS, breaking the recursive lookup.

create or replace function public.mover_profile_locked_fields_unchanged(
  p_id uuid, p_status text, p_avg_rating numeric, p_total_jobs integer
) returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.mover_profiles
    where id = p_id and status = p_status and avg_rating = p_avg_rating and total_jobs = p_total_jobs
  );
$$;

drop policy "mover_profiles_update_self" on mover_profiles;

create policy "mover_profiles_update_self" on mover_profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and public.mover_profile_locked_fields_unchanged(id, status, avg_rating, total_jobs)
  );
