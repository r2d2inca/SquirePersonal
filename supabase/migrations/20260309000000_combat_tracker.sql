-- ─── Campaign Encounters ───

create table if not exists campaign_encounters (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  dm_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'setup' check (status in ('setup', 'initiative', 'active', 'completed')),
  current_turn_combatant_id uuid,
  round int not null default 1,
  grid_width int not null default 20,
  grid_height int not null default 15,
  map_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_encounters_campaign on campaign_encounters(campaign_id);

-- ─── Encounter Combatants ───

create table if not exists encounter_combatants (
  id uuid primary key default gen_random_uuid(),
  encounter_id uuid not null references campaign_encounters(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  initiative int,
  max_hp int not null default 10,
  current_hp int not null default 10,
  temp_hp int not null default 0,
  armor_class int not null default 10,
  is_player boolean not null default false,
  conditions jsonb not null default '[]',
  grid_x int,
  grid_y int,
  token_color text not null default '#c9981e',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_combatants_encounter on encounter_combatants(encounter_id);

-- Add FK for current_turn_combatant_id after combatants table exists
alter table campaign_encounters
  add constraint fk_current_turn_combatant
  foreign key (current_turn_combatant_id) references encounter_combatants(id)
  on delete set null;

-- ─── RLS ───

alter table campaign_encounters enable row level security;
alter table encounter_combatants enable row level security;

-- Encounters: campaign members can view
create policy "Campaign members can view encounters"
  on campaign_encounters for select
  using (campaign_id in (select public.user_campaign_ids()));

-- Encounters: DM (campaign owner) can insert
create policy "DM can create encounters"
  on campaign_encounters for insert
  with check (
    dm_user_id = auth.uid()
    and campaign_id in (select id from campaigns where user_id = auth.uid())
  );

-- Encounters: DM can update (turn advancement, status)
create policy "DM can update encounters"
  on campaign_encounters for update
  using (dm_user_id = auth.uid());

-- Encounters: DM can delete
create policy "DM can delete encounters"
  on campaign_encounters for delete
  using (dm_user_id = auth.uid());

-- Combatants: campaign members can view all combatants
create policy "Campaign members can view combatants"
  on encounter_combatants for select
  using (
    encounter_id in (
      select id from campaign_encounters
      where campaign_id in (select public.user_campaign_ids())
    )
  );

-- Combatants: DM can insert
create policy "DM can add combatants"
  on encounter_combatants for insert
  with check (
    encounter_id in (
      select id from campaign_encounters where dm_user_id = auth.uid()
    )
  );

-- Combatants: DM can update any, players can update own (initiative, position) or any (HP for damage)
create policy "DM and players can update combatants"
  on encounter_combatants for update
  using (
    encounter_id in (
      select id from campaign_encounters
      where campaign_id in (select public.user_campaign_ids())
    )
  );

-- Combatants: DM can delete
create policy "DM can remove combatants"
  on encounter_combatants for delete
  using (
    encounter_id in (
      select id from campaign_encounters where dm_user_id = auth.uid()
    )
  );

-- ─── Updated_at Triggers ───

create trigger set_encounters_updated_at
  before update on campaign_encounters
  for each row execute function update_updated_at_column();

create trigger set_combatants_updated_at
  before update on encounter_combatants
  for each row execute function update_updated_at_column();

-- ─── Storage Bucket for Battle Maps ───
-- Note: Run this in Supabase dashboard SQL editor if needed:
-- insert into storage.buckets (id, name, public) values ('battle-maps', 'battle-maps', true);
