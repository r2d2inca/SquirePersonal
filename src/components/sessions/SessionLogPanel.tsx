import { useState } from 'react'
import { Plus, BookOpen, Calendar, Trash2, Edit2, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Badge } from '@/components/ui/Badge'
import { generateSessionRecap } from '@/hooks/useAI'
import { format } from 'date-fns'
import type { SessionLog, SessionLogInsert, SessionLogUpdate } from '@/lib/types/database'

interface SessionLogPanelProps {
  sessions: SessionLog[]
  userId: string
  characterId: string | null
  onAdd: (session: SessionLogInsert) => void
  onUpdate: (id: string, updates: SessionLogUpdate) => void
  onDelete: (id: string) => void
}

export function SessionLogPanel({ sessions, userId, characterId, onAdd, onUpdate, onDelete }: SessionLogPanelProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // AI Recap state
  const [showRecapPicker, setShowRecapPicker] = useState(false)
  const [selectedForRecap, setSelectedForRecap] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)
  const [showRecapResult, setShowRecapResult] = useState(false)
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [recapResult, setRecapResult] = useState<{ title: string; summary: string; notableEvents: string } | null>(null)

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
      onAdd({ ...data, user_id: userId, character_id: characterId })
    }
    setShowForm(false)
  }

  const editingSession = editingId ? sessions.find((s) => s.id === editingId) : null

  function openRecapPicker() {
    // Pre-select last 5 sessions
    const last5 = new Set(sessions.slice(0, 5).map(s => s.id))
    setSelectedForRecap(last5)
    setShowRecapPicker(true)
  }

  function toggleRecapSession(id: string) {
    setSelectedForRecap(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleGenerateRecap() {
    setGenerating(true)
    try {
      const selected = sessions.filter(s => selectedForRecap.has(s.id))
      const recap = await generateSessionRecap({
        previousSessions: selected.map(s => ({
          title: s.title, summary: s.summary, notable_events: s.notable_events, session_number: s.session_number,
        })),
      })
      setRecapResult(recap)
      setShowRecapPicker(false)
      setShowRecapResult(true)
    } catch (err) {
      console.error('Recap generation failed:', err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink-900">Session Logs</h2>
        <div className="flex items-center gap-2">
          {sessions.length > 0 && (
            <Button onClick={openRecapPicker} size="sm" variant="secondary">
              <Sparkles size={14} className="mr-1" /> AI Recap
            </Button>
          )}
          <Button onClick={() => { setEditingId(null); setShowForm(true) }} size="sm">
            <Plus size={14} className="mr-1" /> New Session
          </Button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={48} />}
          title="No Session Logs"
          description="Record your adventures after each session to keep track of your campaign."
          action={{ label: 'Log First Session', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {session.session_number && (
                      <span className="font-mono text-xs bg-gold-200 text-gold-700 px-2 py-0.5 rounded">
                        #{session.session_number}
                      </span>
                    )}
                    <h3 className="font-display text-lg text-ink-900">{session.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-ink-500 mb-3">
                    <Calendar size={12} />
                    {format(new Date(session.date_played), 'MMMM d, yyyy')}
                  </div>
                  {session.summary.length > 300 && !expandedSessions.has(session.id) ? (
                    <div>
                      <p className="text-sm text-ink-700 whitespace-pre-wrap">{session.summary.slice(0, 300)}...</p>
                      <button
                        onClick={() => setExpandedSessions(prev => new Set(prev).add(session.id))}
                        className="flex items-center gap-1 text-xs text-gold-600 hover:text-gold-700 mt-1 cursor-pointer"
                      >
                        <ChevronDown size={12} /> Show more
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-ink-700 whitespace-pre-wrap">{session.summary}</p>
                      {session.summary.length > 300 && (
                        <button
                          onClick={() => setExpandedSessions(prev => { const s = new Set(prev); s.delete(session.id); return s })}
                          className="flex items-center gap-1 text-xs text-gold-600 hover:text-gold-700 mt-1 cursor-pointer"
                        >
                          <ChevronUp size={12} /> Show less
                        </button>
                      )}
                    </div>
                  )}
                  {session.notable_events && (expandedSessions.has(session.id) || session.summary.length <= 300) && (
                    <div className="mt-3 pt-3 border-t border-parchment-300">
                      <span className="text-xs font-display uppercase text-ink-500">Notable Events</span>
                      <p className="text-sm text-ink-700 mt-1 whitespace-pre-wrap">{session.notable_events}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => { setEditingId(session.id); setShowForm(true) }}
                    className="p-1.5 text-ink-300 hover:text-ink-700 transition-colors cursor-pointer"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(session.id)}
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

      {/* New/Edit Session Form */}
      <Modal
        key={editingId ?? 'new'}
        open={showForm}
        onClose={() => { setShowForm(false); setEditingId(null) }}
        title={editingId ? 'Edit Session' : 'New Session Log'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              name="title"
              label="Session Title"
              required
              defaultValue={editingSession?.title ?? ''}
              placeholder="The Dragon's Lair"
            />
            <Input
              name="session_number"
              label="Session #"
              type="number"
              min={1}
              defaultValue={editingSession?.session_number ?? sessions.length + 1}
            />
          </div>
          <Input
            name="date_played"
            label="Date Played"
            type="date"
            defaultValue={editingSession?.date_played ?? new Date().toISOString().split('T')[0]}
          />
          <Textarea
            name="summary"
            label="Summary"
            required
            rows={5}
            defaultValue={editingSession?.summary ?? ''}
            placeholder="Write a concise summary of what happened this session..."
          />
          <Textarea
            name="notable_events"
            label="Notable Events (optional)"
            rows={3}
            defaultValue={editingSession?.notable_events ?? ''}
            placeholder="Key moments, loot gained, NPCs met..."
          />
          <Button type="submit" className="w-full">
            {editingId ? 'Update Session' : 'Save Session'}
          </Button>
        </form>
      </Modal>

      {/* AI Recap — Session Picker */}
      <Modal
        open={showRecapPicker}
        onClose={() => setShowRecapPicker(false)}
        title="Generate AI Recap"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-600">Select which sessions to include in the recap summary.</p>
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {sessions.map((s) => {
              const isSelected = selectedForRecap.has(s.id)
              return (
                <button
                  key={s.id}
                  onClick={() => toggleRecapSession(s.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left cursor-pointer transition-colors ${
                    isSelected ? 'bg-arcane-400/10 border border-arcane-400/30' : 'hover:bg-parchment-200 border border-transparent'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center ${
                    isSelected ? 'bg-arcane-500 border-arcane-600' : 'border-parchment-400'
                  }`}>
                    {isSelected && <span className="text-white text-[10px]">✓</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {s.session_number && <Badge variant="gold">#{s.session_number}</Badge>}
                      <span className="text-sm text-ink-900 truncate">{s.title}</span>
                    </div>
                    <span className="text-xs text-ink-400">{format(new Date(s.date_played), 'MMM d, yyyy')}</span>
                  </div>
                </button>
              )
            })}
          </div>
          <Button
            onClick={handleGenerateRecap}
            className="w-full"
            disabled={generating || selectedForRecap.size === 0}
          >
            {generating ? (
              <><Loader2 size={14} className="mr-1 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles size={14} className="mr-1" /> Generate Recap ({selectedForRecap.size} sessions)</>
            )}
          </Button>
        </div>
      </Modal>

      {/* AI Recap — Result (view-only, does NOT create a session log) */}
      <Modal
        open={showRecapResult}
        onClose={() => { setShowRecapResult(false); setRecapResult(null) }}
        title="AI Session Recap"
        size="md"
      >
        {recapResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-arcane-500" />
              <span className="text-xs text-arcane-500 font-display uppercase">AI Generated Summary</span>
            </div>
            <div>
              <h3 className="font-display text-lg text-ink-900 mb-2">{recapResult.title}</h3>
              <p className="text-sm text-ink-700 whitespace-pre-wrap">{recapResult.summary}</p>
            </div>
            {recapResult.notableEvents && (
              <div className="pt-3 border-t border-parchment-300">
                <span className="text-xs font-display uppercase text-ink-500">Notable Events</span>
                <p className="text-sm text-ink-700 mt-1 whitespace-pre-wrap">{recapResult.notableEvents}</p>
              </div>
            )}
            <Button variant="ghost" onClick={() => { setShowRecapResult(false); setRecapResult(null) }} className="w-full">
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
