-- Flat AC bonus for magic items (Cloak/Ring of Protection, Bracers of Defense, magic helmets).
-- Distinct from armor_bonus (which SETS base armor AC); ac_bonus ADDS to AC and stacks
-- with armor or Unarmored Defense.
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS ac_bonus INTEGER DEFAULT NULL;
