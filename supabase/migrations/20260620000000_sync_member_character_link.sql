-- Fix: players not appearing in DM Party Overview.
--
-- join_campaign_by_code() captures the player's active character_id at the
-- moment they join. If a player joined before creating a character (or later
-- created/swapped characters), campaign_members.character_id is null or stale,
-- and the party query (which filters out null character_id) drops them.
--
-- Fix in two parts: (1) backfill existing player memberships to point at the
-- member's current active character, and (2) a trigger that keeps the link in
-- sync whenever a character becomes active. DM memberships (role 'dm') are left
-- untouched so the DM doesn't appear in their own party list.

-- (1) Backfill
update campaign_members cm
set character_id = ch.id
from characters ch
where ch.user_id = cm.user_id
  and ch.is_active = true
  and cm.role = 'player'
  and cm.character_id is distinct from ch.id;

-- (2) Keep in sync going forward
create or replace function public.sync_member_character()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_active then
    update campaign_members
    set character_id = new.id
    where user_id = new.user_id
      and role = 'player';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_member_character on characters;
create trigger trg_sync_member_character
after insert or update of is_active on characters
for each row execute function public.sync_member_character();
