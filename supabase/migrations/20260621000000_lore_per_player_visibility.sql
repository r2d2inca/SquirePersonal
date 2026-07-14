-- Per-player lore visibility.
-- Extends the reveal toggle (20260618000000): besides "revealed to everyone" or
-- "hidden", a DM can share an entry with specific players. Adds visible_to (an
-- array of player user-ids); a player can see an entry if it's revealed to all
-- OR their id is listed. The DM (campaign owner) still sees everything.

ALTER TABLE campaign_lore
  ADD COLUMN IF NOT EXISTS visible_to UUID[] NOT NULL DEFAULT '{}';

DROP POLICY IF EXISTS "Members can view revealed lore" ON campaign_lore;

CREATE POLICY "Members can view revealed lore"
  ON campaign_lore FOR SELECT
  USING (
    (is_revealed = true OR auth.uid() = ANY(visible_to))
    AND campaign_id IN (SELECT public.user_campaign_ids())
  );
