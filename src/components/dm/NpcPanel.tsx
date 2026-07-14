import { useState } from 'react'
import { Plus, Ghost, Trash2, Edit2, Search, Skull } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { MonsterStatBlock } from './MonsterStatBlock'
import { NpcFormModal } from './NpcFormModal'
import type { Npc, NpcInsert, NpcUpdate } from '@/lib/types/database'

interface NpcPanelProps {
  npcs: Npc[]
  userId: string
  campaignId: string | null
  onAdd: (npc: NpcInsert) => void
  onUpdate: (id: string, updates: NpcUpdate) => void
  onDelete: (id: string) => void
}

export function NpcPanel({ npcs, userId, campaignId, onAdd, onUpdate, onDelete }: NpcPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewingNpc, setViewingNpc] = useState<Npc | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const filtered = searchQuery
    ? npcs.filter(
        (n) =>
          n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : npcs

  const editingNpc = editingId ? npcs.find((n) => n.id === editingId) ?? null : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink-900">Custom NPCs</h2>
        <Button onClick={() => { setEditingId(null); setShowForm(true) }} size="sm">
          <Plus size={14} className="mr-1" /> New NPC
        </Button>
      </div>

      {/* Search */}
      {npcs.length > 0 && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search NPCs..."
            className="w-full pl-9 pr-4 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400"
          />
        </div>
      )}

      {npcs.length === 0 ? (
        <EmptyState
          icon={<Ghost size={48} />}
          title="No Custom NPCs"
          description="Create custom NPC stat blocks or save monsters from the Monster Manual."
          action={{ label: 'Create NPC', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((npc) => (
            <Card key={npc.id} className="cursor-pointer hover:border-gold-400 transition-colors">
              <div onClick={() => setViewingNpc(npc)} className="cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {npc.source === 'srd-modified' ? (
                      <Skull size={16} className="text-ink-400" />
                    ) : (
                      <Ghost size={16} className="text-ink-400" />
                    )}
                    <h3 className="font-display text-base text-ink-900">{npc.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setEditingId(npc.id); setShowForm(true) }}
                      className="p-1 text-ink-300 hover:text-ink-700 transition-colors cursor-pointer"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(npc.id)}
                      className="p-1 text-ink-300 hover:text-danger transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-ink-500">
                  {npc.size} {npc.type} {npc.alignment && `\u2022 ${npc.alignment}`}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-ink-700">
                  <span>CR {npc.challenge_rating}</span>
                  <span>HP {npc.hit_points}</span>
                  <span>AC {npc.armor_class}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* View NPC Stat Block */}
      <Modal
        open={!!viewingNpc}
        onClose={() => setViewingNpc(null)}
        title="NPC Stat Block"
        size="lg"
      >
        {viewingNpc && <MonsterStatBlock monster={viewingNpc} />}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && onDelete(deleteTarget)}
        title="Delete NPC"
        message="Are you sure you want to delete this NPC? This action cannot be undone."
      />

      {/* NPC Form */}
      <NpcFormModal
        key={editingId ?? 'new'}
        open={showForm}
        onClose={() => { setShowForm(false); setEditingId(null) }}
        npc={editingNpc}
        userId={userId}
        campaignId={campaignId}
        onSubmit={(data) => {
          if (editingId) {
            onUpdate(editingId, data)
          } else {
            onAdd(data as NpcInsert)
          }
          setShowForm(false)
          setEditingId(null)
        }}
      />
    </div>
  )
}
