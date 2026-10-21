import { useState } from 'react'
import { Plus, ClipboardList, Trash2, Calendar, Loader2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SessionPlanEditor } from './SessionPlanEditor'
import { useSessionPlans } from '@/hooks/useSessionPlans'
import { useEncounterTemplates } from '@/hooks/useEncounterTemplates'
import { useCampaignScheduling } from '@/hooks/useCampaignScheduling'
import { useLaunchEncounter } from '@/hooks/useLaunchEncounter'
import { useDmStore } from '@/stores/dmStore'
import { pushToast } from '@/stores/toastStore'
import { format, parseISO } from 'date-fns'
import type { Character, DmSessionPlan, DmSessionLogInsert, Npc, SessionPlanStatus } from '@/lib/types/database'

const STATUS_BADGE: Record<SessionPlanStatus, { label: string; variant: 'default' | 'gold' | 'success' | 'arcane' }> = {
  planning: { label: 'Planning', variant: 'default' },
  ready: { label: 'Ready', variant: 'gold' },
  running: { label: 'Running', variant: 'arcane' },
  done: { label: 'Done', variant: 'success' },
}

interface SessionPlannerPanelProps {
  campaignId: string
  userId: string
  npcs: Npc[]
  partyCharacters: Character[]
  /** Highest existing recap number, so new plans default to the next one. */
  nextSessionNumber: number
  onLogSession: (log: DmSessionLogInsert) => Promise<unknown>
}

export function SessionPlannerPanel({ campaignId, userId, npcs, partyCharacters, nextSessionNumber, onLogSession }: SessionPlannerPanelProps) {
  const { plans, isLoading, addPlan, updatePlan, deletePlan } = useSessionPlans(userId, campaignId)
  const { templates } = useEncounterTemplates(userId, campaignId)
  const { sessions: scheduledSessions } = useCampaignScheduling(campaignId)
  const launcher = useLaunchEncounter(campaignId, userId, partyCharacters)
  const openPlanId = useDmStore((s) => s.openPlanId)
  const setOpenPlanId = useDmStore((s) => s.setOpenPlanId)
  const setOpenTemplateId = useDmStore((s) => s.setOpenTemplateId)
  const setActiveDmTab = useDmStore((s) => s.setActiveDmTab)
  const [deleteTarget, setDeleteTarget] = useState<DmSessionPlan | null>(null)
  const [creating, setCreating] = useState(false)
  const [showDone, setShowDone] = useState(false)

  const partyLevels = partyCharacters.map((c) => c.level)
  const openPlan = openPlanId ? plans.find((p) => p.id === openPlanId) ?? null : null
  const visiblePlans = showDone ? plans : plans.filter((p) => p.status !== 'done')
  const doneCount = plans.filter((p) => p.status === 'done').length

  async function handleCreate() {
    setCreating(true)
    try {
      const highestPlanned = plans.reduce((max, p) => Math.max(max, p.session_number ?? 0), 0)
      const created = await addPlan({
        campaign_id: campaignId,
        user_id: userId,
        title: `Session ${Math.max(nextSessionNumber, highestPlanned + 1)}`,
        session_number: Math.max(nextSessionNumber, highestPlanned + 1),
        status: 'planning',
        planned_date: null,
        scheduled_session_id: null,
        overview: '',
        beats: [],
      })
      setOpenPlanId(created.id)
    } finally {
      setCreating(false)
    }
  }

  async function handleDuplicate(p: DmSessionPlan) {
    const created = await addPlan({
      campaign_id: campaignId,
      user_id: userId,
      title: `${p.title} (copy)`,
      session_number: null,
      status: 'planning',
      planned_date: null,
      scheduled_session_id: null,
      overview: p.overview,
      beats: p.beats.map((b) => ({ ...b, id: crypto.randomUUID(), done: false })),
    })
    setOpenPlanId(created.id)
  }

  /**
   * Plan → recap. The overview becomes the summary draft and each beat a
   * notable-event line (done ones ticked), then the plan is marked done and
   * the DM lands on the recap to polish it.
   */
  async function handleLogSession(plan: DmSessionPlan) {
    const events = plan.beats
      .map((b) => `${b.done ? '✓' : '○'} ${b.title || '(untitled)'}${b.type === 'read_aloud' ? '' : b.body ? ` — ${b.body.split('\n')[0]}` : ''}`)
      .join('\n')
    try {
      await onLogSession({
        user_id: userId,
        campaign_id: campaignId,
        session_number: plan.session_number,
        title: plan.title,
        summary: plan.overview || `Recap for ${plan.title}.`,
        date_played: plan.planned_date ?? new Date().toISOString().split('T')[0],
        notable_events: events,
      })
      await updatePlan({ id: plan.id, updates: { status: 'done', beats: plan.beats } })
      pushToast({ message: 'Session logged. Edit the recap under Session Recaps.', tone: 'heal' })
      setOpenPlanId(null)
      setActiveDmTab('sessions')
    } catch (err) {
      pushToast({ message: err instanceof Error ? err.message : 'Could not log session', tone: 'danger' })
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>
  }

  const replaceDialog = (
    <ConfirmDialog
      open={!!launcher.pendingReplace}
      onClose={launcher.cancelReplace}
      onConfirm={() => void launcher.confirmReplace()}
      title="Replace live encounter?"
      message={`"${launcher.liveEncounter?.name || 'The current encounter'}" is still in the Combat tab. Launching "${launcher.pendingReplace?.name ?? ''}" will end and discard it.`}
      confirmLabel="Replace & Launch"
    />
  )

  if (openPlan) {
    return (
      <>
        <SessionPlanEditor
          key={openPlan.id}
          plan={openPlan}
          templates={templates}
          npcs={npcs}
          scheduledSessions={scheduledSessions}
          partyLevels={partyLevels}
          isLaunching={launcher.isLaunching}
          onBack={() => setOpenPlanId(null)}
          onSave={(updates) => updatePlan({ id: openPlan.id, updates })}
          onLaunchEncounter={(t) => launcher.launch(t)}
          onOpenTemplate={(id) => { setOpenTemplateId(id); setActiveDmTab('encounters') }}
          onLogSession={handleLogSession}
        />
        {replaceDialog}
      </>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-ink-900">Session Planner</h2>
          <p className="text-sm text-ink-500 mt-1">Prep the next session as a sequence of beats, then run it from the same screen.</p>
        </div>
        <Button onClick={handleCreate} size="sm" disabled={creating}>
          {creating ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Plus size={14} className="mr-1" />} New Plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={48} />}
          title="Nothing Planned Yet"
          description="Sketch out scenes, boxed text, encounters and NPCs for your next session. At the table it becomes a checklist with everything one click away."
          action={{ label: 'Plan a Session', onClick: handleCreate }}
        />
      ) : (
        <>
          <div className="space-y-3">
            {visiblePlans.map((p) => {
              const badge = STATUS_BADGE[p.status]
              const done = p.beats.filter((b) => b.done).length
              const encounters = p.beats.filter((b) => b.type === 'encounter').length
              return (
                <Card key={p.id} className="cursor-pointer hover:border-gold-400 transition-colors">
                  <div onClick={() => setOpenPlanId(p.id)} className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {p.session_number != null && (
                          <span className="font-mono text-xs bg-gold-200 text-gold-700 px-2 py-0.5 rounded">#{p.session_number}</span>
                        )}
                        <h3 className="font-display text-lg text-ink-900 truncate">{p.title}</h3>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-ink-500 flex-wrap">
                        {p.planned_date && (
                          <span className="flex items-center gap-1"><Calendar size={12} /> {format(parseISO(p.planned_date), 'EEE, MMM d')}</span>
                        )}
                        <span>{p.beats.length} beat{p.beats.length === 1 ? '' : 's'}{p.status === 'running' ? ` · ${done} done` : ''}</span>
                        {encounters > 0 && <span>{encounters} encounter{encounters === 1 ? '' : 's'}</span>}
                      </div>
                      {p.overview && <p className="text-sm text-ink-500 line-clamp-2 mt-2">{p.overview}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleDuplicate(p)} className="p-1.5 text-ink-300 hover:text-ink-700 cursor-pointer" title="Duplicate">
                        <Copy size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget(p)} className="p-1.5 text-ink-300 hover:text-danger cursor-pointer" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
          {doneCount > 0 && (
            <button onClick={() => setShowDone(!showDone)} className="text-xs text-ink-400 hover:text-ink-700 cursor-pointer">
              {showDone ? 'Hide' : 'Show'} {doneCount} finished plan{doneCount === 1 ? '' : 's'}
            </button>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) void deletePlan(deleteTarget.id); setDeleteTarget(null) }}
        title="Delete Session Plan"
        message={`Delete "${deleteTarget?.title ?? ''}"? Linked encounters and NPCs are not affected.`}
      />
      {replaceDialog}
    </div>
  )
}
