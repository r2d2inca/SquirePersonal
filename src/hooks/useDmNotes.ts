import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DmNote, DmNoteInsert, DmNoteUpdate } from '@/lib/types/database'

export function useDmNotes(userId: string | undefined, campaignId: string | undefined | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['dm-notes', userId, campaignId],
    queryFn: async (): Promise<DmNote[]> => {
      if (!userId || !campaignId) return []
      const { data, error } = await supabase
        .from('dm_notes')
        .select('*')
        .eq('user_id', userId)
        .eq('campaign_id', campaignId)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!userId && !!campaignId,
  })

  const addNote = useMutation({
    mutationFn: async (note: DmNoteInsert) => {
      const { data, error } = await supabase.from('dm_notes').insert(note).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dm-notes'] }),
  })

  const updateNote = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: DmNoteUpdate }) => {
      const { data, error } = await supabase.from('dm_notes').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dm-notes'] }),
  })

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dm_notes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dm-notes'] }),
  })

  return {
    notes: query.data ?? [],
    isLoading: query.isLoading,
    addNote: addNote.mutateAsync,
    updateNote: updateNote.mutateAsync,
    deleteNote: deleteNote.mutateAsync,
  }
}
