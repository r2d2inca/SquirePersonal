-- Scaffold for temporary stat effects (buffs) beyond AC.
-- ac_modifier already exists and handles AC buffs (Mage Armor, Shield of Faith, etc.).
-- This adds a general jsonb bag for future non-AC modifiers (ability scores, speed, saves).
ALTER TABLE active_effects
  ADD COLUMN IF NOT EXISTS modifiers jsonb NOT NULL DEFAULT '{}'::jsonb;
