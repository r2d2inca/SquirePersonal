import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DmSessionPlan, DmSessionPlanInsert, DmSessionPlanUpdate } from '@/lib/types/database'

/** Upcoming-session prep for a campaign. DM-private. */
export function useSessionPlans(userId: string | undefined, campaignId: string | undefined | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['dm-session-plans', userId, campaignId],
    queryFn: async (): Promise<DmSessionPlan[]> => {
      if (!userId || !campaignId) return []
      const { data, error } = await supabase
        .from('dm_session_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('campaign_id', campaignId)
        .order('planned_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as DmSessionPlan[]
    },
    enabled: !!userId && !!campaignId,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['dm-session-plans'] })

  const addPlan = useMutation({
    mutationFn: async (plan: DmSessionPlanInsert) => {
      const { data, error } = await supabase.from('dm_session_plans').insert(plan).select().single()
      if (error) throw error
      return data as DmSessionPlan
    },
    onSuccess: invalidate,
  })

  const updatePlan = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: DmSessionPlanUpdate }) => {
      const { data, error } = await supabase.from('dm_session_plans').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data as DmSessionPlan
    },
    // Beat check-offs during a session should feel instant, so patch the cache first.
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['dm-session-plans'] })
      const snapshots = queryClient.getQueriesData<DmSessionPlan[]>({ queryKey: ['dm-session-plans'] })
      for (const [key, data] of snapshots) {
        if (!data) continue
        queryClient.setQueryData(key, data.map((p) => (p.id === id ? { ...p, ...updates } : p)))
      }
      return { snapshots }
    },
    onError: (_err, _vars, context) => {
      for (const [key, data] of context?.snapshots ?? []) queryClient.setQueryData(key, data)
    },
    onSettled: invalidate,
  })

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dm_session_plans').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return {
    plans: query.data ?? [],
    isLoading: query.isLoading,
    addPlan: addPlan.mutateAsync,
    updatePlan: updatePlan.mutateAsync,
    deletePlan: deletePlan.mutateAsync,
  }
}
