import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  CampaignEncounterInsert,
  CampaignEncounterUpdate,
  EncounterCombatant,
  EncounterCombatantInsert,
  EncounterCombatantUpdate,
} from '@/lib/types/database'

export function useEncounterActions(campaignId: string | undefined | null) {
  const queryClient = useQueryClient()

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['encounter', campaignId] })
    queryClient.invalidateQueries({ queryKey: ['encounter-combatants'] })
  }

  // ─── Encounter CRUD ───

  const createEncounter = useMutation({
    mutationFn: async (encounter: CampaignEncounterInsert) => {
      const { data, error } = await supabase
        .from('campaign_encounters')
        .insert(encounter)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: invalidate,
  })

  const updateEncounter = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CampaignEncounterUpdate }) => {
      const { data, error } = await supabase
        .from('campaign_encounters')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: invalidate,
  })

  const deleteEncounter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campaign_encounters')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  // ─── Combatant CRUD ───

  const addCombatant = useMutation({
    mutationFn: async (combatant: EncounterCombatantInsert) => {
      const { data, error } = await supabase
        .from('encounter_combatants')
        .insert(combatant)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: invalidate,
  })

  const addCombatants = useMutation({
    mutationFn: async (combatants: EncounterCombatantInsert[]) => {
      const { data, error } = await supabase
        .from('encounter_combatants')
        .insert(combatants)
        .select()
      if (error) throw error
      return data
    },
    onSuccess: invalidate,
  })

  const updateCombatant = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: EncounterCombatantUpdate }) => {
      const { data, error } = await supabase
        .from('encounter_combatants')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ id, updates }) => {
      // Cancel in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['encounter-combatants'] })

      // Snapshot all combatant queries for rollback
      const queries = queryClient.getQueriesData<EncounterCombatant[]>({
        queryKey: ['encounter-combatants'],
      })
      const snapshots: [readonly unknown[], EncounterCombatant[]][] = []

      for (const [key, data] of queries) {
        if (!data) continue
        snapshots.push([key, data])
        queryClient.setQueryData(
          key,
          data.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        )
      }

      return { snapshots }
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.snapshots) {
        for (const [key, data] of context.snapshots) {
          queryClient.setQueryData(key, data)
        }
      }
    },
    onSettled: invalidate,
  })

  const removeCombatant = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('encounter_combatants')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  // ─── Map Upload ───

  const uploadMap = useMutation({
    mutationFn: async ({ encounterId, file }: { encounterId: string; file: File }) => {
      const ext = file.name.split('.').pop() ?? 'png'
      const path = `${campaignId}/${encounterId}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('battle-maps')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('battle-maps')
        .getPublicUrl(path)

      const { error: updateError } = await supabase
        .from('campaign_encounters')
        .update({ map_image_url: urlData.publicUrl })
        .eq('id', encounterId)
      if (updateError) throw updateError

      return urlData.publicUrl
    },
    onSuccess: invalidate,
  })

  // ─── Turn Management ───

  const advanceTurn = useMutation({
    mutationFn: async ({
      encounterId,
      combatants,
      currentTurnId,
      round,
    }: {
      encounterId: string
      combatants: { id: string; initiative: number | null }[]
      currentTurnId: string | null
      round: number
    }) => {
      const sorted = [...combatants]
        .filter((c) => c.initiative != null)
        .sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0))

      if (sorted.length === 0) return

      const currentIdx = currentTurnId
        ? sorted.findIndex((c) => c.id === currentTurnId)
        : -1

      const nextIdx = currentIdx + 1
      const isNewRound = nextIdx >= sorted.length
      const nextCombatant = sorted[isNewRound ? 0 : nextIdx]

      const { error } = await supabase
        .from('campaign_encounters')
        .update({
          current_turn_combatant_id: nextCombatant.id,
          round: isNewRound ? round + 1 : round,
        })
        .eq('id', encounterId)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const prevTurn = useMutation({
    mutationFn: async ({
      encounterId,
      combatants,
      currentTurnId,
      round,
    }: {
      encounterId: string
      combatants: { id: string; initiative: number | null }[]
      currentTurnId: string | null
      round: number
    }) => {
      const sorted = [...combatants]
        .filter((c) => c.initiative != null)
        .sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0))

      if (sorted.length === 0) return

      const currentIdx = currentTurnId
        ? sorted.findIndex((c) => c.id === currentTurnId)
        : 0

      const prevIdx = currentIdx - 1
      const isPrevRound = prevIdx < 0
      const prevCombatant = sorted[isPrevRound ? sorted.length - 1 : prevIdx]

      const { error } = await supabase
        .from('campaign_encounters')
        .update({
          current_turn_combatant_id: prevCombatant.id,
          round: isPrevRound ? Math.max(1, round - 1) : round,
        })
        .eq('id', encounterId)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return {
    createEncounter: createEncounter.mutateAsync,
    updateEncounter: updateEncounter.mutateAsync,
    deleteEncounter: deleteEncounter.mutateAsync,
    addCombatant: addCombatant.mutateAsync,
    addCombatants: addCombatants.mutateAsync,
    updateCombatant: updateCombatant.mutateAsync,
    removeCombatant: removeCombatant.mutateAsync,
    uploadMap: uploadMap.mutateAsync,
    advanceTurn: advanceTurn.mutateAsync,
    prevTurn: prevTurn.mutateAsync,
  }
}
