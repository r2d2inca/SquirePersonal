import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Character } from '@/lib/types/database'

export function usePartyCharacters(campaignId: string | undefined | null) {
  const query = useQuery({
    queryKey: ['party-characters', campaignId],
    queryFn: async (): Promise<Character[]> => {
      if (!campaignId) return []

      // Get character IDs from player members (exclude the DM's own membership)
      const { data: members, error: membersError } = await supabase
        .from('campaign_members')
        .select('character_id')
        .eq('campaign_id', campaignId)
        .eq('role', 'player')
        .not('character_id', 'is', null)

      if (membersError) throw membersError
      if (!members || members.length === 0) return []

      const characterIds = members
        .map((m) => m.character_id)
        .filter((id): id is string => id !== null)

      if (characterIds.length === 0) return []

      // Fetch full character data (DM has SELECT access via RLS)
      const { data: characters, error: charError } = await supabase
        .from('characters')
        .select('*')
        .in('id', characterIds)

      if (charError) throw charError
      return characters ?? []
    },
    enabled: !!campaignId,
    refetchInterval: 30000, // Poll every 30s for live party updates
  })

  return {
    characters: query.data ?? [],
    isLoading: query.isLoading,
  }
}
