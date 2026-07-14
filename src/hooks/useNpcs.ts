import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Npc, NpcInsert, NpcUpdate } from '@/lib/types/database'

export function useNpcs(userId: string | undefined, campaignId: string | undefined | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['npcs', userId, campaignId],
    queryFn: async (): Promise<Npc[]> => {
      if (!userId) return []
      let q = supabase
        .from('npcs')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true })
      if (campaignId) {
        q = q.or(`campaign_id.eq.${campaignId},campaign_id.is.null`)
      }
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    enabled: !!userId,
  })

  const addNpc = useMutation({
    mutationFn: async (npc: NpcInsert) => {
      const { data, error } = await supabase.from('npcs').insert(npc).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['npcs'] }),
  })

  const updateNpc = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: NpcUpdate }) => {
      const { data, error } = await supabase.from('npcs').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['npcs'] }),
  })

  const deleteNpc = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('npcs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['npcs'] }),
  })

  return {
    npcs: query.data ?? [],
    isLoading: query.isLoading,
    addNpc: addNpc.mutateAsync,
    updateNpc: updateNpc.mutateAsync,
    deleteNpc: deleteNpc.mutateAsync,
  }
}
