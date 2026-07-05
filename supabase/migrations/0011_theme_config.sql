-- Admin-editable app theme (single row, public read)
create table if not exists theme_config (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null default 'MoveThisOut',
  accent_color text not null default '#E85D04',
  accent_hover_color text not null default '#D45303',
  accent_soft_color text not null default '#FFF4ED',
  ink_color text not null default '#1A1A1A',
  ink_muted_color text not null default '#6B7280',
  surface_muted_color text not null default '#F5F5F7',
  mover_color text not null default '#1E293B',
  header_color text not null default '#1A1A1A',
  updated_at timestamptz not null default now()
);

insert into theme_config (brand_name)
select 'MoveThisOut'
where not exists (select 1 from theme_config limit 1);

alter table theme_config enable row level security;

do $$ begin
  create policy "theme_config_select_all" on theme_config for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "theme_config_admin_write" on theme_config
    for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null;
end $$;
