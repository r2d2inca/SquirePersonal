-- Campaign quests table
create table if not exists campaign_quests (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'active' check (status in ('active', 'completed', 'failed')),
  objectives jsonb not null default '[]',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table campaign_quests enable row level security;

-- Members of the campaign can read quests
create policy "Campaign members can view quests"
  on campaign_quests for select
  using (
    campaign_id in (
      select campaign_id from campaign_members where user_id = auth.uid()
    )
    or campaign_id in (
      select id from campaigns where user_id = auth.uid()
    )
  );

-- Campaign owner or quest author can insert
create policy "Campaign members can create quests"
  on campaign_quests for insert
  with check (
    auth.uid() = user_id
    and (
      campaign_id in (
        select campaign_id from campaign_members where user_id = auth.uid()
      )
      or campaign_id in (
        select id from campaigns where user_id = auth.uid()
      )
    )
  );

-- Campaign owner or quest author can update
create policy "Quest author or DM can update quests"
  on campaign_quests for update
  using (
    auth.uid() = user_id
    or campaign_id in (
      select id from campaigns where user_id = auth.uid()
    )
  );

-- Campaign owner or quest author can delete
create policy "Quest author or DM can delete quests"
  on campaign_quests for delete
  using (
    auth.uid() = user_id
    or campaign_id in (
      select id from campaigns where user_id = auth.uid()
    )
  );

-- Updated_at trigger
create trigger set_updated_at
  before update on campaign_quests
  for each row execute function update_updated_at_column();
