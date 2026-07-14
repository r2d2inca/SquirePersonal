import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CampaignEncounter, EncounterCombatant } from '@/lib/types/database'

/**
 * Fetches the active (non-completed) encounter for a campaign
 * with realtime subscription for live updates.
 */
export function useEncounter(campaignId: string | undefined | null) {
  const queryClient = useQueryClient()

  const encounterQuery = useQuery({
    queryKey: ['encounter', campaignId],
    queryFn: async (): Promise<CampaignEncounter | null> => {
      if (!campaignId) return null
      const { data, error } = await supabase
        .from('campaign_encounters')
        .select('*')
        .eq('campaign_id', campaignId)
        .neq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as CampaignEncounter | null
    },
    enabled: !!campaignId,
  })

  const encounterId = encounterQuery.data?.id

  const combatantsQuery = useQuery({
    queryKey: ['encounter-combatants', encounterId],
    queryFn: async (): Promise<EncounterCombatant[]> => {
      if (!encounterId) return []
      const { data, error } = await supabase
        .from('encounter_combatants')
        .select('*')
        .eq('encounter_id', encounterId)
        .order('initiative', { ascending: false, nullsFirst: false })
      if (error) throw error
      return (data ?? []) as EncounterCombatant[]
    },
    enabled: !!encounterId,
  })

  // Realtime: encounter changes
  useEffect(() => {
    if (!campaignId) return

    const channel = supabase
      .channel(`encounter:${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_encounters',
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['encounter', campaignId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [campaignId, queryClient])

  // Realtime: combatant changes
  useEffect(() => {
    if (!encounterId) return

    const channel = supabase
      .channel(`combatants:${encounterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'encounter_combatants',
          filter: `encounter_id=eq.${encounterId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['encounter-combatants', encounterId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [encounterId, queryClient])

  return {
    encounter: encounterQuery.data ?? null,
    combatants: combatantsQuery.data ?? [],
    isLoading: encounterQuery.isLoading || combatantsQuery.isLoading,
  }
}
