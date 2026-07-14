import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CampaignMessage, CampaignMessageInsert } from '@/lib/types/database'

export function useCampaignMessages(campaignId: string | undefined | null, recipientId?: string | null, currentUserId?: string) {
  const queryClient = useQueryClient()

  const queryKey = ['campaign-messages', campaignId, recipientId]

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<CampaignMessage[]> => {
      if (!campaignId) return []

      let q = supabase
        .from('campaign_messages')
        .select('*, profiles!sender_id(display_name)')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true })

      if (recipientId === undefined || recipientId === null) {
        // Group chat: only messages with no recipient
        q = q.is('recipient_id', null)
      } else if (currentUserId) {
        // DM thread: messages between current user and recipientId
        q = q.or(
          `and(sender_id.eq.${currentUserId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${currentUserId})`
        )
      }

      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as CampaignMessage[]
    },
    enabled: !!campaignId,
  })

  // Realtime subscription — invalidate query on INSERT / DELETE
  useEffect(() => {
    if (!campaignId) return

    const channel = supabase
      .channel(`campaign-messages:${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_messages',
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['campaign-messages', campaignId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [campaignId, recipientId, queryClient])

  const sendMessage = useMutation({
    mutationFn: async (msg: CampaignMessageInsert) => {
      const { data, error } = await supabase.from('campaign_messages').insert(msg).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign-messages'] }),
  })

  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('campaign_messages').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign-messages'] }),
  })

  return {
    messages: query.data ?? [],
    isLoading: query.isLoading,
    sendMessage: sendMessage.mutateAsync,
    deleteMessage: deleteMessage.mutateAsync,
  }
}
