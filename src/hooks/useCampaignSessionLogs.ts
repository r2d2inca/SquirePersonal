import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CampaignSessionLog, CampaignSessionLogInsert, CampaignSessionLogUpdate } from '@/lib/types/database'

export function useCampaignSessionLogs(campaignId: string | undefined | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['campaign-session-logs', campaignId],
    queryFn: async (): Promise<CampaignSessionLog[]> => {
      if (!campaignId) return []
      const { data, error } = await supabase
        .from('campaign_session_logs')
        .select('*, profiles(display_name)')
        .eq('campaign_id', campaignId)
        .order('date_played', { ascending: false })
      if (error) throw error
      return (data ?? []) as CampaignSessionLog[]
    },
    enabled: !!campaignId,
  })

  const addLog = useMutation({
    mutationFn: async (log: CampaignSessionLogInsert) => {
      const { data, error } = await supabase.from('campaign_session_logs').insert(log).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign-session-logs'] }),
  })

  const updateLog = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CampaignSessionLogUpdate }) => {
      const { data, error } = await supabase.from('campaign_session_logs').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign-session-logs'] }),
  })

  const deleteLog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('campaign_session_logs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign-session-logs'] }),
  })

  return {
    logs: query.data ?? [],
    isLoading: query.isLoading,
    addLog: addLog.mutateAsync,
    updateLog: updateLog.mutateAsync,
    deleteLog: deleteLog.mutateAsync,
  }
}
