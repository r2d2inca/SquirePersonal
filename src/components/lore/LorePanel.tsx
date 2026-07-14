import { useState } from 'react'
import { Plus, Map, Pin, Trash2, Edit2, Search, Users, MapPin, Flag, BookMarked, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LORE_CATEGORIES } from '@/lib/constants'
import type { LoreEntry, LoreEntryInsert, LoreEntryUpdate } from '@/lib/types/database'

const CATEGORY_ICONS: Record<string, typeof Users> = {
  npc: Users,
  location: MapPin,
  faction: Flag,
  plot_point: BookMarked,
  item: Sparkles,
  other: Map,
}

const CATEGORY_LABELS: Record<string, string> = {
  npc: 'NPCs',
  location: 'Locations',
  faction: 'Factions',
  plot_point: 'Plot Points',
  item: 'Items',
  other: 'Other',
}

interface LorePanelProps {
  entries: LoreEntry[]
  userId: string
  characterId: string | null
  onAdd: (entry: LoreEntryInsert) => void
  onUpdate: (id: string, updates: LoreEntryUpdate) => void
  onDelete: (id: string) => void
}

export function LorePanel({ entries, userId, characterId, onAdd, onUpdate, onDelete }: LorePanelProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const filtered = entries.filter((e) => {
    if (filterCategory && e.category !== filterCategory) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    return true
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const tagsRaw = form.get('tags') as string
    const data = {
      name: form.get('name') as string,
      category: form.get('category') as string || 'other',
      description: form.get('description') as string || '',
      tags: tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [],
      is_pinned: false,
      related_entries: [],
    }

    if (editingId) {
      onUpdate(editingId, data)
      setEditingId(null)
    } else {
      onAdd({ ...data, user_id: userId, character_id: characterId })
    }
    setShowForm(false)
  }

  const editingEntry = editingId ? entries.find((e) => e.id === editingId) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink-900">Lore Tracker</h2>
        <Button onClick={() => { setEditingId(null); setShowForm(true) }} size="sm">
          <Plus size={14} className="mr-1" /> Add Entry
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lore..."
            className="w-full pl-9 pr-4 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterCategory(null)}
            className={`px-3 py-1 rounded text-xs font-display uppercase cursor-pointer transition-colors ${
              filterCategory === null ? 'bg-gold-400 text-ink-900' : 'bg-parchment-200 text-ink-500'
            }`}
          >
            All ({entries.length})
          </button>
          {LORE_CATEGORIES.map((cat) => {
            const count = entries.filter((e) => e.category === cat).length
            if (count === 0) return null
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                className={`px-3 py-1 rounded text-xs font-display uppercase cursor-pointer transition-colors ${
                  filterCategory === cat ? 'bg-gold-400 text-ink-900' : 'bg-parchment-200 text-ink-500'
                }`}
              >
                {CATEGORY_LABELS[cat]} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <EmptyState
          icon={<Map size={48} />}
          title="No Lore Entries"
          description="Track NPCs, locations, factions, and plot points from your campaign."
          action={{ label: 'Add First Entry', onClick: () => setShowForm(true) }}
        />
      ) : filtered.length === 0 ? (
        <p className="text-center text-ink-500 py-8">No entries match your search.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((entry) => {
            const Icon = CATEGORY_ICONS[entry.category] || Map
            return (
              <Card key={entry.id}>
                <div className="flex items-start gap-3">
                  <Icon size={20} className="text-gold-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base text-ink-900">{entry.name}</h3>
                      {entry.is_pinned && <Pin size={12} className="text-gold-500" />}
                    </div>
                    <Badge variant="default" className="mt-1">{CATEGORY_LABELS[entry.category]}</Badge>
                    <p className="text-sm text-ink-700 mt-2 whitespace-pre-wrap line-clamp-4">
                      {entry.description}
                    </p>
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.tags.map((tag) => (
                          <span key={tag} className="text-xs bg-parchment-200 text-ink-500 px-2 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => onUpdate(entry.id, { is_pinned: !entry.is_pinned })}
                      className={`p-1 transition-colors cursor-pointer ${
                        entry.is_pinned ? 'text-gold-500' : 'text-ink-300 hover:text-gold-500'
                      }`}
                    >
                      <Pin size={14} />
                    </button>
                    <button
                      onClick={() => { setEditingId(entry.id); setShowForm(true) }}
                      className="p-1 text-ink-300 hover:text-ink-700 transition-colors cursor-pointer"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(entry.id)}
                      className="p-1 text-ink-300 hover:text-danger transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && onDelete(deleteTarget)}
        title="Delete Lore Entry"
        message="Are you sure you want to delete this lore entry? This action cannot be undone."
      />

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingId(null) }}
        title={editingId ? 'Edit Lore Entry' : 'New Lore Entry'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              name="name"
              label="Name"
              required
              defaultValue={editingEntry?.name ?? ''}
              placeholder="e.g. Elminster, Waterdeep"
            />
            <Select
              name="category"
              label="Category"
              options={LORE_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
              defaultValue={editingEntry?.category ?? 'npc'}
            />
          </div>
          <Textarea
            name="description"
            label="Description"
            rows={5}
            defaultValue={editingEntry?.description ?? ''}
            placeholder="Describe this lore entry..."
          />
          <Input
            name="tags"
            label="Tags (comma-separated)"
            defaultValue={editingEntry?.tags.join(', ') ?? ''}
            placeholder="ally, quest-giver, merchant"
          />
          <Button type="submit" className="w-full">
            {editingId ? 'Update Entry' : 'Add Entry'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
