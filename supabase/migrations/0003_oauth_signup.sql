-- OAuth signup support (Google via Supabase Auth's built-in OAuth provider).
-- OAuth signups can't carry a `?role=` param like the password signup flow
-- does, so new Google signups always default to role='requester'; the
-- client prompts a one-time "are you a mover?" question post-signup and, if
-- chosen, calls the set-mover-role Edge Function (RLS blocks the client
-- from flipping profiles.role itself — see profiles_update_self in
-- 0001_init.sql).

alter table profiles add column avatar_url text;

-- Reproduces handle_new_user() from 0001_init.sql, extended to also read
-- full_name/avatar_url out of the Google OAuth metadata shape
-- (raw_user_meta_data has 'name'/'picture' instead of 'full_name'/'avatar_url').
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'role', 'requester'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
