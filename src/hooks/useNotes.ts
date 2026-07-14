import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Note, NoteInsert, NoteUpdate } from '@/lib/types/database'

export function useNotes(userId: string | undefined, characterId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['notes', userId, characterId],
    queryFn: async (): Promise<Note[]> => {
      if (!userId) return []
      let q = supabase
        .from('notes')
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

  const addNote = useMutation({
    mutationFn: async (note: NoteInsert) => {
      const { data, error } = await supabase.from('notes').insert(note).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  })

  const updateNote = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: NoteUpdate }) => {
      const { data, error } = await supabase.from('notes').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  })

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  })

  return {
    notes: query.data ?? [],
    isLoading: query.isLoading,
    addNote: addNote.mutateAsync,
    updateNote: updateNote.mutateAsync,
    deleteNote: deleteNote.mutateAsync,
  }
}
