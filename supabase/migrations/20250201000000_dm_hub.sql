-- ============================================================
-- ECHO D&D Player Assistant — DM Hub Schema
-- ============================================================

-- Add role to profiles (null = hasn't chosen yet)
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT NULL CHECK (role IN ('player', 'dm'));

-- ============================================================
-- CAMPAIGNS
-- ============================================================
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  invite_code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaigns_user ON campaigns(user_id);
CREATE INDEX idx_campaigns_invite ON campaigns(invite_code);

-- ============================================================
-- CAMPAIGN MEMBERS
-- ============================================================
CREATE TABLE campaign_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'dm')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

CREATE INDEX idx_campaign_members_campaign ON campaign_members(campaign_id);
CREATE INDEX idx_campaign_members_user ON campaign_members(user_id);

-- ============================================================
-- NPCS (Custom stat blocks — mirrors SRD monster shape)
-- ============================================================
CREATE TABLE npcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,

  -- Identity
  name TEXT NOT NULL,
  size TEXT DEFAULT 'Medium',
  type TEXT DEFAULT 'Humanoid',
  alignment TEXT DEFAULT '',

  -- Combat
  armor_class INTEGER DEFAULT 10,
  armor_desc TEXT DEFAULT '',
  hit_points INTEGER DEFAULT 10,
  hit_dice TEXT DEFAULT '',
  speed JSONB DEFAULT '{"walk":"30 ft."}',

  -- Ability Scores
  strength INTEGER DEFAULT 10,
  dexterity INTEGER DEFAULT 10,
  constitution INTEGER DEFAULT 10,
  intelligence INTEGER DEFAULT 10,
  wisdom INTEGER DEFAULT 10,
  charisma INTEGER DEFAULT 10,

  -- Proficiencies & Resistances
  saving_throws JSONB DEFAULT '[]',
  skills JSONB DEFAULT '[]',
  damage_vulnerabilities TEXT[] DEFAULT '{}',
  damage_resistances TEXT[] DEFAULT '{}',
  damage_immunities TEXT[] DEFAULT '{}',
  condition_immunities TEXT[] DEFAULT '{}',

  -- Senses & Languages
  senses TEXT DEFAULT '',
  languages TEXT DEFAULT '',
  challenge_rating NUMERIC(4,2) DEFAULT 0,
  proficiency_bonus INTEGER DEFAULT 2,

  -- Abilities & Actions (JSONB arrays)
  special_abilities JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  reactions JSONB DEFAULT '[]',
  legendary_actions JSONB DEFAULT '[]',
  legendary_desc TEXT DEFAULT '',

  -- Meta
  source TEXT DEFAULT 'custom' CHECK (source IN ('custom', 'srd-modified')),
  srd_index TEXT DEFAULT NULL,
  notes TEXT DEFAULT '',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_npcs_user ON npcs(user_id);
CREATE INDEX idx_npcs_campaign ON npcs(campaign_id);
CREATE INDEX idx_npcs_cr ON npcs(challenge_rating);

-- ============================================================
-- DM NOTES (campaign-scoped, mirrors notes table)
-- ============================================================
CREATE TABLE dm_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT NOT NULL DEFAULT '',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dm_notes_campaign ON dm_notes(campaign_id);

-- ============================================================
-- DM SESSION LOGS (campaign-scoped, mirrors session_logs table)
-- ============================================================
CREATE TABLE dm_session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  session_number INTEGER,
  title TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  date_played DATE DEFAULT CURRENT_DATE,
  notable_events TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dm_session_logs_campaign ON dm_session_logs(campaign_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_session_logs ENABLE ROW LEVEL SECURITY;

-- Campaigns: DM manages own
CREATE POLICY "DMs can manage own campaigns"
  ON campaigns FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Campaign Members: DM manages members of own campaigns
CREATE POLICY "DMs can manage campaign members"
  ON campaign_members FOR ALL
  USING (campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid()))
  WITH CHECK (campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid()));

-- Campaign Members: Players can view own memberships
CREATE POLICY "Players can view own memberships"
  ON campaign_members FOR SELECT
  USING (user_id = auth.uid());

-- Campaign Members: Players can leave campaigns
CREATE POLICY "Players can leave campaigns"
  ON campaign_members FOR DELETE
  USING (user_id = auth.uid() AND role = 'player');

-- Characters: DMs can READ campaign member characters
CREATE POLICY "DMs can view campaign member characters"
  ON characters FOR SELECT
  USING (
    id IN (
      SELECT cm.character_id
      FROM campaign_members cm
      JOIN campaigns c ON cm.campaign_id = c.id
      WHERE c.user_id = auth.uid()
      AND cm.character_id IS NOT NULL
    )
  );

-- Spells: DMs can READ campaign member spells
CREATE POLICY "DMs can view campaign member spells"
  ON spells FOR SELECT
  USING (
    character_id IN (
      SELECT cm.character_id
      FROM campaign_members cm
      JOIN campaigns c ON cm.campaign_id = c.id
      WHERE c.user_id = auth.uid()
      AND cm.character_id IS NOT NULL
    )
  );

-- Inventory: DMs can READ campaign member inventory
CREATE POLICY "DMs can view campaign member inventory"
  ON inventory_items FOR SELECT
  USING (
    character_id IN (
      SELECT cm.character_id
      FROM campaign_members cm
      JOIN campaigns c ON cm.campaign_id = c.id
      WHERE c.user_id = auth.uid()
      AND cm.character_id IS NOT NULL
    )
  );

-- Active Effects: DMs can READ campaign member effects
CREATE POLICY "DMs can view campaign member effects"
  ON active_effects FOR SELECT
  USING (
    character_id IN (
      SELECT cm.character_id
      FROM campaign_members cm
      JOIN campaigns c ON cm.campaign_id = c.id
      WHERE c.user_id = auth.uid()
      AND cm.character_id IS NOT NULL
    )
  );

-- Spell Slots: DMs can READ campaign member spell slots
CREATE POLICY "DMs can view campaign member spell slots"
  ON spell_slots FOR SELECT
  USING (
    character_id IN (
      SELECT cm.character_id
      FROM campaign_members cm
      JOIN campaigns c ON cm.campaign_id = c.id
      WHERE c.user_id = auth.uid()
      AND cm.character_id IS NOT NULL
    )
  );

-- NPCs: Users manage own
CREATE POLICY "Users can manage own NPCs"
  ON npcs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DM Notes: Users manage own
CREATE POLICY "Users can manage own DM notes"
  ON dm_notes FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DM Session Logs: Users manage own
CREATE POLICY "Users can manage own DM session logs"
  ON dm_session_logs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- RPC: Join campaign by invite code (SECURITY DEFINER)
-- ============================================================
CREATE OR REPLACE FUNCTION join_campaign_by_code(code TEXT)
RETURNS UUID AS $$
DECLARE
  cid UUID;
  char_id UUID;
BEGIN
  -- Look up campaign by invite code
  SELECT id INTO cid FROM campaigns WHERE invite_code = upper(code) AND is_active = true;
  IF cid IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  -- Check if already a member
  IF EXISTS (SELECT 1 FROM campaign_members WHERE campaign_id = cid AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Already a member of this campaign';
  END IF;

  -- Get user's active character (if any)
  SELECT id INTO char_id FROM characters WHERE user_id = auth.uid() AND is_active = true LIMIT 1;

  -- Insert membership
  INSERT INTO campaign_members (campaign_id, user_id, character_id, role)
  VALUES (cid, auth.uid(), char_id, 'player');

  RETURN cid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
