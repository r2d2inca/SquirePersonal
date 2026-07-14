import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { LoreEntry, LoreEntryInsert, LoreEntryUpdate } from '@/lib/types/database'

export function useLoreEntries(userId: string | undefined, characterId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['lore-entries', userId, characterId],
    queryFn: async (): Promise<LoreEntry[]> => {
      if (!userId) return []
      let q = supabase
        .from('lore_entries')
        .select('*')
        .eq('user_id', userId)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false })
      if (characterId) q = q.eq('character_id', characterId)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    enabled: !!userId,
  })

  const addEntry = useMutation({
    mutationFn: async (entry: LoreEntryInsert) => {
      const { data, error } = await supabase.from('lore_entries').insert(entry).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lore-entries'] }),
  })

  const updateEntry = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: LoreEntryUpdate }) => {
      const { data, error } = await supabase.from('lore_entries').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lore-entries'] }),
  })

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lore_entries').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lore-entries'] }),
  })

  return {
    entries: query.data ?? [],
    isLoading: query.isLoading,
    addEntry: addEntry.mutateAsync,
    updateEntry: updateEntry.mutateAsync,
    deleteEntry: deleteEntry.mutateAsync,
  }
}
