import { useCallback, useEffect, useRef, useState } from 'react'
import {
  formatDayHeading,
  formatHourLabel,
  type AvailabilityStatus,
  type ScheduleGrid,
} from '@/lib/scheduling'

export type PaintMode = AvailabilityStatus | 'busy'

interface AvailabilityGridProps {
  grid: ScheduleGrid
  painted: Map<string, AvailabilityStatus>
  mode: PaintMode
  onChange: (next: Map<string, AvailabilityStatus>) => void
}

const CELL_STYLES: Record<AvailabilityStatus | 'busy', string> = {
  available: 'bg-heal/70 hover:bg-heal/80',
  maybe: 'bg-gold-300 hover:bg-gold-400',
  busy: 'bg-parchment-200 hover:bg-parchment-300',
}

/**
 * Click or drag to paint availability across a week.
 *
 * Pointer events (not mouse) so the same code path handles finger-drag on a
 * phone; the grid sets touch-action: none so a drag paints instead of scrolling
 * the page. Pointer capture on the container keeps the stroke alive even if the
 * finger slides off the edge mid-drag.
 */
export function AvailabilityGrid({ grid, painted, mode, onChange }: AvailabilityGridProps) {
  const [isPainting, setIsPainting] = useState(false)
  // Held in a ref as well as state: a fast drag fires several pointer events in
  // one frame, and each needs to see the previous cell's write.
  const workingRef = useRef(painted)

  useEffect(() => {
    workingRef.current = painted
  }, [painted])

  const paintCell = useCallback(
    (cellKey: string, isPast: boolean) => {
      if (isPast) return
      const current = workingRef.current.get(cellKey)
      const target = mode === 'busy' ? undefined : mode
      if (current === target) return

      const next = new Map(workingRef.current)
      if (target === undefined) next.delete(cellKey)
      else next.set(cellKey, target)

      workingRef.current = next
      onChange(next)
    },
    [mode, onChange],
  )

  /**
   * Paint a whole row or column at once — essential once the window is a full
   * 24 hours, where cell-by-cell would be 168 taps. Toggles: if every paintable
   * cell in the run already matches the current mode, the run is cleared
   * instead, so the same click undoes it.
   */
  const paintRun = useCallback(
    (cellKeys: string[]) => {
      const paintable = cellKeys.filter((key) => !grid.cellsByKey.get(key)?.isPast)
      if (paintable.length === 0) return

      const target = mode === 'busy' ? undefined : mode
      const allMatch = paintable.every((key) => workingRef.current.get(key) === target)

      const next = new Map(workingRef.current)
      for (const key of paintable) {
        if (target === undefined || allMatch) next.delete(key)
        else next.set(key, target)
      }
      workingRef.current = next
      onChange(next)
    },
    [grid, mode, onChange],
  )

  const endPainting = useCallback(() => setIsPainting(false), [])

  useEffect(() => {
    if (!isPainting) return
    window.addEventListener('pointerup', endPainting)
    window.addEventListener('pointercancel', endPainting)
    return () => {
      window.removeEventListener('pointerup', endPainting)
      window.removeEventListener('pointercancel', endPainting)
    }
  }, [isPainting, endPainting])

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="min-w-[34rem] select-none" style={{ touchAction: 'none' }}>
        {/* Day headings */}
        <div className="grid" style={{ gridTemplateColumns: `3.5rem repeat(${grid.days.length}, 1fr)` }}>
          <div />
          {grid.days.map((day) => {
            const { weekday, date } = formatDayHeading(day)
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => paintRun(grid.hours.map((_, i) => `${day.key}|${i}`))}
                title={`Paint all of ${weekday} ${date}`}
                className="pb-1.5 text-center cursor-pointer rounded hover:bg-parchment-200/60 transition-colors"
              >
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
              </button>
            )
          })}
        </div>

        {/* Hour rows */}
        {grid.hours.map((hour, hourIndex) => (
          <div
            key={hour}
            className="grid gap-px"
            style={{ gridTemplateColumns: `3.5rem repeat(${grid.days.length}, 1fr)` }}
          >
            <button
              type="button"
              onClick={() => paintRun(grid.days.map((d) => `${d.key}|${hourIndex}`))}
              title={`Paint ${formatHourLabel(hour)} across the week`}
              className="pr-2 text-right text-xs text-ink-300 leading-7 font-mono cursor-pointer rounded hover:bg-parchment-200/60 hover:text-ink-700 transition-colors"
            >
              {formatHourLabel(hour)}
            </button>
            {grid.days.map((day) => {
              const cellKey = `${day.key}|${hourIndex}`
              const cell = grid.cellsByKey.get(cellKey)
              if (!cell) return <div key={cellKey} />

              const status = painted.get(cellKey)
              const style = cell.isPast
                ? 'bg-parchment-200/40 cursor-not-allowed'
                : `${CELL_STYLES[status ?? 'busy']} cursor-pointer`

              return (
                <button
                  key={cellKey}
                  type="button"
                  disabled={cell.isPast}
                  aria-label={`${formatDayHeading(day).weekday} ${formatHourLabel(hour)} — ${
                    status ?? 'busy'
                  }`}
                  aria-pressed={!!status}
                  className={`h-7 mb-px border border-parchment-400/40 rounded-[3px] transition-colors ${style}`}
                  onPointerDown={(e) => {
                    if (cell.isPast) return
                    e.currentTarget.releasePointerCapture?.(e.pointerId)
                    setIsPainting(true)
                    paintCell(cellKey, cell.isPast)
                  }}
                  onPointerEnter={() => {
                    if (isPainting) paintCell(cellKey, cell.isPast)
                  }}
                  // Keyboard users toggle a cell rather than dragging a run.
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      paintCell(cellKey, cell.isPast)
                    }
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
