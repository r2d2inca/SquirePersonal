import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Award XP to a campaign member's character via the award_xp RPC, which
 * enforces (DB-side) that the caller is the campaign DM and only updates
 * experience_points.
 */
export function useXpAward(campaignId: string | undefined | null) {
  const queryClient = useQueryClient()

  const award = useMutation({
    mutationFn: async ({ characterId, amount }: { characterId: string; amount: number }) => {
      const { data, error } = await supabase.rpc('award_xp', {
        p_character_id: characterId,
        p_amount: amount,
      })
      if (error) throw error
      return data as number
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['party-characters', campaignId] })
    },
  })

  return { awardXp: award.mutateAsync, isAwarding: award.isPending }
}
