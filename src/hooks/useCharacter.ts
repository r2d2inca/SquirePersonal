import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Character, CharacterInsert, CharacterUpdate } from '@/lib/types/database'

export function useCharacter(userId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['character', userId],
    queryFn: async (): Promise<Character | null> => {
      if (!userId) return null
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })

  const createMutation = useMutation({
    mutationFn: async (character: CharacterInsert) => {
      const { data, error } = await supabase
        .from('characters')
        .insert(character)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character', userId] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CharacterUpdate }) => {
      const { data, error } = await supabase
        .from('characters')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    // Write to the cache immediately. Without this, a refetch already in flight can
    // resolve after a subsequent write and stomp it — which made rapid edits (and the
    // HP undo toast) appear to silently do nothing.
    onMutate: async ({ updates }) => {
      await queryClient.cancelQueries({ queryKey: ['character', userId] })
      const previous = queryClient.getQueryData<Character | null>(['character', userId])
      if (previous) {
        queryClient.setQueryData<Character>(['character', userId], { ...previous, ...updates })
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['character', userId], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['character', userId] })
    },
  })

  return {
    character: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    createCharacter: createMutation.mutateAsync,
    updateCharacter: updateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  }
}
