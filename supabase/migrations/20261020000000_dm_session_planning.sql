-- ============================================================
-- DM session planning: saved encounters + session plans
-- ============================================================
-- Both tables are DM-private (owner-only RLS). Players never see prep.

-- ─── Encounter Templates ───
-- A reusable, pre-built encounter. Launching one copies its monsters into a
-- live campaign_encounters row; the template itself is never mutated by play.
create table if not exists encounter_templates (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Untitled Encounter',
  description text not null default '',
  -- [{ id, source: 'srd'|'npc'|'custom', ref, name, cr, hp, ac, dex_mod, size, quantity, token_color, group_initiative }]
  monsters jsonb not null default '[]',
  tactics text not null default '',
  loot text not null default '',
  map_image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_encounter_templates_campaign on encounter_templates(campaign_id);

alter table encounter_templates enable row level security;

create policy "DMs manage own encounter templates"
  on encounter_templates for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create trigger set_encounter_templates_updated_at
  before update on encounter_templates
  for each row execute function update_updated_at_column();

-- ─── Session Plans ───
-- Prep for an upcoming session: an ordered list of "beats" the DM walks
-- through at the table. Beats are JSONB because they are only ever read and
-- written as a whole by their owner.
create table if not exists dm_session_plans (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled Session',
  session_number integer,
  status text not null default 'planning' check (status in ('planning', 'ready', 'running', 'done')),
  planned_date date,
  scheduled_session_id uuid references campaign_scheduled_sessions(id) on delete set null,
  overview text not null default '',
  -- [{ id, type: 'scene'|'read_aloud'|'encounter'|'npc'|'loot'|'note', title, body, encounter_template_id, npc_id, done }]
  beats jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dm_session_plans_campaign on dm_session_plans(campaign_id);

alter table dm_session_plans enable row level security;

create policy "DMs manage own session plans"
  on dm_session_plans for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create trigger set_dm_session_plans_updated_at
  before update on dm_session_plans
  for each row execute function update_updated_at_column();

-- ─── Live encounters remember where they came from ───
alter table campaign_encounters add column if not exists name text not null default '';
alter table campaign_encounters add column if not exists template_id uuid references encounter_templates(id) on delete set null;
