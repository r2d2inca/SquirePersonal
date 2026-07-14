import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CampaignMember } from '@/lib/types/database'

export function useCampaignMembers(campaignId: string | undefined | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['campaign-members', campaignId],
    queryFn: async (): Promise<CampaignMember[]> => {
      if (!campaignId) return []
      const { data, error } = await supabase
        .from('campaign_members')
        .select('*, profiles(display_name), characters(name, race, class, level, current_hp, max_hp, armor_class, portrait_url, is_active)')
        .eq('campaign_id', campaignId)
        .order('joined_at', { ascending: true })
      if (error) throw error
      // Filter out members whose characters have been deleted (is_active = false)
      const members = (data ?? []) as (CampaignMember & { characters?: { is_active?: boolean } | null })[]
      return members.filter(m => !m.characters || m.characters.is_active !== false) as CampaignMember[]
    },
    enabled: !!campaignId,
  })

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('campaign_members')
        .delete()
        .eq('id', memberId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign-members', campaignId] }),
  })

  return {
    members: query.data ?? [],
    isLoading: query.isLoading,
    removeMember: removeMember.mutateAsync,
  }
}
