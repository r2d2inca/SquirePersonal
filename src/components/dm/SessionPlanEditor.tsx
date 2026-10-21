import { useState } from 'react'
import {
  ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Save, Loader2, Play, Eye, BookOpen,
  Clapperboard, Quote, Swords, Ghost, Gem, StickyNote, CheckCircle2, Circle, ListChecks, Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { MarkdownPreview } from '@/components/ui/MarkdownPreview'
import { MonsterStatBlock } from './MonsterStatBlock'
import { EncounterDifficultyCard } from './EncounterDifficultyCard'
import { format, parseISO } from 'date-fns'
import type {
  DmSessionPlan, DmSessionPlanUpdate, SessionBeat, SessionBeatType, SessionPlanStatus,
  EncounterTemplate, Npc, CampaignScheduledSession,
} from '@/lib/types/database'

const BEAT_TYPES: { type: SessionBeatType; label: string; icon: typeof Clapperboard; hint: string }[] = [
  { type: 'scene', label: 'Scene', icon: Clapperboard, hint: 'A location or situation the party walks into' },
  { type: 'read_aloud', label: 'Read Aloud', icon: Quote, hint: 'Boxed text to read to the table' },
  { type: 'encounter', label: 'Encounter', icon: Swords, hint: 'A saved encounter, launchable from here' },
  { type: 'npc', label: 'NPC', icon: Ghost, hint: 'Someone they meet, with the stat block a click away' },
  { type: 'loot', label: 'Loot', icon: Gem, hint: 'Treasure, clues, rewards' },
  { type: 'note', label: 'Note', icon: StickyNote, hint: 'Anything else: timing, contingencies, reminders' },
]

const STATUS_OPTIONS: { value: SessionPlanStatus; label: string; variant: 'default' | 'gold' | 'success' | 'arcane' }[] = [
  { value: 'planning', label: 'Planning', variant: 'default' },
  { value: 'ready', label: 'Ready', variant: 'gold' },
  { value: 'running', label: 'Running', variant: 'arcane' },
  { value: 'done', label: 'Done', variant: 'success' },
]

function beatMeta(type: SessionBeatType) {
  return BEAT_TYPES.find((b) => b.type === type) ?? BEAT_TYPES[5]
}

function newBeat(type: SessionBeatType): SessionBeat {
  return { id: crypto.randomUUID(), type, title: '', body: '', encounter_template_id: null, npc_id: null, done: false }
}

interface SessionPlanEditorProps {
  plan: DmSessionPlan
  templates: EncounterTemplate[]
  npcs: Npc[]
  scheduledSessions: CampaignScheduledSession[]
  partyLevels: number[]
  isLaunching: boolean
  onBack: () => void
  onSave: (updates: DmSessionPlanUpdate) => Promise<unknown>
  onLaunchEncounter: (template: EncounterTemplate) => void
  onOpenTemplate: (templateId: string) => void
  onLogSession: (plan: DmSessionPlan) => void
}

export function SessionPlanEditor({
  plan, templates, npcs, scheduledSessions, partyLevels, isLaunching,
  onBack, onSave, onLaunchEncounter, onOpenTemplate, onLogSession,
}: SessionPlanEditorProps) {
  const [title, setTitle] = useState(plan.title)
  const [sessionNumber, setSessionNumber] = useState(plan.session_number?.toString() ?? '')
  const [status, setStatus] = useState<SessionPlanStatus>(plan.status)
  const [plannedDate, setPlannedDate] = useState(plan.planned_date ?? '')
  const [scheduledSessionId, setScheduledSessionId] = useState(plan.scheduled_session_id ?? '')
  const [overview, setOverview] = useState(plan.overview)
  const [beats, setBeats] = useState<SessionBeat[]>(plan.beats)
  const [saving, setSaving] = useState(false)
  const [runMode, setRunMode] = useState(plan.status === 'running')
  const [viewingNpc, setViewingNpc] = useState<Npc | null>(null)

  const draft: DmSessionPlanUpdate = {
    title: title.trim() || 'Untitled Session',
    session_number: sessionNumber ? parseInt(sessionNumber) || null : null,
    status,
    planned_date: plannedDate || null,
    scheduled_session_id: scheduledSessionId || null,
    overview,
    beats,
  }

  const isDirty =
    draft.title !== plan.title ||
    draft.session_number !== plan.session_number ||
    draft.status !== plan.status ||
    draft.planned_date !== plan.planned_date ||
    draft.scheduled_session_id !== plan.scheduled_session_id ||
    draft.overview !== plan.overview ||
    JSON.stringify(beats) !== JSON.stringify(plan.beats)

  const doneCount = beats.filter((b) => b.done).length
  const currentBeatId = beats.find((b) => !b.done)?.id ?? null
  const upcomingSessions = scheduledSessions.filter((s) => s.status === 'confirmed')

  function updateBeat(id: string, updates: Partial<SessionBeat>) {
    setBeats((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)))
  }

  function moveBeat(id: string, dir: -1 | 1) {
    setBeats((prev) => {
      const idx = prev.findIndex((b) => b.id === id)
      const target = idx + dir
      if (idx < 0 || target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  async function handleSave(overrides: DmSessionPlanUpdate = {}): Promise<boolean> {
    setSaving(true)
    try {
      await onSave({ ...draft, ...overrides })
      return true
    } catch {
      return false
    } finally {
      setSaving(false)
    }
  }

  // Run mode persists each check-off immediately, so a refresh mid-session
  // (or switching to the Combat tab and back) never loses your place.
  async function toggleDone(beat: SessionBeat) {
    const nextBeats = beats.map((b) => (b.id === beat.id ? { ...b, done: !b.done } : b))
    setBeats(nextBeats)
    const nextStatus: SessionPlanStatus = status === 'planning' || status === 'ready' ? 'running' : status
    setStatus(nextStatus)
    await onSave({ ...draft, beats: nextBeats, status: nextStatus })
  }

  async function startRun() {
    setRunMode(true)
    if (status !== 'running' && status !== 'done') {
      setStatus('running')
      await handleSave({ status: 'running' })
    }
  }

  function handlePickSchedule(id: string) {
    setScheduledSessionId(id)
    const s = scheduledSessions.find((x) => x.id === id)
    if (s) setPlannedDate(format(parseISO(s.starts_at), 'yyyy-MM-dd'))
  }

  const header = (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button onClick={onBack} className="p-1 text-ink-400 hover:text-ink-900 cursor-pointer" title="Back to session plans">
          <ArrowLeft size={20} />
        </button>
        {runMode ? (
          <h2 className="font-display text-2xl text-ink-900 truncate">{title || 'Untitled Session'}</h2>
        ) : (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Session title"
            className="font-display text-2xl text-ink-900 bg-transparent border-b border-transparent hover:border-parchment-400 focus:border-gold-400 focus:outline-none min-w-0 flex-1"
          />
        )}
      </div>
      <div className="flex items-center gap-2">
        {isDirty && <span className="text-xs text-warning">Unsaved</span>}
        {runMode ? (
          <Button size="sm" variant="secondary" onClick={() => setRunMode(false)}>
            <Pencil size={14} className="mr-1" /> Edit
          </Button>
        ) : (
          <>
            <Button size="sm" variant="secondary" onClick={() => handleSave()} disabled={saving || !isDirty}>
              {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Save size={14} className="mr-1" />} Save
            </Button>
            <Button size="sm" onClick={async () => { if (isDirty && !(await handleSave())) return; await startRun() }} disabled={saving || beats.length === 0}>
              <ListChecks size={14} className="mr-1" /> Run Session
            </Button>
          </>
        )}
      </div>
    </div>
  )

  /* ── Run mode: a checklist you walk through at the table ── */
  if (runMode) {
    return (
      <div className="space-y-6">
        {header}
        <div className="flex items-center justify-between text-sm text-ink-500">
          <span>{doneCount} of {beats.length} beats done</span>
          <div className="h-1.5 w-40 rounded-full bg-parchment-300 overflow-hidden">
            <div className="h-full bg-gold-400 transition-all" style={{ width: `${beats.length ? (doneCount / beats.length) * 100 : 0}%` }} />
          </div>
        </div>

        {overview && (
          <Card hover={false}>
            <MarkdownPreview content={overview} />
          </Card>
        )}

        <div className="space-y-3">
          {beats.map((beat, i) => {
            const meta = beatMeta(beat.type)
            const Icon = meta.icon
            const isCurrent = beat.id === currentBeatId
            const template = beat.encounter_template_id ? templates.find((t) => t.id === beat.encounter_template_id) : null
            const npc = beat.npc_id ? npcs.find((n) => n.id === beat.npc_id) : null
            return (
              <Card
                key={beat.id}
                hover={false}
                className={`transition-colors ${beat.done ? 'opacity-60' : ''} ${isCurrent ? 'border-gold-400 ring-1 ring-gold-400/40' : ''}`}
              >
                <div className="flex gap-3">
                  <button onClick={() => toggleDone(beat)} className="shrink-0 mt-0.5 text-ink-400 hover:text-gold-500 cursor-pointer" title={beat.done ? 'Mark not done' : 'Mark done'}>
                    {beat.done ? <CheckCircle2 size={22} className="text-heal" /> : <Circle size={22} />}
                  </button>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-ink-400">{i + 1}</span>
                      <Icon size={14} className="text-ink-400" />
                      <span className="text-[10px] font-display uppercase tracking-wider text-ink-400">{meta.label}</span>
                      <h3 className={`font-display text-lg text-ink-900 ${beat.done ? 'line-through' : ''}`}>{beat.title || '(untitled)'}</h3>
                    </div>

                    {beat.type === 'read_aloud' ? (
                      beat.body && (
                        <blockquote className="border-l-4 border-gold-400 bg-parchment-50 px-4 py-3 rounded-r-lg font-body text-base italic text-ink-900 whitespace-pre-wrap leading-relaxed">
                          {beat.body}
                        </blockquote>
                      )
                    ) : (
                      beat.body && <MarkdownPreview content={beat.body} />
                    )}

                    {beat.type === 'encounter' && (
                      template ? (
                        <div className="p-3 bg-parchment-50 border border-parchment-300 rounded-lg space-y-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="min-w-0">
                              <p className="font-display text-sm text-ink-900 truncate">{template.name}</p>
                              <EncounterDifficultyCard monsters={template.monsters} partyLevels={partyLevels} compact />
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="secondary" onClick={() => onOpenTemplate(template.id)}>
                                <Eye size={14} className="mr-1" /> Open
                              </Button>
                              <Button size="sm" onClick={() => onLaunchEncounter(template)} disabled={isLaunching}>
                                {isLaunching ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Play size={14} className="mr-1" />} Launch
                              </Button>
                            </div>
                          </div>
                          {template.tactics && <p className="text-xs text-ink-500 whitespace-pre-wrap"><span className="font-display uppercase tracking-wider text-[10px]">Tactics</span> {template.tactics}</p>}
                        </div>
                      ) : (
                        <p className="text-xs text-ink-400 italic">No saved encounter linked.</p>
                      )
                    )}

                    {beat.type === 'npc' && (
                      npc ? (
                        <div className="flex items-center justify-between p-3 bg-parchment-50 border border-parchment-300 rounded-lg">
                          <div>
                            <p className="font-display text-sm text-ink-900">{npc.name}</p>
                            <p className="text-xs text-ink-400">{npc.size} {npc.type} · CR {npc.challenge_rating} · HP {npc.hit_points} · AC {npc.armor_class}</p>
                          </div>
                          <Button size="sm" variant="secondary" onClick={() => setViewingNpc(npc)}>
                            <Eye size={14} className="mr-1" /> Stat Block
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-ink-400 italic">No NPC linked.</p>
                      )
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <Card hover={false} className="border-gold-400/50">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-display text-sm uppercase tracking-wider text-ink-500">Wrap up</h3>
              <p className="text-xs text-ink-500 mt-1">Turn this plan into a session recap. Done beats become the notable events; you can edit before saving.</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => onLogSession({ ...plan, ...draft, beats } as DmSessionPlan)}>
              <BookOpen size={14} className="mr-1" /> Log Session
            </Button>
          </div>
        </Card>

        <Modal open={!!viewingNpc} onClose={() => setViewingNpc(null)} title="NPC Stat Block" size="lg">
          {viewingNpc && <MonsterStatBlock monster={viewingNpc} />}
        </Modal>
      </div>
    )
  }

  /* ── Edit mode ── */
  return (
    <div className="space-y-6">
      {header}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card hover={false}>
            <Textarea
              label="Overview"
              rows={4}
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              placeholder="Where we left off, what this session needs to accomplish, the one thing to remember. Markdown works."
            />
          </Card>

          {/* Beats */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm uppercase tracking-wider text-ink-500">Beats ({beats.length})</h3>
            </div>

            {beats.length === 0 && (
              <Card hover={false}>
                <p className="text-sm text-ink-400 text-center py-4">A session is a sequence of beats. Add your first one below.</p>
              </Card>
            )}

            {beats.map((beat, i) => {
              const meta = beatMeta(beat.type)
              const Icon = meta.icon
              return (
                <Card key={beat.id} hover={false}>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                      <button onClick={() => moveBeat(beat.id, -1)} disabled={i === 0} className="p-0.5 text-ink-300 hover:text-ink-700 disabled:opacity-30 cursor-pointer"><ChevronUp size={14} /></button>
                      <span className="font-mono text-xs text-ink-400">{i + 1}</span>
                      <button onClick={() => moveBeat(beat.id, 1)} disabled={i === beats.length - 1} className="p-0.5 text-ink-300 hover:text-ink-700 disabled:opacity-30 cursor-pointer"><ChevronDown size={14} /></button>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-ink-400 shrink-0" />
                        <select
                          value={beat.type}
                          onChange={(e) => updateBeat(beat.id, { type: e.target.value as SessionBeatType })}
                          className="text-[11px] font-display uppercase tracking-wider text-ink-500 bg-transparent border-none focus:outline-none cursor-pointer"
                        >
                          {BEAT_TYPES.map((b) => <option key={b.type} value={b.type}>{b.label}</option>)}
                        </select>
                        <input
                          value={beat.title}
                          onChange={(e) => updateBeat(beat.id, { title: e.target.value })}
                          placeholder={meta.hint}
                          className="flex-1 min-w-0 px-2 py-1 bg-parchment-50 border border-parchment-400 rounded text-sm text-ink-900 focus:outline-none focus:border-gold-400"
                        />
                        <button onClick={() => setBeats((prev) => prev.filter((b) => b.id !== beat.id))} className="p-1 text-ink-300 hover:text-danger cursor-pointer shrink-0" title="Remove beat">
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {beat.type === 'encounter' && (
                        <select
                          value={beat.encounter_template_id ?? ''}
                          onChange={(e) => updateBeat(beat.id, { encounter_template_id: e.target.value || null })}
                          className="w-full px-2 py-1.5 bg-parchment-50 border border-parchment-400 rounded text-sm text-ink-900 focus:outline-none focus:border-gold-400"
                        >
                          <option value="">— Link a saved encounter —</option>
                          {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      )}
                      {beat.type === 'npc' && (
                        <select
                          value={beat.npc_id ?? ''}
                          onChange={(e) => updateBeat(beat.id, { npc_id: e.target.value || null })}
                          className="w-full px-2 py-1.5 bg-parchment-50 border border-parchment-400 rounded text-sm text-ink-900 focus:outline-none focus:border-gold-400"
                        >
                          <option value="">— Link an NPC —</option>
                          {npcs.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                        </select>
                      )}

                      <textarea
                        value={beat.body}
                        onChange={(e) => updateBeat(beat.id, { body: e.target.value })}
                        rows={beat.type === 'read_aloud' ? 4 : 2}
                        placeholder={beat.type === 'read_aloud' ? 'The text you will read word for word...' : 'Notes for this beat. Markdown works.'}
                        className={`w-full px-2 py-1.5 bg-parchment-50 border border-parchment-400 rounded text-sm text-ink-900 focus:outline-none focus:border-gold-400 resize-y ${beat.type === 'read_aloud' ? 'italic' : ''}`}
                      />
                    </div>
                  </div>
                </Card>
              )
            })}

            {/* Add beat */}
            <Card hover={false}>
              <p className="text-[10px] font-display uppercase tracking-wider text-ink-400 mb-2">Add a beat</p>
              <div className="flex flex-wrap gap-2">
                {BEAT_TYPES.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => setBeats((prev) => [...prev, newBeat(type)])}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-parchment-50 border border-parchment-400 rounded-full text-xs text-ink-700 hover:border-gold-400 hover:text-gold-600 cursor-pointer transition-colors"
                  >
                    <Plus size={12} /> <Icon size={12} /> {label}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Right: details */}
        <div className="space-y-4">
          <Card hover={false}>
            <h3 className="font-display text-sm uppercase tracking-wider text-ink-500 mb-3">Details</h3>
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="font-display text-xs uppercase tracking-wider text-ink-700">Status</label>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => setStatus(opt.value)} className={`cursor-pointer rounded-full transition-opacity ${status === opt.value ? '' : 'opacity-50 hover:opacity-80'}`}>
                      <Badge variant={opt.variant}>{opt.label}</Badge>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-display text-xs uppercase tracking-wider text-ink-700">Session #</label>
                  <input type="number" min={1} value={sessionNumber} onChange={(e) => setSessionNumber(e.target.value)} className="px-2 py-1.5 bg-parchment-50 border border-parchment-400 rounded font-mono text-sm text-ink-900 focus:outline-none focus:border-gold-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-display text-xs uppercase tracking-wider text-ink-700">Date</label>
                  <input type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} className="px-2 py-1.5 bg-parchment-50 border border-parchment-400 rounded font-mono text-sm text-ink-900 focus:outline-none focus:border-gold-400" />
                </div>
              </div>
              {upcomingSessions.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label className="font-display text-xs uppercase tracking-wider text-ink-700">Scheduled session</label>
                  <select value={scheduledSessionId} onChange={(e) => handlePickSchedule(e.target.value)} className="px-2 py-1.5 bg-parchment-50 border border-parchment-400 rounded text-sm text-ink-900 focus:outline-none focus:border-gold-400">
                    <option value="">— Not linked —</option>
                    {upcomingSessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {format(parseISO(s.starts_at), 'EEE MMM d, h:mm a')}{s.title ? ` · ${s.title}` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-ink-400">Picks up the date from the Schedule tab.</p>
                </div>
              )}
            </div>
          </Card>

          <Card hover={false}>
            <h3 className="font-display text-sm uppercase tracking-wider text-ink-500 mb-2">At the table</h3>
            <p className="text-xs text-ink-500 leading-relaxed">
              Run Session turns this into a checklist. Read-aloud beats render as boxed text, encounter beats launch straight into combat, NPC beats open the stat block. Check-offs save instantly.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
