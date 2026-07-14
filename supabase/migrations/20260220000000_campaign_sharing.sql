-- ============================================================
-- ECHO D&D Player Assistant — Campaign Sharing
-- Adds shared session logs, lore, and messaging for campaigns
-- ============================================================

-- ============================================================
-- HELPER FUNCTION (must come first — policies depend on it)
-- Bypasses campaign_members RLS to avoid circular dependency
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_campaign_ids()
RETURNS SETOF UUID AS $$
  SELECT campaign_id FROM campaign_members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- CAMPAIGN SESSION LOGS (shared recaps)
-- ============================================================
CREATE TABLE campaign_session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  session_number INTEGER,
  date_played DATE DEFAULT CURRENT_DATE,
  notable_events TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_session_logs_campaign ON campaign_session_logs(campaign_id);

-- ============================================================
-- CAMPAIGN LORE (shared world-building)
-- ============================================================
CREATE TABLE campaign_lore (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'other',
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_lore_campaign ON campaign_lore(campaign_id);

-- ============================================================
-- CAMPAIGN MESSAGES (group chat + DMs)
-- ============================================================
CREATE TABLE campaign_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_messages_campaign ON campaign_messages(campaign_id);
CREATE INDEX idx_campaign_messages_sender ON campaign_messages(sender_id);
CREATE INDEX idx_campaign_messages_dm ON campaign_messages(campaign_id, sender_id, recipient_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE campaign_session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_lore ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CAMPAIGN MEMBERS: let members see fellow members
-- ============================================================
CREATE POLICY "Campaign members can view fellow members"
  ON campaign_members FOR SELECT
  USING (
    campaign_id IN (SELECT public.user_campaign_ids())
  );

-- ============================================================
-- SESSION LOGS POLICIES (all use user_campaign_ids())
-- ============================================================
CREATE POLICY "Campaign members can view session logs"
  ON campaign_session_logs FOR SELECT
  USING (
    campaign_id IN (SELECT public.user_campaign_ids())
  );

CREATE POLICY "Campaign members can create session logs"
  ON campaign_session_logs FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND campaign_id IN (SELECT public.user_campaign_ids())
  );

CREATE POLICY "Campaign members can update session logs"
  ON campaign_session_logs FOR UPDATE
  USING (
    campaign_id IN (SELECT public.user_campaign_ids())
  );

CREATE POLICY "Campaign members can delete session logs"
  ON campaign_session_logs FOR DELETE
  USING (
    campaign_id IN (SELECT public.user_campaign_ids())
  );

-- ============================================================
-- LORE POLICIES (all use user_campaign_ids())
-- ============================================================
CREATE POLICY "Campaign members can view lore"
  ON campaign_lore FOR SELECT
  USING (
    campaign_id IN (SELECT public.user_campaign_ids())
  );

CREATE POLICY "Campaign members can create lore"
  ON campaign_lore FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND campaign_id IN (SELECT public.user_campaign_ids())
  );

CREATE POLICY "Campaign members can update lore"
  ON campaign_lore FOR UPDATE
  USING (
    campaign_id IN (SELECT public.user_campaign_ids())
  );

CREATE POLICY "Campaign members can delete lore"
  ON campaign_lore FOR DELETE
  USING (
    campaign_id IN (SELECT public.user_campaign_ids())
  );

-- ============================================================
-- MESSAGE POLICIES (all use user_campaign_ids())
-- ============================================================
CREATE POLICY "Campaign members can view messages"
  ON campaign_messages FOR SELECT
  USING (
    campaign_id IN (SELECT public.user_campaign_ids())
    AND (
      recipient_id IS NULL
      OR sender_id = auth.uid()
      OR recipient_id = auth.uid()
    )
  );

CREATE POLICY "Campaign members can send messages"
  ON campaign_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND campaign_id IN (SELECT public.user_campaign_ids())
  );

CREATE POLICY "Senders can delete own messages"
  ON campaign_messages FOR DELETE
  USING (sender_id = auth.uid());

-- ============================================================
-- CAMPAIGNS: players can read campaigns they belong to
-- ============================================================
CREATE POLICY "Players can view joined campaigns"
  ON campaigns FOR SELECT
  USING (id IN (SELECT public.user_campaign_ids()));

-- ============================================================
-- CROSS-TABLE: let campaign members see fellow members' profiles & characters
-- ============================================================
CREATE POLICY "Campaign members can view fellow member profiles"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT cm.user_id
      FROM campaign_members cm
      WHERE cm.campaign_id IN (SELECT public.user_campaign_ids())
    )
  );

CREATE POLICY "Campaign members can view fellow member characters"
  ON characters FOR SELECT
  USING (
    id IN (
      SELECT cm.character_id
      FROM campaign_members cm
      WHERE cm.campaign_id IN (SELECT public.user_campaign_ids())
      AND cm.character_id IS NOT NULL
    )
  );
