-- ============================================================
-- ECHO D&D Player Assistant — Initial Schema
-- ============================================================

-- PROFILES (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CHARACTERS
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Identity
  name TEXT NOT NULL,
  race TEXT NOT NULL DEFAULT '',
  class TEXT NOT NULL DEFAULT '',
  subclass TEXT DEFAULT '',
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 20),
  background TEXT DEFAULT '',
  alignment TEXT DEFAULT '',
  experience_points INTEGER DEFAULT 0,

  -- Ability Scores
  strength INTEGER NOT NULL DEFAULT 10 CHECK (strength >= 1 AND strength <= 30),
  dexterity INTEGER NOT NULL DEFAULT 10 CHECK (dexterity >= 1 AND dexterity <= 30),
  constitution INTEGER NOT NULL DEFAULT 10 CHECK (constitution >= 1 AND constitution <= 30),
  intelligence INTEGER NOT NULL DEFAULT 10 CHECK (intelligence >= 1 AND intelligence <= 30),
  wisdom INTEGER NOT NULL DEFAULT 10 CHECK (wisdom >= 1 AND wisdom <= 30),
  charisma INTEGER NOT NULL DEFAULT 10 CHECK (charisma >= 1 AND charisma <= 30),

  -- Combat Stats
  max_hp INTEGER NOT NULL DEFAULT 10,
  current_hp INTEGER NOT NULL DEFAULT 10,
  temp_hp INTEGER NOT NULL DEFAULT 0,
  armor_class INTEGER NOT NULL DEFAULT 10,
  initiative_bonus INTEGER DEFAULT 0,
  speed INTEGER DEFAULT 30,
  hit_dice_total TEXT DEFAULT '1d10',
  hit_dice_remaining INTEGER DEFAULT 1,
  death_save_successes INTEGER DEFAULT 0 CHECK (death_save_successes >= 0 AND death_save_successes <= 3),
  death_save_failures INTEGER DEFAULT 0 CHECK (death_save_failures >= 0 AND death_save_failures <= 3),

  -- Proficiencies (JSONB)
  proficiencies JSONB NOT NULL DEFAULT '{"skills":[],"savingThrows":[],"languages":[],"tools":[],"weapons":[],"armor":[]}',

  -- Features & Traits (JSONB array)
  features JSONB NOT NULL DEFAULT '[]',

  -- Currency
  copper INTEGER DEFAULT 0,
  silver INTEGER DEFAULT 0,
  electrum INTEGER DEFAULT 0,
  gold INTEGER DEFAULT 0,
  platinum INTEGER DEFAULT 0,

  -- Personality
  personality_traits TEXT DEFAULT '',
  ideals TEXT DEFAULT '',
  bonds TEXT DEFAULT '',
  flaws TEXT DEFAULT '',

  -- Appearance & Backstory
  appearance TEXT DEFAULT '',
  backstory TEXT DEFAULT '',

  -- Spellcasting
  spellcasting_ability TEXT DEFAULT NULL,
  spell_save_dc INTEGER DEFAULT NULL,
  spell_attack_bonus INTEGER DEFAULT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One active character per user
CREATE UNIQUE INDEX idx_one_active_character
  ON characters (user_id)
  WHERE is_active = true;

-- SPELL SLOTS
CREATE TABLE spell_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  slot_level INTEGER NOT NULL CHECK (slot_level >= 1 AND slot_level <= 9),
  total INTEGER NOT NULL DEFAULT 0,
  expended INTEGER NOT NULL DEFAULT 0,
  UNIQUE(character_id, slot_level)
);

-- SPELLS
CREATE TABLE spells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 0,
  school TEXT DEFAULT '',
  casting_time TEXT DEFAULT '1 action',
  range TEXT DEFAULT '',
  components TEXT DEFAULT '',
  duration TEXT DEFAULT '',
  is_concentration BOOLEAN NOT NULL DEFAULT false,
  is_ritual BOOLEAN NOT NULL DEFAULT false,
  is_prepared BOOLEAN NOT NULL DEFAULT false,
  description TEXT NOT NULL DEFAULT '',
  higher_levels TEXT DEFAULT '',
  source TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INVENTORY ITEMS
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'gear',
  quantity INTEGER NOT NULL DEFAULT 1,
  weight NUMERIC(8,2) DEFAULT 0,
  description TEXT DEFAULT '',
  is_equipped BOOLEAN NOT NULL DEFAULT false,
  is_attuned BOOLEAN NOT NULL DEFAULT false,
  damage TEXT DEFAULT NULL,
  weapon_properties TEXT DEFAULT NULL,
  armor_bonus INTEGER DEFAULT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ACTIVE EFFECTS (conditions, buffs, debuffs)
CREATE TABLE active_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  effect_type TEXT DEFAULT 'condition',
  description TEXT DEFAULT '',
  is_concentration BOOLEAN NOT NULL DEFAULT false,
  duration TEXT DEFAULT '',
  source TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SESSION LOGS
CREATE TABLE session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  session_number INTEGER,
  title TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  date_played DATE DEFAULT CURRENT_DATE,
  notable_events TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- LORE ENTRIES
CREATE TABLE lore_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'npc',
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  related_entries UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NOTES
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT NOT NULL DEFAULT '',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI CONVERSATIONS
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE spell_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE spells ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lore_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can manage own profile"
  ON profiles FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Characters
CREATE POLICY "Users can manage own characters"
  ON characters FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Spell Slots (through character ownership)
CREATE POLICY "Users can manage own spell slots"
  ON spell_slots FOR ALL
  USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()))
  WITH CHECK (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

-- Spells
CREATE POLICY "Users can manage own spells"
  ON spells FOR ALL
  USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()))
  WITH CHECK (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

-- Inventory Items
CREATE POLICY "Users can manage own inventory"
  ON inventory_items FOR ALL
  USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()))
  WITH CHECK (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

-- Active Effects
CREATE POLICY "Users can manage own effects"
  ON active_effects FOR ALL
  USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()))
  WITH CHECK (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

-- Session Logs
CREATE POLICY "Users can manage own session logs"
  ON session_logs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Lore Entries
CREATE POLICY "Users can manage own lore"
  ON lore_entries FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Notes
CREATE POLICY "Users can manage own notes"
  ON notes FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- AI Conversations
CREATE POLICY "Users can manage own conversations"
  ON ai_conversations FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
