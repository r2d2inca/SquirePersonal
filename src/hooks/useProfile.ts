import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  display_name: string
  role: 'player' | 'dm' | null
  created_at: string
  updated_at: string
}

export function useProfile(userId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['profile', userId],
    queryFn: async (): Promise<Profile | null> => {
      if (!userId) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })

  const updateRole = useMutation({
    mutationFn: async (role: 'player' | 'dm') => {
      if (!userId) throw new Error('No user')
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Immediately update cache so RoleGuard sees the new role before navigation
      queryClient.setQueryData(['profile', userId], data)
    },
  })

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    updateRole: updateRole.mutateAsync,
  }
}
