import { useState } from 'react'
import { Plus, StickyNote, Pin, Trash2, Edit2, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { MarkdownPreview } from '@/components/ui/MarkdownPreview'
import { MarkdownEditor } from '@/components/ui/MarkdownEditor'
import { format } from 'date-fns'
import type { DmNote, DmNoteInsert, DmNoteUpdate } from '@/lib/types/database'

interface DmNotesPanelProps {
  notes: DmNote[]
  userId: string
  campaignId: string
  onAdd: (note: DmNoteInsert) => void
  onUpdate: (id: string, updates: DmNoteUpdate) => void
  onDelete: (id: string) => void
}

export function DmNotesPanel({ notes, userId, campaignId, onAdd, onUpdate, onDelete }: DmNotesPanelProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const filtered = searchQuery
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = {
      title: form.get('title') as string || 'Untitled',
      content: form.get('content') as string || '',
    }

    if (editingId) {
      onUpdate(editingId, data)
      setEditingId(null)
    } else {
      onAdd({ ...data, user_id: userId, campaign_id: campaignId, is_pinned: false, sort_order: 0 })
    }
    setShowForm(false)
  }

  const editingNote = editingId ? notes.find((n) => n.id === editingId) : null

  if (!campaignId) {
    return (
      <EmptyState
        icon={<StickyNote size={48} />}
        title="No Campaign Selected"
        description="Select a campaign from the Campaigns tab to manage notes."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink-900">DM Notes</h2>
        <Button onClick={() => { setEditingId(null); setShowForm(true) }} size="sm">
          <Plus size={14} className="mr-1" /> New Note
        </Button>
      </div>

      {notes.length > 0 && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-9 pr-4 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400"
          />
        </div>
      )}

      {notes.length === 0 ? (
        <EmptyState
          icon={<StickyNote size={48} />}
          title="No DM Notes"
          description="Keep track of plot hooks, NPC details, and session prep."
          action={{ label: 'Create Note', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((note) => (
            <Card key={note.id}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base text-ink-900">{note.title}</h3>
                  {note.is_pinned && <Pin size={12} className="text-gold-500" />}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onUpdate(note.id, { is_pinned: !note.is_pinned })}
                    className={`p-1 transition-colors cursor-pointer ${
                      note.is_pinned ? 'text-gold-500' : 'text-ink-300 hover:text-gold-500'
                    }`}
                  >
                    <Pin size={14} />
                  </button>
                  <button
                    onClick={() => { setEditingId(note.id); setShowForm(true) }}
                    className="p-1 text-ink-300 hover:text-ink-700 transition-colors cursor-pointer"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(note.id)}
                    className="p-1 text-ink-300 hover:text-danger transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="line-clamp-6">
                <MarkdownPreview content={note.content} />
              </div>
              <p className="text-xs text-ink-300 mt-3">
                {format(new Date(note.updated_at), 'MMM d, yyyy h:mm a')}
              </p>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && onDelete(deleteTarget)}
        title="Delete Note"
        message="Are you sure you want to delete this DM note? This action cannot be undone."
      />

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingId(null) }}
        title={editingId ? 'Edit Note' : 'New Note'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="title" label="Title" defaultValue={editingNote?.title ?? ''} placeholder="Note title..." />
          <MarkdownEditor name="content" label="Content" rows={8} defaultValue={editingNote?.content ?? ''} placeholder="Write your note... (supports markdown)" />
          <Button type="submit" className="w-full">
            {editingId ? 'Update Note' : 'Save Note'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
