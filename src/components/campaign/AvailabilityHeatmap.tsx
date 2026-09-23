import {
  formatDayHeading,
  formatHourLabel,
  type CellOverlap,
  type ScheduleGrid,
} from '@/lib/scheduling'

interface AvailabilityHeatmapProps {
  grid: ScheduleGrid
  overlap: Map<string, CellOverlap>
  /** Members whose attendance is being counted — the denominator. */
  memberCount: number
  memberNames: Record<string, string>
  onPickSlot?: (cellKey: string) => void
}

/**
 * Heat by share of the party free, not by raw count, so the colours mean the
 * same thing in a party of three and a party of six.
 */
function heatClass(free: number, maybe: number, total: number): string {
  if (total === 0 || free + maybe === 0) return 'bg-parchment-200/50'
  const ratio = free / total
  if (ratio >= 1) return 'bg-heal/80 text-parchment-50'
  if (ratio >= 0.75) return 'bg-heal/55'
  if (ratio >= 0.5) return 'bg-heal/35'
  if (free > 0) return 'bg-heal/20'
  return 'bg-gold-200/60'
}

export function AvailabilityHeatmap({
  grid,
  overlap,
  memberCount,
  memberNames,
  onPickSlot,
}: AvailabilityHeatmapProps) {
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="min-w-[34rem]">
        <div className="grid" style={{ gridTemplateColumns: `3.5rem repeat(${grid.days.length}, 1fr)` }}>
          <div />
          {grid.days.map((day) => {
            const { weekday, date } = formatDayHeading(day)
            return (
              <div key={day.key} className="pb-1.5 text-center">
                <div
                  className={`font-display text-xs uppercase tracking-wider ${
                    day.isToday ? 'text-gold-600' : 'text-ink-500'
                  }`}
                >
                  {weekday}
                </div>
                <div className={`text-xs ${day.isToday ? 'text-gold-600 font-semibold' : 'text-ink-300'}`}>
                  {date}
                </div>
              </div>
            )
          })}
        </div>

        {grid.hours.map((hour, hourIndex) => (
          <div
            key={hour}
            className="grid gap-px"
            style={{ gridTemplateColumns: `3.5rem repeat(${grid.days.length}, 1fr)` }}
          >
            <div className="pr-2 text-right text-xs text-ink-300 leading-7 font-mono">
              {formatHourLabel(hour)}
            </div>
            {grid.days.map((day) => {
              const cellKey = `${day.key}|${hourIndex}`
              const cell = grid.cellsByKey.get(cellKey)
              const counts = overlap.get(cellKey)
              if (!cell) return <div key={cellKey} />

              const free = counts?.available.length ?? 0
              const maybe = counts?.maybe.length ?? 0
              const names = [
                ...(counts?.available ?? []).map((id) => memberNames[id] ?? 'Unknown'),
                ...(counts?.maybe ?? []).map((id) => `${memberNames[id] ?? 'Unknown'} (maybe)`),
              ]

              return (
                <button
                  key={cellKey}
                  type="button"
                  disabled={cell.isPast || !onPickSlot}
                  onClick={() => onPickSlot?.(cellKey)}
                  title={names.length ? names.join(', ') : 'Nobody free'}
                  className={`h-7 mb-px border border-parchment-400/40 rounded-[3px] text-[10px] font-mono leading-7 text-center transition-colors ${
                    cell.isPast ? 'bg-parchment-200/30 text-ink-300/50' : heatClass(free, maybe, memberCount)
                  } ${onPickSlot && !cell.isPast ? 'cursor-pointer hover:ring-1 hover:ring-gold-400' : ''}`}
                >
                  {free > 0 || maybe > 0 ? `${free}${maybe ? `+${maybe}` : ''}` : ''}
                </button>
              )
            })}
          </div>
        ))}

        <div className="flex items-center gap-4 mt-3 text-xs text-ink-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[3px] bg-heal/80 border border-parchment-400/40" />
            Everyone free
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[3px] bg-heal/35 border border-parchment-400/40" />
            Some free
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[3px] bg-gold-200/60 border border-parchment-400/40" />
            Only maybes
          </span>
          <span className="text-ink-300">Numbers are free + maybe. Hover for names.</span>
        </div>
      </div>
    </div>
  )
}
