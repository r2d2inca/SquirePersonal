import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CampaignLoreEntry, CampaignLoreEntryInsert, CampaignLoreEntryUpdate } from '@/lib/types/database'

export function useCampaignLore(campaignId: string | undefined | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['campaign-lore', campaignId],
    queryFn: async (): Promise<CampaignLoreEntry[]> => {
      if (!campaignId) return []
      const { data, error } = await supabase
        .from('campaign_lore')
        .select('*, profiles(display_name)')
        .eq('campaign_id', campaignId)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as CampaignLoreEntry[]
    },
    enabled: !!campaignId,
  })

  const addEntry = useMutation({
    mutationFn: async (entry: CampaignLoreEntryInsert) => {
      const { data, error } = await supabase.from('campaign_lore').insert(entry).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign-lore'] }),
  })

  const updateEntry = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CampaignLoreEntryUpdate }) => {
      const { data, error } = await supabase.from('campaign_lore').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign-lore'] }),
  })

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('campaign_lore').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign-lore'] }),
  })

  return {
    entries: query.data ?? [],
    isLoading: query.isLoading,
    addEntry: addEntry.mutateAsync,
    updateEntry: updateEntry.mutateAsync,
    deleteEntry: deleteEntry.mutateAsync,
  }
}
