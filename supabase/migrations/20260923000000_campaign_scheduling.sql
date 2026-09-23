-- Campaign scheduling: players submit availability for the coming weeks,
-- the DM reads the overlap and locks in a session.
--
-- Everything is stored as absolute instants (timestamptz). A player in New York
-- painting "7 PM Tuesday" writes 23:00Z; a DM in London reads that same instant
-- back as midnight. No wall-clock strings cross a timezone boundary — the only
-- role time_zone plays is telling other people which clock the submitter used.

-- ============================================================
-- SCHEDULING WINDOW SETTINGS (on the campaign)
-- ============================================================
-- How far ahead players are asked to fill in, and which slice of the day the
-- grid shows. End hour may exceed 24 to express a window that runs past
-- midnight: 16 -> 25 is "4 PM until 1 AM". Hours are in the DM's timezone.
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS schedule_weeks_ahead INTEGER NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS schedule_day_start_hour INTEGER NOT NULL DEFAULT 16,
  ADD COLUMN IF NOT EXISTS schedule_day_end_hour INTEGER NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS schedule_time_zone TEXT;

DO $$ BEGIN
  ALTER TABLE campaigns ADD CONSTRAINT campaigns_schedule_weeks_ahead_check
    CHECK (schedule_weeks_ahead BETWEEN 1 AND 12);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE campaigns ADD CONSTRAINT campaigns_schedule_hours_check
    CHECK (
      schedule_day_start_hour BETWEEN 0 AND 23
      AND schedule_day_end_hour > schedule_day_start_hour
      AND schedule_day_end_hour <= schedule_day_start_hour + 24
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- AVAILABILITY
-- ============================================================
-- One row per contiguous block a player marked. The UI paints an hourly grid
-- and coalesces runs before saving, so a free evening is one row, not five.
CREATE TABLE IF NOT EXISTS campaign_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'maybe')),
  -- IANA zone the player painted in, e.g. 'America/New_York'. Display only:
  -- it lets the DM say "Alex marked 7-10 PM their time" without re-deriving it.
  time_zone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT campaign_availability_range_check CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS campaign_availability_campaign_starts_idx
  ON campaign_availability (campaign_id, starts_at);
CREATE INDEX IF NOT EXISTS campaign_availability_user_idx
  ON campaign_availability (campaign_id, user_id);

ALTER TABLE campaign_availability ENABLE ROW LEVEL SECURITY;

-- Everyone in the campaign sees everyone's availability — that's the point of
-- the feature. Writes are restricted to your own rows.
DROP POLICY IF EXISTS "Campaign members can view availability" ON campaign_availability;
CREATE POLICY "Campaign members can view availability"
  ON campaign_availability FOR SELECT
  USING (
    campaign_id IN (SELECT public.user_campaign_ids())
    OR campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Players can submit their own availability" ON campaign_availability;
CREATE POLICY "Players can submit their own availability"
  ON campaign_availability FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      campaign_id IN (SELECT public.user_campaign_ids())
      OR campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Players can update their own availability" ON campaign_availability;
CREATE POLICY "Players can update their own availability"
  ON campaign_availability FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Players can clear their own availability" ON campaign_availability;
CREATE POLICY "Players can clear their own availability"
  ON campaign_availability FOR DELETE
  USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS set_updated_at ON campaign_availability;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON campaign_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SCHEDULED SESSIONS
-- ============================================================
-- What the DM locks in once the overlap is clear. Kept separate from
-- campaign_session_logs, which is the after-the-fact recap of a session played.
CREATE TABLE IF NOT EXISTS campaign_scheduled_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT campaign_scheduled_sessions_range_check CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS campaign_scheduled_sessions_campaign_starts_idx
  ON campaign_scheduled_sessions (campaign_id, starts_at);

ALTER TABLE campaign_scheduled_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Campaign members can view scheduled sessions" ON campaign_scheduled_sessions;
CREATE POLICY "Campaign members can view scheduled sessions"
  ON campaign_scheduled_sessions FOR SELECT
  USING (
    campaign_id IN (SELECT public.user_campaign_ids())
    OR campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
  );

-- Only the campaign owner schedules. Players read.
DROP POLICY IF EXISTS "DM can schedule sessions" ON campaign_scheduled_sessions;
CREATE POLICY "DM can schedule sessions"
  ON campaign_scheduled_sessions FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "DM can update scheduled sessions" ON campaign_scheduled_sessions;
CREATE POLICY "DM can update scheduled sessions"
  ON campaign_scheduled_sessions FOR UPDATE
  USING (campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "DM can delete scheduled sessions" ON campaign_scheduled_sessions;
CREATE POLICY "DM can delete scheduled sessions"
  ON campaign_scheduled_sessions FOR DELETE
  USING (campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid()));

DROP TRIGGER IF EXISTS set_updated_at ON campaign_scheduled_sessions;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON campaign_scheduled_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
