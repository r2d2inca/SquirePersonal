import { useEffect, useMemo, useState } from 'react'
import {
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Globe,
  Settings2,
  Trash2,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AvailabilityGrid, type PaintMode } from './AvailabilityGrid'
import { AvailabilityHeatmap } from './AvailabilityHeatmap'
import {
  blocksToPaintedCells,
  buildScheduleGrid,
  coalescePaintedCells,
  computeOverlap,
  detectTimeZone,
  formatSlotRange,
  listTimeZones,
  rankBestSlots,
  startOfDayInZone,
  zoneAbbreviation,
  type AvailabilityStatus,
  type BestSlot,
} from '@/lib/scheduling'
import type {
  Campaign,
  CampaignAvailability,
  CampaignMember,
  CampaignScheduledSession,
  CampaignScheduledSessionInsert,
} from '@/lib/types/database'
import type { CoalescedBlock } from '@/lib/scheduling'

const TZ_STORAGE_KEY = 'squire-schedule-timezone'

/**
 * Day-window presets. `end` may exceed 24 to run past midnight (16→25 is
 * 4 PM–1 AM); all day is a full 0→24. Evenings is the default because most
 * groups play then and a 9-row grid is far quicker to fill in than 24 — but
 * all day is one click away for daytime or weekend games.
 */
const WINDOW_PRESETS: { id: string; label: string; start: number; end: number }[] = [
  { id: 'evenings', label: 'Evenings · 4 PM – 1 AM', start: 16, end: 25 },
  { id: 'afternoons', label: 'Afternoon & evening · 12 PM – 1 AM', start: 12, end: 25 },
  { id: 'daytime', label: 'Daytime · 9 AM – 9 PM', start: 9, end: 21 },
  { id: 'allday', label: 'All day · 24 hours', start: 0, end: 24 },
]

function hourOptions() {
  return Array.from({ length: 24 }, (_, h) => ({
    value: String(h),
    label: `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`,
  }))
}

interface CampaignScheduleSectionProps {
  campaign: Campaign
  userId: string
  members: CampaignMember[]
  memberNames: Record<string, string>
  availability: CampaignAvailability[]
  sessions: CampaignScheduledSession[]
  isSaving: boolean
  isDm?: boolean
  onSaveAvailability: (input: {
    campaignId: string
    userId: string
    timeZone: string
    windowStart: Date
    windowEnd: Date
    blocks: CoalescedBlock[]
  }) => Promise<unknown>
  onScheduleSession: (session: CampaignScheduledSessionInsert) => Promise<unknown>
  onDeleteSession: (id: string) => Promise<unknown>
  onUpdateCampaign?: (updates: Partial<Campaign>) => Promise<unknown>
}

export function CampaignScheduleSection({
  campaign,
  userId,
  members,
  memberNames,
  availability,
  sessions,
  isSaving,
  isDm = false,
  onSaveAvailability,
  onScheduleSession,
  onDeleteSession,
  onUpdateCampaign,
}: CampaignScheduleSectionProps) {
  // Everyone reads the grid in their own zone. Remembered per browser so a
  // player who overrides it (travelling, or a laptop set to the wrong zone)
  // doesn't have to re-pick every visit.
  const [timeZone, setTimeZone] = useState(() => {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(TZ_STORAGE_KEY) : null
    return stored || detectTimeZone()
  })
  const [weekOffset, setWeekOffset] = useState(0)
  const [view, setView] = useState<'mine' | 'party'>(isDm ? 'party' : 'mine')
  const [mode, setMode] = useState<PaintMode>('available')
  // Unsaved paint edits, keyed by the grid page they belong to. Keeping them
  // per-page means flipping to next week and back doesn't quietly discard what
  // you painted, and lets `painted` be derived rather than synced in an effect.
  const [edits, setEdits] = useState<Record<string, Map<string, AvailabilityStatus>>>({})
  const [slotToConfirm, setSlotToConfirm] = useState<BestSlot | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  // Settings form state, so picking a preset can move the custom hour selects.
  const [formStart, setFormStart] = useState(16)
  const [formEnd, setFormEnd] = useState(25)
  const [sessionToCancel, setSessionToCancel] = useState<string | null>(null)

  // One ticking clock for the whole section: hours grey out as they pass and a
  // session drops off the upcoming list when it ends, without a reload. Reading
  // the wall clock during render instead would be impure and wouldn't update.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    localStorage.setItem(TZ_STORAGE_KEY, timeZone)
  }, [timeZone])

  const weeksAhead = campaign.schedule_weeks_ahead ?? 4
  const dayStartHour = campaign.schedule_day_start_hour ?? 16
  const dayEndHour = campaign.schedule_day_end_hour ?? 25

  // Clamp paging to the window even if the DM shrinks it while someone's here.
  const maxOffset = Math.max(0, weeksAhead - 1)
  const safeOffset = Math.min(weekOffset, maxOffset)

  const grid = useMemo(() => {
    const today = new Date(now)
    return buildScheduleGrid({
      timeZone,
      startDate: startOfDayInZone(today, timeZone, safeOffset * 7),
      dayCount: 7,
      dayStartHour,
      dayEndHour,
      now: today,
    })
  }, [timeZone, safeOffset, dayStartHour, dayEndHour, now])

  const myBlocks = useMemo(
    () => availability.filter((a) => a.user_id === userId),
    [availability, userId],
  )

  // What's already saved for this page, and what the player is looking at: their
  // pending edits if any, otherwise whatever came back from the server.
  const gridKey = `${timeZone}|${safeOffset}`
  const savedPainted = useMemo(() => blocksToPaintedCells(myBlocks, grid), [myBlocks, grid])
  const painted = edits[gridKey] ?? savedPainted
  const dirty = gridKey in edits

  const overlap = useMemo(() => computeOverlap(availability, grid), [availability, grid])

  // The DM plays too, so they count toward a slot working. Members who never
  // submitted anything still count in the denominator — a slot isn't "everyone
  // free" just because half the party ignored the form.
  const memberIds = useMemo(() => members.map((m) => m.user_id), [members])

  const bestSlots = useMemo(
    () => rankBestSlots(grid, overlap, { memberIds, minHours: 2, limit: 5 }),
    [grid, overlap, memberIds],
  )

  const submittedIds = useMemo(
    () => new Set(availability.map((a) => a.user_id)),
    [availability],
  )
  const awaiting = members.filter((m) => !submittedIds.has(m.user_id))

  const upcomingSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.status === 'confirmed' && new Date(s.ends_at).getTime() > now)
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
    [sessions, now],
  )

  const windowBounds = useMemo(() => {
    const today = new Date(now)
    return {
      start: startOfDayInZone(today, timeZone, safeOffset * 7),
      end: startOfDayInZone(today, timeZone, safeOffset * 7 + 7),
    }
  }, [timeZone, safeOffset, now])

  async function handleSave() {
    await onSaveAvailability({
      campaignId: campaign.id,
      userId,
      timeZone,
      windowStart: windowBounds.start,
      windowEnd: windowBounds.end,
      blocks: coalescePaintedCells(painted, grid),
    })
    // Drop the pending edits for this page; the refetch is now the truth.
    setEdits((prev) => {
      const next = { ...prev }
      delete next[gridKey]
      return next
    })
  }

  function handleClearWeek() {
    setEdits((prev) => ({ ...prev, [gridKey]: new Map() }))
  }

  async function handleConfirmSlot(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!slotToConfirm) return
    const form = new FormData(e.currentTarget)
    await onScheduleSession({
      campaign_id: campaign.id,
      created_by: userId,
      starts_at: slotToConfirm.start.toISOString(),
      ends_at: slotToConfirm.end.toISOString(),
      title: (form.get('title') as string) || 'Session',
      notes: (form.get('notes') as string) || '',
      status: 'confirmed',
    })
    setSlotToConfirm(null)
  }

  async function handleSaveSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!onUpdateCampaign) return
    const form = new FormData(e.currentTarget)
    await onUpdateCampaign({
      schedule_weeks_ahead: Number(form.get('weeks')),
      schedule_day_start_hour: formStart,
      schedule_day_end_hour: formEnd,
    })
    setShowSettings(false)
  }

  const zoneLabel = zoneAbbreviation(new Date(now), timeZone)

  return (
    <div className="space-y-5">
      {/* Confirmed sessions */}
      {upcomingSessions.length > 0 && (
        <Card hover={false} className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarCheck size={16} className="text-gold-600" />
            <h3 className="font-display text-sm uppercase tracking-wider text-ink-700">
              Next Session{upcomingSessions.length > 1 ? 's' : ''}
            </h3>
          </div>
          <div className="space-y-2">
            {upcomingSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-start justify-between gap-3 p-3 bg-parchment-200/50 rounded-lg"
              >
                <div className="min-w-0">
                  <p className="font-display text-ink-900">{session.title || 'Session'}</p>
                  <p className="text-sm text-ink-500">
                    {formatSlotRange(new Date(session.starts_at), new Date(session.ends_at), timeZone)}
                  </p>
                  {session.notes && <p className="text-sm text-ink-500 mt-1">{session.notes}</p>}
                </div>
                {isDm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSessionToCancel(session.id)}
                    aria-label="Cancel session"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={safeOffset === 0}
            onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
            aria-label="Previous week"
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="font-display text-sm uppercase tracking-wider text-ink-700 px-1">
            {safeOffset === 0 ? 'This week' : `Week ${safeOffset + 1} of ${weeksAhead}`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={safeOffset >= maxOffset}
            onClick={() => setWeekOffset((w) => Math.min(maxOffset, w + 1))}
            aria-label="Next week"
          >
            <ChevronRight size={16} />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-ink-500">
            <Globe size={14} />
            <select
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="bg-transparent border border-parchment-400 rounded px-2 py-1 text-xs text-ink-700 max-w-[13rem] cursor-pointer"
              aria-label="Your timezone"
            >
              {listTimeZones().map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            {zoneLabel && <span className="text-ink-300">{zoneLabel}</span>}
          </div>
          {isDm && onUpdateCampaign && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFormStart(dayStartHour)
                setFormEnd(dayEndHour)
                setShowSettings(true)
              }}
              aria-label="Grid settings"
            >
              <Settings2 size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* View switch */}
      <div className="flex items-center gap-1 text-sm">
        {(['mine', 'party'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-lg font-display uppercase tracking-wider text-xs transition-colors cursor-pointer ${
              view === v ? 'bg-gold-200 text-gold-700' : 'text-ink-300 hover:text-ink-700'
            }`}
          >
            {v === 'mine' ? 'My availability' : 'Party overlap'}
          </button>
        ))}
      </div>

      {view === 'mine' ? (
        <Card hover={false} className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              {(
                [
                  { id: 'available', label: 'Free', cls: 'bg-heal/70' },
                  { id: 'maybe', label: 'Maybe', cls: 'bg-gold-300' },
                  { id: 'busy', label: 'Busy', cls: 'bg-parchment-200' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-display uppercase tracking-wider transition-colors cursor-pointer border ${
                    mode === m.id
                      ? 'border-gold-400 text-ink-900 bg-parchment-200'
                      : 'border-transparent text-ink-300 hover:text-ink-700'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-[3px] border border-parchment-400/60 ${m.cls}`} />
                  {m.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {dirty && <Badge variant="gold">Unsaved</Badge>}
              <Button variant="secondary" size="sm" onClick={handleClearWeek}>
                Clear week
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving || !dirty}>
                {isSaving ? 'Saving…' : 'Save availability'}
              </Button>
            </div>
          </div>

          <p className="text-xs text-ink-300">
            Click or drag to paint. Times shown in {timeZone.replace(/_/g, ' ')} — everyone else sees
            these hours converted to their own zone.
          </p>

          <AvailabilityGrid
            grid={grid}
            painted={painted}
            mode={mode}
            onChange={(next) => setEdits((prev) => ({ ...prev, [gridKey]: next }))}
          />
        </Card>
      ) : (
        <Card hover={false} className="p-4 space-y-4">
          {availability.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={40} />}
              title="No availability yet"
              description="Once players paint their free hours, the overlap shows up here with the best slots ranked."
            />
          ) : (
            <>
              <AvailabilityHeatmap
                grid={grid}
                overlap={overlap}
                memberCount={members.length}
                memberNames={memberNames}
              />

              {bestSlots.length > 0 && (
                <div className="pt-2 border-t border-parchment-300">
                  <h3 className="font-display text-sm uppercase tracking-wider text-ink-700 mb-2">
                    Best slots this week
                  </h3>
                  <div className="space-y-2">
                    {bestSlots.map((slot) => (
                      <div
                        key={slot.start.toISOString()}
                        className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-parchment-200/50 rounded-lg"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-ink-900">
                            {formatSlotRange(slot.start, slot.end, timeZone)}
                          </p>
                          <p className="text-xs text-ink-500">
                            {slot.available.length} of {members.length} free
                            {slot.maybe.length > 0 && ` · ${slot.maybe.length} maybe`}
                            {slot.missing.length > 0 &&
                              ` · missing ${slot.missing
                                .map((id) => memberNames[id] ?? 'Unknown')
                                .join(', ')}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {slot.available.length === members.length && (
                            <Badge variant="success">Everyone</Badge>
                          )}
                          {isDm && (
                            <Button size="sm" onClick={() => setSlotToConfirm(slot)}>
                              Confirm
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {awaiting.length > 0 && (
            <div className="flex items-start gap-2 pt-2 border-t border-parchment-300 text-sm text-ink-500">
              <Users size={14} className="mt-0.5 shrink-0" />
              <span>
                Waiting on{' '}
                {awaiting.map((m) => memberNames[m.user_id] ?? 'Unknown').join(', ')}
              </span>
            </div>
          )}
        </Card>
      )}

      {/* Confirm a session */}
      <Modal
        open={!!slotToConfirm}
        onClose={() => setSlotToConfirm(null)}
        title="Confirm session"
        size="sm"
      >
        {slotToConfirm && (
          <form onSubmit={handleConfirmSlot} className="space-y-4">
            <div className="p-3 bg-parchment-200/50 rounded-lg">
              <p className="text-sm text-ink-900">
                {formatSlotRange(slotToConfirm.start, slotToConfirm.end, timeZone)}
              </p>
              <p className="text-xs text-ink-500 mt-1">
                {slotToConfirm.available.length} of {members.length} free
                {slotToConfirm.missing.length > 0 &&
                  ` · ${slotToConfirm.missing
                    .map((id) => memberNames[id] ?? 'Unknown')
                    .join(', ')} can't make it`}
              </p>
            </div>
            <Input name="title" label="Title" placeholder="Session 12" defaultValue="" />
            <Textarea name="notes" label="Notes" rows={2} placeholder="Optional — where, what to prep…" />
            <p className="text-xs text-ink-300">
              Players see this in their own timezone.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setSlotToConfirm(null)}>
                Cancel
              </Button>
              <Button type="submit">Confirm session</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* DM grid settings */}
      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Scheduling settings" size="sm">
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <Select
            name="weeks"
            label="Weeks ahead"
            defaultValue={String(weeksAhead)}
            options={[1, 2, 3, 4, 6, 8, 12].map((n) => ({
              value: String(n),
              label: `${n} week${n > 1 ? 's' : ''}`,
            }))}
          />
          <div className="space-y-2">
            <span className="font-display text-sm uppercase tracking-wider text-ink-700">
              Hours shown
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {WINDOW_PRESETS.map((preset) => {
                const active = formStart === preset.start && formEnd === preset.end
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setFormStart(preset.start)
                      setFormEnd(preset.end)
                    }}
                    className={`px-3 py-2 rounded-lg text-sm text-left border transition-colors cursor-pointer ${
                      active
                        ? 'border-gold-400 bg-gold-200/40 text-ink-900'
                        : 'border-parchment-400 text-ink-700 hover:bg-parchment-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Starts"
              value={String(formStart)}
              onChange={(e) => setFormStart(Number(e.target.value))}
              options={hourOptions()}
            />
            <Select
              label="Ends"
              value={String(formEnd % 24)}
              onChange={(e) => {
                const picked = Number(e.target.value)
                // An end at or before the start means the window runs past
                // midnight, except for an exact full day (12 AM to 12 AM).
                setFormEnd(picked <= formStart ? picked + 24 : picked)
              }}
              options={hourOptions()}
            />
          </div>
          <p className="text-xs text-ink-300">
            {formEnd - formStart} hour{formEnd - formStart === 1 ? '' : 's'} per day
            {formEnd > 24 ? ', running past midnight' : ''}. Fewer hours means less for players to
            fill in; all day suits daytime or weekend games. Hours are in your timezone — each
            player's grid is converted to theirs.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!sessionToCancel}
        onClose={() => setSessionToCancel(null)}
        onConfirm={async () => {
          if (sessionToCancel) await onDeleteSession(sessionToCancel)
          setSessionToCancel(null)
        }}
        title="Cancel session"
        message="Remove this scheduled session? Players will no longer see it."
        confirmLabel="Cancel session"
      />
    </div>
  )
}
