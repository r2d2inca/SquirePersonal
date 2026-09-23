/**
 * Scheduling engine for campaign availability.
 *
 * The whole model rests on one rule: availability is stored as absolute
 * instants, never as wall-clock strings. A player paints "Tuesday 7 PM" on a
 * grid rendered in their own zone; we convert that cell to the instant it
 * actually occurs and store that. Everyone else's grid converts the same
 * instant back into their own wall clock. Overlap is then just interval
 * arithmetic on instants, which is timezone-correct by construction.
 *
 * No timezone library — Intl carries the whole IANA database already.
 */

export type AvailabilityStatus = 'available' | 'maybe'

export interface AvailabilityBlock {
  user_id: string
  starts_at: string
  ends_at: string
  status: AvailabilityStatus
  time_zone?: string
}

// ─── Timezone primitives ───

/**
 * How far `timeZone` sits from UTC, in ms, at a given instant.
 * Positive is east of UTC. Derived by formatting the instant in the zone and
 * reading the result back as if it were UTC — the gap between the two is the
 * offset, DST included, because Intl applies the zone's rules for that date.
 */
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant)

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0)

  // Some ICU builds render midnight as hour 24 under hour12: false.
  const hour = read('hour') % 24

  const asIfUtc = Date.UTC(read('year'), read('month') - 1, read('day'), hour, read('minute'), read('second'))
  return asIfUtc - instant.getTime()
}

/**
 * The instant at which a given wall-clock time occurs in `timeZone`.
 *
 * Two passes: the first guesses using the offset at the naive UTC reading, the
 * second re-checks using the offset at the corrected instant. That matters
 * within a day of a DST change, where those two offsets differ — a single pass
 * would land an hour off. Times inside a spring-forward gap (which never occur)
 * resolve to the instant just after the jump.
 */
export function zonedTimeToInstant(
  year: number,
  month: number,
  day: number,
  hour: number,
  timeZone: string,
): Date {
  const naive = Date.UTC(year, month - 1, day, hour, 0, 0)
  const firstPass = naive - zoneOffsetMs(new Date(naive), timeZone)
  const secondPass = naive - zoneOffsetMs(new Date(firstPass), timeZone)
  return new Date(secondPass)
}

export interface ZonedParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  /** 0 = Sunday, matching Date.prototype.getDay. */
  weekday: number
}

/** Break an instant into the wall-clock parts a viewer in `timeZone` sees. */
export function instantToZonedParts(instant: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(instant)

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0)

  const weekdayName = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun'
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour') % 24,
    minute: read('minute'),
    weekday: Math.max(0, weekdays.indexOf(weekdayName)),
  }
}

/** The viewer's own zone, e.g. 'America/New_York'. Falls back to UTC. */
export function detectTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/** Short zone label for a given instant, e.g. 'EDT' or 'GMT+2'. */
export function zoneAbbreviation(instant: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short',
    }).formatToParts(instant)
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
  } catch {
    return ''
  }
}

/**
 * Every IANA zone the runtime knows, for the picker. `supportedValuesOf` is
 * widely available but not universal, so fall back to a short common list.
 */
export function listTimeZones(): string[] {
  const withSupported = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] }
  try {
    const zones = withSupported.supportedValuesOf?.('timeZone')
    if (zones?.length) return zones
  } catch {
    /* fall through */
  }
  return [
    'UTC',
    'America/Los_Angeles',
    'America/Denver',
    'America/Chicago',
    'America/New_York',
    'America/Halifax',
    'America/Sao_Paulo',
    'Europe/London',
    'Europe/Dublin',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Athens',
    'Africa/Johannesburg',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Perth',
    'Australia/Sydney',
    'Pacific/Auckland',
  ]
}

// ─── Grid construction ───

export interface GridDay {
  /** Stable key, the date as seen in the viewer's zone: '2026-09-28'. */
  key: string
  year: number
  month: number
  day: number
  weekday: number
  isToday: boolean
}

export interface GridCell {
  key: string
  dayKey: string
  /** Index into ScheduleGrid.hours. */
  hourIndex: number
  start: Date
  end: Date
  /** True once this hour has already passed — can't offer to play last Tuesday. */
  isPast: boolean
}

export interface ScheduleGrid {
  timeZone: string
  days: GridDay[]
  /** Window hours, which may run past 24 to mean "after midnight": 16..25. */
  hours: number[]
  cells: GridCell[]
  /** cells indexed by `${dayKey}|${hourIndex}` for O(1) lookup while painting. */
  cellsByKey: Map<string, GridCell>
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function dayKeyOf(parts: Pick<ZonedParts, 'year' | 'month' | 'day'>): string {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`
}

export interface GridOptions {
  timeZone: string
  /** First day of the grid page. */
  startDate: Date
  dayCount: number
  dayStartHour: number
  /** Exclusive; may exceed 24 to run past midnight. */
  dayEndHour: number
  now?: Date
}

/**
 * Build one page of the grid. Each cell carries the true instant of that hour
 * in the viewer's zone, so a cell is directly comparable against stored blocks.
 */
export function buildScheduleGrid(options: GridOptions): ScheduleGrid {
  const { timeZone, startDate, dayCount, dayStartHour, dayEndHour } = options
  const now = options.now ?? new Date()

  const hours: number[] = []
  for (let h = dayStartHour; h < dayEndHour; h++) hours.push(h)

  const todayKey = dayKeyOf(instantToZonedParts(now, timeZone))
  const firstDay = instantToZonedParts(startDate, timeZone)

  const days: GridDay[] = []
  const cells: GridCell[] = []
  const cellsByKey = new Map<string, GridCell>()

  for (let d = 0; d < dayCount; d++) {
    // Step through days in UTC on a noon anchor: far enough from either
    // midnight that a DST shift can't roll the date forward or back.
    const anchor = new Date(Date.UTC(firstDay.year, firstDay.month - 1, firstDay.day + d, 12))
    const parts = instantToZonedParts(anchor, 'UTC')
    const key = dayKeyOf(parts)

    days.push({
      key,
      year: parts.year,
      month: parts.month,
      day: parts.day,
      weekday: new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay(),
      isToday: key === todayKey,
    })

    hours.forEach((hour, hourIndex) => {
      // Hours >= 24 belong to the following calendar day: 25 is 1 AM tomorrow.
      const start = zonedTimeToInstant(
        parts.year,
        parts.month,
        parts.day + Math.floor(hour / 24),
        hour % 24,
        timeZone,
      )
      const end = zonedTimeToInstant(
        parts.year,
        parts.month,
        parts.day + Math.floor((hour + 1) / 24),
        (hour + 1) % 24,
        timeZone,
      )
      const cell: GridCell = {
        key: `${key}|${hourIndex}`,
        dayKey: key,
        hourIndex,
        start,
        end,
        isPast: end.getTime() <= now.getTime(),
      }
      cells.push(cell)
      cellsByKey.set(cell.key, cell)
    })
  }

  return { timeZone, days, hours, cells, cellsByKey }
}

/** Midnight (in `timeZone`) of the day `offsetDays` from the day containing `from`. */
export function startOfDayInZone(from: Date, timeZone: string, offsetDays = 0): Date {
  const parts = instantToZonedParts(from, timeZone)
  return zonedTimeToInstant(parts.year, parts.month, parts.day + offsetDays, 0, timeZone)
}

// ─── Painting <-> storage ───

/** Does a stored block cover this cell? Half-open, so blocks can abut cleanly. */
function blockCoversCell(block: AvailabilityBlock, cell: GridCell): boolean {
  const start = new Date(block.starts_at).getTime()
  const end = new Date(block.ends_at).getTime()
  return start <= cell.start.getTime() && end >= cell.end.getTime()
}

/** Project stored blocks onto grid cells, for rendering an existing submission. */
export function blocksToPaintedCells(
  blocks: AvailabilityBlock[],
  grid: ScheduleGrid,
): Map<string, AvailabilityStatus> {
  const painted = new Map<string, AvailabilityStatus>()
  for (const cell of grid.cells) {
    for (const block of blocks) {
      if (blockCoversCell(block, cell)) {
        // 'available' wins over 'maybe' if a player somehow has both.
        if (block.status === 'available' || !painted.has(cell.key)) {
          painted.set(cell.key, block.status)
        }
      }
    }
  }
  return painted
}

export interface CoalescedBlock {
  starts_at: string
  ends_at: string
  status: AvailabilityStatus
}

/**
 * Turn painted cells into as few rows as possible: adjacent hours sharing a
 * status merge into one block. A free evening becomes one row, not five.
 */
export function coalescePaintedCells(
  painted: Map<string, AvailabilityStatus>,
  grid: ScheduleGrid,
): CoalescedBlock[] {
  const marked = grid.cells
    .filter((cell) => painted.has(cell.key))
    .map((cell) => ({ cell, status: painted.get(cell.key)! }))
    .sort((a, b) => a.cell.start.getTime() - b.cell.start.getTime())

  const blocks: CoalescedBlock[] = []
  for (const { cell, status } of marked) {
    const open = blocks[blocks.length - 1]
    const continues =
      open && open.status === status && new Date(open.ends_at).getTime() === cell.start.getTime()

    if (continues) {
      open.ends_at = cell.end.toISOString()
    } else {
      blocks.push({
        starts_at: cell.start.toISOString(),
        ends_at: cell.end.toISOString(),
        status,
      })
    }
  }
  return blocks
}

// ─── Overlap ───

export interface CellOverlap {
  available: string[]
  maybe: string[]
}

/**
 * Who is free for each cell. Counts distinct users, so overlapping blocks from
 * one player can't inflate a slot.
 */
export function computeOverlap(
  blocks: AvailabilityBlock[],
  grid: ScheduleGrid,
): Map<string, CellOverlap> {
  const overlap = new Map<string, CellOverlap>()

  for (const cell of grid.cells) {
    const available = new Set<string>()
    const maybe = new Set<string>()

    for (const block of blocks) {
      if (!blockCoversCell(block, cell)) continue
      if (block.status === 'available') available.add(block.user_id)
      else maybe.add(block.user_id)
    }

    // A firm yes outranks a maybe from the same player.
    for (const id of available) maybe.delete(id)
    overlap.set(cell.key, { available: [...available], maybe: [...maybe] })
  }

  return overlap
}

export interface BestSlot {
  start: Date
  end: Date
  hours: number
  /** Users free for every hour of the run. */
  available: string[]
  maybe: string[]
  /** Members with no availability covering the whole run. */
  missing: string[]
}

export interface BestSlotOptions {
  /** Members whose attendance matters — usually everyone but the DM. */
  memberIds: string[]
  minHours?: number
  limit?: number
}

/**
 * Rank the best candidate sessions: runs of consecutive hours, scored by how
 * many players are free for the *whole* run, then by how long it is.
 *
 * Runs are grown per day so a session can't span a gap in the day window, and
 * a player only counts if they're free across every hour — being free for hour
 * one of a three-hour slot is no use to you.
 */
export function rankBestSlots(
  grid: ScheduleGrid,
  overlap: Map<string, CellOverlap>,
  options: BestSlotOptions,
): BestSlot[] {
  const { memberIds, minHours = 2, limit = 5 } = options
  const slots: BestSlot[] = []

  for (const day of grid.days) {
    const dayCells = grid.cells
      .filter((c) => c.dayKey === day.key && !c.isPast)
      .sort((a, b) => a.hourIndex - b.hourIndex)

    for (let i = 0; i < dayCells.length; i++) {
      let available = new Set(overlap.get(dayCells[i].key)?.available ?? [])
      let maybe = new Set(overlap.get(dayCells[i].key)?.maybe ?? [])

      for (let j = i; j < dayCells.length; j++) {
        if (j > i) {
          // Runs must be contiguous in both grid position and real time — the
          // latter guards the hour either side of a DST change.
          if (dayCells[j].hourIndex !== dayCells[j - 1].hourIndex + 1) break
          if (dayCells[j].start.getTime() !== dayCells[j - 1].end.getTime()) break

          const cell = overlap.get(dayCells[j].key)
          const stillAvailable = new Set(cell?.available ?? [])
          const stillMaybe = new Set([...(cell?.available ?? []), ...(cell?.maybe ?? [])])
          available = new Set([...available].filter((id) => stillAvailable.has(id)))
          maybe = new Set([...maybe].filter((id) => stillMaybe.has(id)))
        }

        const hours = j - i + 1
        if (hours < minHours) continue
        if (available.size === 0) continue

        const availableIds = [...available]
        const maybeIds = [...maybe].filter((id) => !available.has(id))
        slots.push({
          start: dayCells[i].start,
          end: dayCells[j].end,
          hours,
          available: availableIds,
          maybe: maybeIds,
          missing: memberIds.filter((id) => !available.has(id) && !maybe.has(id)),
        })
      }
    }
  }

  // Most confirmed players first, then the longest run. Duration outranks
  // "maybe" count deliberately: ranking maybes higher would collapse every
  // suggestion to the minHours minimum whenever one player is a maybe, hiding
  // how long the party could actually play. Per-hour maybes stay visible on the
  // heatmap regardless.
  slots.sort(
    (a, b) =>
      b.available.length - a.available.length ||
      b.hours - a.hours ||
      b.maybe.length - a.maybe.length ||
      a.start.getTime() - b.start.getTime(),
  )

  // One entry per start time: keep the longest/best run from each, so the list
  // isn't five variations on the same Tuesday evening.
  const seen = new Set<number>()
  const deduped: BestSlot[] = []
  for (const slot of slots) {
    if (seen.has(slot.start.getTime())) continue
    seen.add(slot.start.getTime())
    deduped.push(slot)
    if (deduped.length >= limit) break
  }
  return deduped
}

// ─── Formatting ───

export function formatHourLabel(hour: number): string {
  const h = hour % 24
  const suffix = h < 12 ? 'AM' : 'PM'
  const display = h % 12 === 0 ? 12 : h % 12
  return `${display} ${suffix}`
}

export function formatDayHeading(day: GridDay): { weekday: string; date: string } {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return { weekday: weekdays[day.weekday], date: `${months[day.month - 1]} ${day.day}` }
}

/** e.g. 'Tue, Sep 29 · 7:00 – 10:00 PM EDT' */
export function formatSlotRange(start: Date, end: Date, timeZone: string): string {
  const date = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(start)

  const time = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  })
  const zone = zoneAbbreviation(start, timeZone)
  return `${date} · ${time.format(start)} – ${time.format(end)}${zone ? ` ${zone}` : ''}`
}
