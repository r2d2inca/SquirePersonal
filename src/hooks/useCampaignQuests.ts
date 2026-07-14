import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CampaignQuest, CampaignQuestInsert, CampaignQuestUpdate } from '@/lib/types/database'

export function useCampaignQuests(campaignId: string | undefined | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['campaign-quests', campaignId],
    queryFn: async (): Promise<CampaignQuest[]> => {
      if (!campaignId) return []
      const { data, error } = await supabase
        .from('campaign_quests')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('sort_order', { ascending: true })
        .order('updated_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as CampaignQuest[]
    },
    enabled: !!campaignId,
  })

  const addQuest = useMutation({
    mutationFn: async (quest: CampaignQuestInsert) => {
      const { data, error } = await supabase.from('campaign_quests').insert(quest).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign-quests'] }),
  })

  const updateQuest = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CampaignQuestUpdate }) => {
      const { data, error } = await supabase.from('campaign_quests').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign-quests'] }),
  })

  const deleteQuest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('campaign_quests').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign-quests'] }),
  })

  return {
    quests: query.data ?? [],
    isLoading: query.isLoading,
    addQuest: addQuest.mutateAsync,
    updateQuest: updateQuest.mutateAsync,
    deleteQuest: deleteQuest.mutateAsync,
  }
}
