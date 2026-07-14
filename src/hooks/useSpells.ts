import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Spell, SpellInsert, SpellUpdate } from '@/lib/types/database'

export function useSpells(characterId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['spells', characterId],
    queryFn: async (): Promise<Spell[]> => {
      if (!characterId) return []
      const { data, error } = await supabase
        .from('spells')
        .select('*')
        .eq('character_id', characterId)
        .order('level')
        .order('name')
      if (error) throw error
      return data ?? []
    },
    enabled: !!characterId,
  })

  const addSpell = useMutation({
    mutationFn: async (spell: SpellInsert) => {
      const { data, error } = await supabase.from('spells').insert(spell).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['spells', characterId] }),
  })

  const updateSpell = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: SpellUpdate }) => {
      const { data, error } = await supabase.from('spells').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['spells', characterId] }),
  })

  const deleteSpell = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('spells').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['spells', characterId] }),
  })

  return {
    spells: query.data ?? [],
    isLoading: query.isLoading,
    addSpell: addSpell.mutateAsync,
    updateSpell: updateSpell.mutateAsync,
    deleteSpell: deleteSpell.mutateAsync,
  }
}
