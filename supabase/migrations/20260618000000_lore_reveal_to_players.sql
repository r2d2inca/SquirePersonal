-- Reveal-to-players toggle for campaign lore.
-- DMs can mark a lore entry as hidden (draft) or revealed (shared). Hidden
-- entries must be invisible to players at the DB level, not just in the UI.
--
-- is_revealed defaults to true so all existing lore stays visible (no surprise
-- disappearances). The DM (campaign owner) always sees every entry; players see
-- only revealed ones.

ALTER TABLE campaign_lore
  ADD COLUMN IF NOT EXISTS is_revealed BOOLEAN NOT NULL DEFAULT true;

-- Replace the single members-see-all SELECT policy with two: DM sees all,
-- everyone else sees only revealed entries.
DROP POLICY IF EXISTS "Campaign members can view lore" ON campaign_lore;

CREATE POLICY "DM can view all lore"
  ON campaign_lore FOR SELECT
  USING (
    campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can view revealed lore"
  ON campaign_lore FOR SELECT
  USING (
    is_revealed = true
    AND campaign_id IN (SELECT public.user_campaign_ids())
  );

-- INSERT/UPDATE/DELETE policies are unchanged: campaign members manage lore,
-- and the reveal toggle is surfaced only to the DM in the UI.
