-- Enable Supabase Realtime for campaign_messages.
-- The client (src/hooks/useCampaignMessages.ts) already subscribes via
-- postgres_changes, but the table was never added to the supabase_realtime
-- publication, so the database never broadcast change events. As a result new
-- messages only appeared after the 2-minute React Query staleTime or a manual
-- page refresh. Adding the table to the publication makes the subscription live.

-- REPLICA IDENTITY FULL so DELETE events include campaign_id; the client filters
-- on campaign_id=eq.<id>, and without this a delete's payload only carries the
-- primary key, so deletions would be dropped by the filter and not sync live.
alter table campaign_messages replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'campaign_messages'
  ) then
    alter publication supabase_realtime add table campaign_messages;
  end if;
end $$;
