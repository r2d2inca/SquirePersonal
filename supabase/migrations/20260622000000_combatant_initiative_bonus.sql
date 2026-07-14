-- Add an initiative_bonus to encounter combatants so the in-combat initiative roll
-- can add the creature's modifier (a d20 + bonus), matching the character sheet's
-- Initiative display. Player combatants snapshot DEX mod + character initiative_bonus
-- at setup; monsters/NPCs snapshot their DEX modifier. Defaults to 0.
ALTER TABLE encounter_combatants
  ADD COLUMN IF NOT EXISTS initiative_bonus integer NOT NULL DEFAULT 0;
