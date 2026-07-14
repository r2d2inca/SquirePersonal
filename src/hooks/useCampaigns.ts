import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Campaign, CampaignInsert, CampaignUpdate } from '@/lib/types/database'

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function useCampaigns(userId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['campaigns', userId],
    queryFn: async (): Promise<Campaign[]> => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!userId,
  })

  const addCampaign = useMutation({
    mutationFn: async (campaign: Omit<CampaignInsert, 'invite_code'>) => {
      // Generate invite code with retry on collision
      let attempts = 0
      while (attempts < 5) {
        const code = generateInviteCode()
        const { data, error } = await supabase
          .from('campaigns')
          .insert({ ...campaign, invite_code: code })
          .select()
          .single()

        if (error?.code === '23505') {
          // Unique constraint violation — retry with new code
          attempts++
          continue
        }
        if (error) throw error

        // Also insert the DM as a campaign member
        const { error: memberError } = await supabase.from('campaign_members').insert({
          campaign_id: data.id,
          user_id: campaign.user_id,
          character_id: null,
          role: 'dm',
        })
        if (memberError) {
          console.error('Failed to add DM as campaign member:', memberError)
        }

        return data
      }
      throw new Error('Failed to generate unique invite code')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  })

  const updateCampaign = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CampaignUpdate }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  })

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      // Remove all members first so players don't have orphaned memberships
      const { error: memberError } = await supabase.from('campaign_members').delete().eq('campaign_id', id)
      if (memberError) throw memberError
      const { error } = await supabase.from('campaigns').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  })

  return {
    campaigns: query.data ?? [],
    isLoading: query.isLoading,
    addCampaign: addCampaign.mutateAsync,
    updateCampaign: updateCampaign.mutateAsync,
    deleteCampaign: deleteCampaign.mutateAsync,
  }
}
