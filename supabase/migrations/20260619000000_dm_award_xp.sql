-- DM XP award via a narrow SECURITY DEFINER function.
-- DMs cannot write to player character rows (RLS restricts characters to their
-- owner). Rather than open a broad UPDATE policy, this function runs as the
-- definer but enforces that the caller is the DM (campaign owner) of a campaign
-- the target character belongs to, and only ever touches experience_points.

create or replace function public.award_xp(p_character_id uuid, p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_xp integer;
begin
  if p_amount is null or p_amount = 0 then
    raise exception 'XP amount must be non-zero';
  end if;

  -- Caller must be the DM (owner) of a campaign this character is a member of.
  if not exists (
    select 1
    from campaign_members cm
    join campaigns c on c.id = cm.campaign_id
    where cm.character_id = p_character_id
      and c.user_id = auth.uid()
  ) then
    raise exception 'Not authorized to award XP to this character';
  end if;

  update characters
  set experience_points = greatest(0, experience_points + p_amount),
      updated_at = now()
  where id = p_character_id
  returning experience_points into v_new_xp;

  if v_new_xp is null then
    raise exception 'Character not found';
  end if;

  return v_new_xp;
end;
$$;

grant execute on function public.award_xp(uuid, integer) to authenticated;
