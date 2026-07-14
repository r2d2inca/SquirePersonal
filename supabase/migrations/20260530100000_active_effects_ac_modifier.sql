-- Add ac_modifier to active_effects for spell/effect AC bonuses
ALTER TABLE active_effects
  ADD COLUMN IF NOT EXISTS ac_modifier integer NOT NULL DEFAULT 0;
