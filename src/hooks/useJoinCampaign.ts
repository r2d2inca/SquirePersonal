import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useJoinCampaign() {
  const queryClient = useQueryClient()

  const joinCampaign = useMutation({
    mutationFn: async (inviteCode: string): Promise<string> => {
      const { data, error } = await supabase.rpc('join_campaign_by_code', {
        code: inviteCode.trim().toUpperCase(),
      })
      if (error) throw new Error(error.message)
      return data as string
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-members'] })
      queryClient.invalidateQueries({ queryKey: ['player-campaign'] })
    },
  })

  return {
    joinCampaign: joinCampaign.mutateAsync,
    isJoining: joinCampaign.isPending,
  }
}
