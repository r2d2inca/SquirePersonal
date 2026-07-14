-- Add size column to encounter_combatants for proper token rendering
ALTER TABLE encounter_combatants
  ADD COLUMN IF NOT EXISTS size text NOT NULL DEFAULT 'Medium';

-- Add group_initiative_id for grouping enemies in initiative
ALTER TABLE encounter_combatants
  ADD COLUMN IF NOT EXISTS group_id text DEFAULT NULL;
