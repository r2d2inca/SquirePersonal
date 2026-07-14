-- Shared trigger function to auto-update `updated_at` timestamps.
--
-- This helper exists in the original production database (it was created
-- there manually, before migrations were tracked), but it was never captured
-- as a migration file. Several later migrations (campaign_quests,
-- combat_tracker, ...) attach triggers that call it, so a fresh project has
-- to define it first. Added here so the schema is reproducible from scratch.
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
