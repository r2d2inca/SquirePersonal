import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DmSessionLog, DmSessionLogInsert, DmSessionLogUpdate } from '@/lib/types/database'

export function useDmSessionLogs(userId: string | undefined, campaignId: string | undefined | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['dm-session-logs', userId, campaignId],
    queryFn: async (): Promise<DmSessionLog[]> => {
      if (!userId || !campaignId) return []
      const { data, error } = await supabase
        .from('dm_session_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('campaign_id', campaignId)
        .order('session_number', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!userId && !!campaignId,
  })

  const addSession = useMutation({
    mutationFn: async (session: DmSessionLogInsert) => {
      const { data, error } = await supabase.from('dm_session_logs').insert(session).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dm-session-logs'] }),
  })

  const updateSession = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: DmSessionLogUpdate }) => {
      const { data, error } = await supabase.from('dm_session_logs').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dm-session-logs'] }),
  })

  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dm_session_logs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dm-session-logs'] }),
  })

  return {
    sessions: query.data ?? [],
    isLoading: query.isLoading,
    addSession: addSession.mutateAsync,
    updateSession: updateSession.mutateAsync,
    deleteSession: deleteSession.mutateAsync,
  }
}
