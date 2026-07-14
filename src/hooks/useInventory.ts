import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { InventoryItem, InventoryItemInsert, InventoryItemUpdate } from '@/lib/types/database'

export function useInventory(characterId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['inventory', characterId],
    queryFn: async (): Promise<InventoryItem[]> => {
      if (!characterId) return []
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('character_id', characterId)
        .order('category')
        .order('name')
      if (error) throw error
      return data ?? []
    },
    enabled: !!characterId,
  })

  const addItem = useMutation({
    mutationFn: async (item: InventoryItemInsert) => {
      const { data, error } = await supabase.from('inventory_items').insert(item).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory', characterId] }),
  })

  const updateItem = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: InventoryItemUpdate }) => {
      const { data, error } = await supabase.from('inventory_items').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory', characterId] }),
  })

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inventory_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory', characterId] }),
  })

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    addItem: addItem.mutateAsync,
    updateItem: updateItem.mutateAsync,
    deleteItem: deleteItem.mutateAsync,
  }
}
