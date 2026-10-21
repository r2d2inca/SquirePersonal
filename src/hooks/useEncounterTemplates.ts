import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { EncounterTemplate, EncounterTemplateInsert, EncounterTemplateUpdate } from '@/lib/types/database'

/** Saved (pre-built) encounters for a campaign. DM-private. */
export function useEncounterTemplates(userId: string | undefined, campaignId: string | undefined | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['encounter-templates', userId, campaignId],
    queryFn: async (): Promise<EncounterTemplate[]> => {
      if (!userId || !campaignId) return []
      const { data, error } = await supabase
        .from('encounter_templates')
        .select('*')
        .eq('user_id', userId)
        .eq('campaign_id', campaignId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as EncounterTemplate[]
    },
    enabled: !!userId && !!campaignId,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['encounter-templates'] })

  const addTemplate = useMutation({
    mutationFn: async (template: EncounterTemplateInsert) => {
      const { data, error } = await supabase.from('encounter_templates').insert(template).select().single()
      if (error) throw error
      return data as EncounterTemplate
    },
    onSuccess: invalidate,
  })

  const updateTemplate = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: EncounterTemplateUpdate }) => {
      const { data, error } = await supabase.from('encounter_templates').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data as EncounterTemplate
    },
    onSuccess: invalidate,
  })

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('encounter_templates').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return {
    templates: query.data ?? [],
    isLoading: query.isLoading,
    addTemplate: addTemplate.mutateAsync,
    updateTemplate: updateTemplate.mutateAsync,
    deleteTemplate: deleteTemplate.mutateAsync,
  }
}
