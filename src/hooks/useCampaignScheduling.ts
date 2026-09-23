import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  CampaignAvailability,
  CampaignScheduledSession,
  CampaignScheduledSessionInsert,
  CampaignScheduledSessionUpdate,
} from '@/lib/types/database'
import type { CoalescedBlock } from '@/lib/scheduling'

/**
 * Availability and scheduled sessions for a campaign.
 *
 * Reads are campaign-wide — every member sees every member's availability,
 * which is what makes the overlap view work. RLS keeps writes to your own rows.
 */
export function useCampaignScheduling(campaignId: string | undefined | null) {
  const queryClient = useQueryClient()

  const availabilityQuery = useQuery({
    queryKey: ['campaign-availability', campaignId],
    queryFn: async (): Promise<CampaignAvailability[]> => {
      if (!campaignId) return []
      const { data, error } = await supabase
        .from('campaign_availability')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('starts_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as CampaignAvailability[]
    },
    enabled: !!campaignId,
  })

  const sessionsQuery = useQuery({
    queryKey: ['campaign-scheduled-sessions', campaignId],
    queryFn: async (): Promise<CampaignScheduledSession[]> => {
      if (!campaignId) return []
      const { data, error } = await supabase
        .from('campaign_scheduled_sessions')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('starts_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as CampaignScheduledSession[]
    },
    enabled: !!campaignId,
  })

  /**
   * Replace one player's availability inside a window.
   *
   * Delete-then-insert rather than a diff: the grid submits a complete picture
   * of the window, and scoping the delete to the window means editing next week
   * can't wipe what you already said about the week after. Any block that
   * merely overlaps the window edge is replaced too, since the grid redrew it.
   */
  const saveAvailability = useMutation({
    mutationFn: async (input: {
      campaignId: string
      userId: string
      timeZone: string
      windowStart: Date
      windowEnd: Date
      blocks: CoalescedBlock[]
    }) => {
      const { error: deleteError } = await supabase
        .from('campaign_availability')
        .delete()
        .eq('campaign_id', input.campaignId)
        .eq('user_id', input.userId)
        .lt('starts_at', input.windowEnd.toISOString())
        .gt('ends_at', input.windowStart.toISOString())
      if (deleteError) throw deleteError

      if (input.blocks.length === 0) return []

      const rows = input.blocks.map((block) => ({
        campaign_id: input.campaignId,
        user_id: input.userId,
        starts_at: block.starts_at,
        ends_at: block.ends_at,
        status: block.status,
        time_zone: input.timeZone,
      }))

      const { data, error } = await supabase.from('campaign_availability').insert(rows).select()
      if (error) throw error
      return data
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['campaign-availability', campaignId] }),
  })

  const scheduleSession = useMutation({
    mutationFn: async (session: CampaignScheduledSessionInsert) => {
      const { data, error } = await supabase
        .from('campaign_scheduled_sessions')
        .insert(session)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['campaign-scheduled-sessions', campaignId] }),
  })

  const updateSession = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CampaignScheduledSessionUpdate }) => {
      const { data, error } = await supabase
        .from('campaign_scheduled_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['campaign-scheduled-sessions', campaignId] }),
  })

  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('campaign_scheduled_sessions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['campaign-scheduled-sessions', campaignId] }),
  })

  return {
    availability: availabilityQuery.data ?? [],
    sessions: sessionsQuery.data ?? [],
    isLoading: availabilityQuery.isLoading || sessionsQuery.isLoading,
    isSaving: saveAvailability.isPending,
    saveAvailability: saveAvailability.mutateAsync,
    scheduleSession: scheduleSession.mutateAsync,
    updateSession: updateSession.mutateAsync,
    deleteSession: deleteSession.mutateAsync,
  }
}
