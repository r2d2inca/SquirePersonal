import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { SessionLog, SessionLogInsert, SessionLogUpdate } from '@/lib/types/database'

export function useSessionLogs(userId: string | undefined, characterId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['session-logs', userId, characterId],
    queryFn: async (): Promise<SessionLog[]> => {
      if (!userId) return []
      let q = supabase
        .from('session_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date_played', { ascending: false })
      if (characterId) q = q.eq('character_id', characterId)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    enabled: !!userId,
  })

  const addSession = useMutation({
    mutationFn: async (session: SessionLogInsert) => {
      const { data, error } = await supabase.from('session_logs').insert(session).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['session-logs'] }),
  })

  const updateSession = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: SessionLogUpdate }) => {
      const { data, error } = await supabase.from('session_logs').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['session-logs'] }),
  })

  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('session_logs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['session-logs'] }),
  })

  return {
    sessions: query.data ?? [],
    isLoading: query.isLoading,
    addSession: addSession.mutateAsync,
    updateSession: updateSession.mutateAsync,
    deleteSession: deleteSession.mutateAsync,
  }
}
