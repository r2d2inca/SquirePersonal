import { useState } from 'react'
import { Plus, BookOpen, Calendar, Trash2, Edit2, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { generateSessionRecap } from '@/hooks/useAI'
import { format } from 'date-fns'
import type { CampaignSessionLog, CampaignSessionLogInsert, CampaignSessionLogUpdate } from '@/lib/types/database'

interface CampaignSessionLogsSectionProps {
  logs: CampaignSessionLog[]
  campaignId: string
  userId: string
  memberNames: Record<string, string>
  onAdd: (log: CampaignSessionLogInsert) => void
  onUpdate: (id: string, updates: CampaignSessionLogUpdate) => void
  onDelete: (id: string) => void
}

export function CampaignSessionLogsSection({ logs, campaignId, userId, memberNames, onAdd, onUpdate, onDelete }: CampaignSessionLogsSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [formDefaults, setFormDefaults] = useState<{ title: string; summary: string; notable_events: string } | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = {
      title: form.get('title') as string,
      summary: form.get('summary') as string,
      notable_events: form.get('notable_events') as string || '',
      session_number: parseInt(form.get('session_number') as string) || null,
      date_played: form.get('date_played') as string || new Date().toISOString().split('T')[0],
    }

    if (editingId) {
      onUpdate(editingId, data)
      setEditingId(null)
    } else {
      onAdd({ ...data, campaign_id: campaignId, user_id: userId })
    }
    setShowForm(false)
  }

  const editingLog = editingId ? logs.find((l) => l.id === editingId) : null

  async function handleGenerateRecap() {
    setGenerating(true)
    try {
      const recap = await generateSessionRecap({
        previousSessions: logs.slice(0, 5).map(l => ({
          title: l.title, summary: l.summary, notable_events: l.notable_events, session_number: l.session_number,
        })),
        campaignName: campaignId,
      })
      setFormDefaults({ title: recap.title, summary: recap.summary, notable_events: recap.notableEvents })
      setEditingId(null)
      setShowForm(true)
    } catch (err) {
      console.error('Recap generation failed:', err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink-900">Shared Session Logs</h2>
        <div className="flex items-center gap-2">
          <Button onClick={handleGenerateRecap} size="sm" variant="secondary" disabled={generating}>
            {generating ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Sparkles size={14} className="mr-1" />}
            {generating ? 'Generating...' : 'AI Recap'}
          </Button>
          <Button onClick={() => { setEditingId(null); setFormDefaults(null); setShowForm(true) }} size="sm">
            <Plus size={14} className="mr-1" /> New Session
          </Button>
        </div>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={48} />}
          title="No Session Logs"
          description="Record shared session recaps for your campaign."
          action={{ label: 'Log First Session', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <Card key={log.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {log.session_number && (
                      <span className="font-mono text-xs bg-gold-200 text-gold-700 px-2 py-0.5 rounded">
                        #{log.session_number}
                      </span>
                    )}
                    <h3 className="font-display text-lg text-ink-900">{log.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-500 mb-3">
                    <Calendar size={12} />
                    {format(new Date(log.date_played), 'MMMM d, yyyy')}
                    <Badge variant="default">{memberNames[log.user_id] ?? log.profiles?.display_name ?? 'Unknown'}</Badge>
                  </div>
                  <p className="text-sm text-ink-700 whitespace-pre-wrap">{log.summary}</p>
                  {log.notable_events && (
                    <div className="mt-3 pt-3 border-t border-parchment-300">
                      <span className="text-xs font-display uppercase text-ink-500">Notable Events</span>
                      <p className="text-sm text-ink-700 mt-1 whitespace-pre-wrap">{log.notable_events}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => { setEditingId(log.id); setShowForm(true) }}
                    className="p-1.5 text-ink-300 hover:text-ink-700 transition-colors cursor-pointer"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(log.id)}
                    className="p-1.5 text-ink-300 hover:text-danger transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && onDelete(deleteTarget)}
        title="Delete Session"
        message="Are you sure you want to delete this session log? This action cannot be undone."
      />

      <Modal
        key={formDefaults ? 'ai' : editingId ?? 'new'}
        open={showForm}
        onClose={() => { setShowForm(false); setEditingId(null); setFormDefaults(null) }}
        title={editingId ? 'Edit Session' : 'New Session Log'}
        size="md"
      >
        <form key={formDefaults ? 'ai-form' : editingId ?? 'new'} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              name="title"
              label="Session Title"
              required
              defaultValue={editingLog?.title ?? formDefaults?.title ?? ''}
              placeholder="The Dragon's Lair"
            />
            <Input
              name="session_number"
              label="Session #"
              type="number"
              min={1}
              defaultValue={editingLog?.session_number ?? logs.length + 1}
            />
          </div>
          <Input
            name="date_played"
            label="Date Played"
            type="date"
            defaultValue={editingLog?.date_played ?? new Date().toISOString().split('T')[0]}
          />
          <Textarea
            name="summary"
            label="Summary"
            required
            rows={5}
            defaultValue={editingLog?.summary ?? formDefaults?.summary ?? ''}
            placeholder="Write a concise summary of what happened this session..."
          />
          <Textarea
            name="notable_events"
            label="Notable Events (optional)"
            rows={3}
            defaultValue={editingLog?.notable_events ?? formDefaults?.notable_events ?? ''}
            placeholder="Key moments, loot gained, NPCs met..."
          />
          <Button type="submit" className="w-full">
            {editingId ? 'Update Session' : 'Save Session'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
