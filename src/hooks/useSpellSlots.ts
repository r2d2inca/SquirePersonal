import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { playSound } from '@/lib/sound'
import type { SpellSlot, SpellSlotInsert } from '@/lib/types/database'

export function useSpellSlots(characterId: string | undefined) {
  const queryClient = useQueryClient()
  const queryKey = ['spell-slots', characterId]

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<SpellSlot[]> => {
      if (!characterId) return []
      const { data, error } = await supabase
        .from('spell_slots')
        .select('*')
        .eq('character_id', characterId)
        .order('slot_level')
      if (error) throw error
      return data ?? []
    },
    enabled: !!characterId,
  })

  const upsertSlots = useMutation({
    mutationFn: async (slots: SpellSlotInsert[]) => {
      const { data, error } = await supabase
        .from('spell_slots')
        .upsert(slots, { onConflict: 'character_id,slot_level' })
        .select()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const expendSlotMutation = useMutation({
    mutationFn: async ({ slotId, prevExpended }: { slotId: string; prevExpended: number }) => {
      const { data, error } = await supabase
        .from('spell_slots')
        .update({ expended: prevExpended + 1 })
        .eq('id', slotId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ slotId }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<SpellSlot[]>(queryKey)
      queryClient.setQueryData<SpellSlot[]>(queryKey, (old) =>
        old?.map((s) => (s.id === slotId ? { ...s, expended: s.expended + 1 } : s))
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  const restoreSlotMutation = useMutation({
    mutationFn: async ({ slotId, prevExpended }: { slotId: string; prevExpended: number }) => {
      const { data, error } = await supabase
        .from('spell_slots')
        .update({ expended: Math.max(0, prevExpended - 1) })
        .eq('id', slotId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ slotId }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<SpellSlot[]>(queryKey)
      queryClient.setQueryData<SpellSlot[]>(queryKey, (old) =>
        old?.map((s) => (s.id === slotId ? { ...s, expended: Math.max(0, s.expended - 1) } : s))
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  const longRest = useMutation({
    mutationFn: async () => {
      if (!characterId) return
      const { error } = await supabase
        .from('spell_slots')
        .update({ expended: 0 })
        .eq('character_id', characterId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  return {
    spellSlots: query.data ?? [],
    isLoading: query.isLoading,
    upsertSlots: upsertSlots.mutateAsync,
    expendSlot: async (slotId: string) => {
      const slot = (query.data ?? []).find((s) => s.id === slotId)
      if (!slot || slot.expended >= slot.total) throw new Error('No slots available')
      playSound('spellSlot')
      return expendSlotMutation.mutateAsync({ slotId, prevExpended: slot.expended })
    },
    restoreSlot: async (slotId: string) => {
      const slot = (query.data ?? []).find((s) => s.id === slotId)
      if (!slot || slot.expended <= 0) throw new Error('Slot already full')
      return restoreSlotMutation.mutateAsync({ slotId, prevExpended: slot.expended })
    },
    longRest: longRest.mutateAsync,
  }
}
