-- SMS notifications opt-in (Workstream 3). profiles_update_self (0001_init.sql)
-- only pins role/is_suspended, so this new column is owner-editable with no
-- RLS policy change needed.

alter table profiles add column sms_notifications_enabled boolean not null default false;
