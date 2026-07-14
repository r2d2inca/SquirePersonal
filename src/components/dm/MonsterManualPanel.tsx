import { useState } from 'react'
import { Skull, Search, Save, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { MonsterStatBlock } from './MonsterStatBlock'
import { useMonsters, useMonsterDetail } from '@/hooks/useMonsters'
import { srdMonsterToNpcInsert } from '@/lib/dnd5e'
import type { SRDMonsterSummary } from '@/lib/dnd5e'
import type { NpcInsert } from '@/lib/types/database'

const CR_OPTIONS = [
  0, 0.125, 0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
]

function formatCR(cr: number): string {
  if (cr === 0.125) return '1/8'
  if (cr === 0.25) return '1/4'
  if (cr === 0.5) return '1/2'
  return String(cr)
}

interface MonsterManualPanelProps {
  userId: string
  campaignId: string | null
  onSaveAsNpc: (npc: NpcInsert) => void
}

export function MonsterManualPanel({ userId, campaignId, onSaveAsNpc }: MonsterManualPanelProps) {
  const { monsters, isLoading } = useMonsters()
  const [searchQuery, setSearchQuery] = useState('')
  const [crFilter, setCrFilter] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null)
  const { monster: selectedMonster, isLoading: detailLoading } = useMonsterDetail(selectedIndex)
  const [saving, setSaving] = useState(false)

  const filtered = monsters.filter((m) => {
    if (searchQuery && !m.name.toLowerCase().startsWith(searchQuery.toLowerCase())) return false
    return true
  })

  // We don't have CR in the summary list, so we filter client-side only by name
  // CR filtering requires fetching all details — too expensive. We'll show it in the detail view.

  async function handleSaveAsNpc() {
    if (!selectedMonster) return
    setSaving(true)
    try {
      const npcInsert = srdMonsterToNpcInsert(selectedMonster, userId, campaignId)
      await onSaveAsNpc(npcInsert)
      setSaving(false)
      setSelectedIndex(null)
    } catch {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl text-ink-900">Monster Manual</h2>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search monsters..."
          className="w-full pl-9 pr-4 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400"
        />
      </div>

      {/* Monster List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {filtered.slice(0, 100).map((monster) => (
          <button
            key={monster.index}
            onClick={() => setSelectedIndex(monster.index)}
            className="text-left px-4 py-3 bg-parchment-50 border border-parchment-300 rounded-lg hover:border-gold-400 hover:bg-parchment-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Skull size={14} className="text-ink-400 shrink-0" />
              <span className="font-display text-sm text-ink-900 truncate">{monster.name}</span>
            </div>
          </button>
        ))}
      </div>

      {filtered.length > 100 && (
        <p className="text-center text-sm text-ink-400">
          Showing 100 of {filtered.length} results. Refine your search.
        </p>
      )}

      {filtered.length === 0 && (
        <EmptyState
          icon={<Skull size={48} />}
          title="No Monsters Found"
          description="Try a different search term."
        />
      )}

      {/* Monster Detail Modal */}
      <Modal
        open={!!selectedIndex}
        onClose={() => setSelectedIndex(null)}
        title="Monster Details"
        size="lg"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : selectedMonster ? (
          <div>
            <MonsterStatBlock monster={selectedMonster} />
            <div className="mt-6 pt-4 border-t border-parchment-300">
              <Button onClick={handleSaveAsNpc} disabled={saving} className="w-full">
                {saving ? (
                  <><Loader2 size={14} className="mr-1 animate-spin" /> Saving...</>
                ) : (
                  <><Save size={14} className="mr-1" /> Save as Custom NPC</>
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
