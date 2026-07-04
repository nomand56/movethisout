-- FR-504: configurable peak hour rules in pricing_config
alter table pricing_config
  add column if not exists peak_weekend_morning boolean not null default true,
  add column if not exists peak_evening boolean not null default true;
