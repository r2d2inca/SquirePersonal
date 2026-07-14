-- Custom armor: ability score selection and max modifier cap for AC calculation
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS ac_ability_score TEXT DEFAULT NULL;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS max_ability_modifier INTEGER DEFAULT NULL;

-- Magic item charge/use tracking
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS charges_max INTEGER DEFAULT NULL;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS charges_remaining INTEGER DEFAULT NULL;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS recharge_type TEXT DEFAULT NULL;
