import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Campaign, CampaignMember } from '@/lib/types/database'

export function usePlayerCampaign(userId: string | undefined) {
  const query = useQuery({
    queryKey: ['player-campaign', userId],
    staleTime: 0, // Always re-fetch to catch deleted campaigns
    queryFn: async (): Promise<{ campaign: Campaign; membership: CampaignMember } | null> => {
      if (!userId) return null

      const { data: memberships, error: memberError } = await supabase
        .from('campaign_members')
        .select('*')
        .eq('user_id', userId)
      if (memberError) throw memberError
      if (!memberships || memberships.length === 0) return null

      // Check each membership to find a valid (non-deleted) campaign
      for (const membership of memberships as CampaignMember[]) {
        const { data: campaign, error: campaignError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', membership.campaign_id)
          .maybeSingle()

        if (campaignError) continue

        if (!campaign) {
          // Campaign was deleted — clean up orphaned membership
          await supabase.from('campaign_members').delete().eq('id', membership.id)
          continue
        }

        return { campaign: campaign as Campaign, membership }
      }

      return null
    },
    enabled: !!userId,
  })

  return {
    campaign: query.data?.campaign ?? null,
    membership: query.data?.membership ?? null,
    isLoading: query.isLoading,
  }
}
