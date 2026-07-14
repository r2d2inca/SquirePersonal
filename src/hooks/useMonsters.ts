import { useQuery } from '@tanstack/react-query'
import { getAllMonsters, getMonsterDetail, type SRDMonsterSummary, type SRDMonsterDetail } from '@/lib/dnd5e'

export function useMonsters() {
  const query = useQuery({
    queryKey: ['srd-monsters'],
    queryFn: getAllMonsters,
    staleTime: Infinity, // SRD data never changes
  })

  return {
    monsters: query.data ?? [],
    isLoading: query.isLoading,
  }
}

export function useMonsterDetail(monsterIndex: string | null) {
  const query = useQuery({
    queryKey: ['srd-monster', monsterIndex],
    queryFn: () => getMonsterDetail(monsterIndex!),
    enabled: !!monsterIndex,
    staleTime: Infinity,
  })

  return {
    monster: query.data ?? null,
    isLoading: query.isLoading,
  }
}
