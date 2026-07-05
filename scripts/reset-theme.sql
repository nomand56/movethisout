-- Fix broken theme colors (invisible text) — safe to re-run
update theme_config set
  brand_name = 'MoveThisOut',
  accent_color = '#E85D04',
  accent_hover_color = '#D45303',
  accent_soft_color = '#FFF4ED',
  ink_color = '#1A1A1A',
  ink_muted_color = '#6B7280',
  surface_muted_color = '#F5F5F7',
  mover_color = '#1E293B',
  header_color = '#1A1A1A',
  updated_at = now()
where true;
