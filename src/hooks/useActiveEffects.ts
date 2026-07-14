import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ActiveEffect, ActiveEffectInsert } from '@/lib/types/database'

export function useActiveEffects(characterId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['active-effects', characterId],
    queryFn: async (): Promise<ActiveEffect[]> => {
      if (!characterId) return []
      const { data, error } = await supabase
        .from('active_effects')
        .select('*')
        .eq('character_id', characterId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!characterId,
  })

  const addEffect = useMutation({
    mutationFn: async (effect: ActiveEffectInsert) => {
      const { data, error } = await supabase.from('active_effects').insert(effect).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['active-effects', characterId] }),
  })

  const removeEffect = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('active_effects').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['active-effects', characterId] }),
  })

  const clearAll = useMutation({
    mutationFn: async () => {
      if (!characterId) return
      const { error } = await supabase.from('active_effects').delete().eq('character_id', characterId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['active-effects', characterId] }),
  })

  return {
    effects: query.data ?? [],
    isLoading: query.isLoading,
    addEffect: addEffect.mutateAsync,
    removeEffect: removeEffect.mutateAsync,
    clearAll: clearAll.mutateAsync,
  }
}
