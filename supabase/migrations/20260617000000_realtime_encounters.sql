-- Enable Supabase Realtime for the combat tracker tables.
-- src/hooks/useEncounter.ts subscribes to postgres_changes on both
-- campaign_encounters and encounter_combatants, but neither was ever added to
-- the supabase_realtime publication, so combat state (initiative, HP changes,
-- combatants added/removed) did not sync live for other players — same latent
-- bug as campaign_messages (see 20260615000000_realtime_campaign_messages.sql).

-- REPLICA IDENTITY FULL so DELETE events carry the filtered columns
-- (campaign_id / encounter_id); the client filters on these, and without it a
-- delete's payload only carries the primary key, so removing an encounter or a
-- combatant would not sync live.
alter table campaign_encounters replica identity full;
alter table encounter_combatants replica identity full;

do $$
declare
  t text;
begin
  foreach t in array array['campaign_encounters', 'encounter_combatants']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;
