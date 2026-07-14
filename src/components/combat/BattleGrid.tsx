import { useState, useRef, useCallback, useEffect } from 'react'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import type { EncounterCombatant } from '@/lib/types/database'
import { creatureSizeCells } from '@/lib/types/database'

const ZOOM_LEVELS = [28, 40, 54]

interface DragRender {
  combatantId: string
  pixelX: number
  pixelY: number
  snapX: number
  snapY: number
}

interface BattleGridProps {
  width: number
  height: number
  combatants: EncounterCombatant[]
  mapImageUrl: string | null
  currentTurnId: string | null
  selectedId: string | null
  userId: string
  isDM: boolean
  onSelectCombatant: (id: string | null) => void
  onMoveCombatant: (id: string, x: number, y: number) => void
}

export function BattleGrid({
  width,
  height,
  combatants,
  mapImageUrl,
  currentTurnId,
  selectedId,
  userId,
  isDM,
  onSelectCombatant,
  onMoveCombatant,
}: BattleGridProps) {
  const [zoomIdx, setZoomIdx] = useState(1)
  const cellSize = ZOOM_LEVELS[zoomIdx]
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // ─── Local positions: single source of truth for WHERE tokens render ───
  // Initialized from combatants, updated on drag-drop, synced from server for new combatants
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(() => {
    const map = new Map<string, { x: number; y: number }>()
    for (const c of combatants) {
      if (c.grid_x != null && c.grid_y != null) {
        map.set(c.id, { x: c.grid_x, y: c.grid_y })
      }
    }
    return map
  })

  // Sync: add new combatants, remove deleted ones, DON'T overwrite positions we've locally moved
  const knownIdsRef = useRef(new Set<string>())
  useEffect(() => {
    const serverIds = new Set(combatants.map((c) => c.id))
    setPositions((prev) => {
      const next = new Map(prev)
      let changed = false

      // Add any NEW combatants we haven't seen before
      for (const c of combatants) {
        if (c.grid_x != null && c.grid_y != null && !knownIdsRef.current.has(c.id)) {
          next.set(c.id, { x: c.grid_x, y: c.grid_y })
          changed = true
        }
      }

      // Remove combatants that no longer exist
      for (const id of prev.keys()) {
        if (!serverIds.has(id)) {
          next.delete(id)
          changed = true
        }
      }

      knownIdsRef.current = serverIds
      return changed ? next : prev
    })
  }, [combatants])

  // Build render map: "x,y" -> combatant (using local positions for placement)
  const positionMap = new Map<string, EncounterCombatant>()
  for (const c of combatants) {
    const pos = positions.get(c.id)
    if (pos) {
      positionMap.set(`${pos.x},${pos.y}`, { ...c, grid_x: pos.x, grid_y: pos.y })
    }
  }

  // ─── Drag-and-drop ───
  const [drag, setDrag] = useState<DragRender | null>(null)

  const dragInfoRef = useRef<{
    combatantId: string
    startGridX: number
    startGridY: number
  } | null>(null)

  // Refs for stable access in document listeners
  const positionMapRef = useRef(positionMap)
  positionMapRef.current = positionMap
  const cellSizeRef = useRef(cellSize)
  cellSizeRef.current = cellSize
  const widthRef = useRef(width)
  widthRef.current = width
  const heightRef = useRef(height)
  heightRef.current = height
  const onMoveCombatantRef = useRef(onMoveCombatant)
  onMoveCombatantRef.current = onMoveCombatant
  const onSelectCombatantRef = useRef(onSelectCombatant)
  onSelectCombatantRef.current = onSelectCombatant
  const selectedIdRef = useRef(selectedId)
  selectedIdRef.current = selectedId

  function canMoveToken(combatant: EncounterCombatant): boolean {
    if (isDM) return true
    return combatant.user_id === userId && combatant.id === currentTurnId
  }

  function getGridPixels(e: PointerEvent | React.PointerEvent): { px: number; py: number } | null {
    const grid = gridRef.current
    if (!grid) return null
    const rect = grid.getBoundingClientRect()
    return { px: e.clientX - rect.left, py: e.clientY - rect.top }
  }

  function toGridCoords(px: number, py: number, w: number, h: number, cs: number) {
    return {
      gx: Math.max(0, Math.min(w - 1, Math.floor(px / cs))),
      gy: Math.max(0, Math.min(h - 1, Math.floor(py / cs))),
    }
  }

  useEffect(() => {
    if (!drag) return

    function handleMove(e: PointerEvent) {
      if (!dragInfoRef.current) return
      e.preventDefault()
      const pos = getGridPixels(e)
      if (!pos) return
      const cs = cellSizeRef.current
      const { gx, gy } = toGridCoords(pos.px, pos.py, widthRef.current, heightRef.current, cs)

      setDrag((prev) => {
        if (!prev) return prev
        return { ...prev, pixelX: pos.px, pixelY: pos.py, snapX: gx, snapY: gy }
      })
    }

    function handleUp(e: PointerEvent) {
      const info = dragInfoRef.current
      if (!info) return
      e.preventDefault()

      const pos = getGridPixels(e)
      const cs = cellSizeRef.current
      const { gx, gy } = pos
        ? toGridCoords(pos.px, pos.py, widthRef.current, heightRef.current, cs)
        : { gx: info.startGridX, gy: info.startGridY }

      const isTap = gx === info.startGridX && gy === info.startGridY

      if (isTap) {
        const sid = selectedIdRef.current
        onSelectCombatantRef.current(info.combatantId === sid ? null : info.combatantId)
      } else {
        const dropKey = `${gx},${gy}`
        const occupant = positionMapRef.current.get(dropKey)
        const canDrop = !occupant || occupant.id === info.combatantId

        if (canDrop) {
          // Update local positions immediately — this is the source of truth for rendering
          setPositions((prev) => {
            const next = new Map(prev)
            next.set(info.combatantId, { x: gx, y: gy })
            return next
          })
          // Persist to server (fire and forget)
          onMoveCombatantRef.current(info.combatantId, gx, gy)
        }
      }

      dragInfoRef.current = null
      setDrag(null)
    }

    document.addEventListener('pointermove', handleMove, { passive: false })
    document.addEventListener('pointerup', handleUp)
    document.addEventListener('pointercancel', handleUp)

    return () => {
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleUp)
      document.removeEventListener('pointercancel', handleUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag?.combatantId])

  function handlePointerDown(e: React.PointerEvent, x: number, y: number) {
    if (e.button !== 0) return
    const occupant = positionMap.get(`${x},${y}`)

    if (!occupant || !canMoveToken(occupant)) {
      if (occupant) {
        onSelectCombatant(occupant.id === selectedId ? null : occupant.id)
      }
      return
    }

    e.preventDefault()
    e.stopPropagation()

    const pos = getGridPixels(e)
    if (!pos) return

    dragInfoRef.current = {
      combatantId: occupant.id,
      startGridX: x,
      startGridY: y,
    }

    setDrag({
      combatantId: occupant.id,
      pixelX: pos.px,
      pixelY: pos.py,
      snapX: x,
      snapY: y,
    })
  }

  // ─── Zoom ───
  const zoomIn = useCallback(() => setZoomIdx((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1)), [])
  const zoomOut = useCallback(() => setZoomIdx((i) => Math.max(0, i - 1)), [])
  const resetZoom = useCallback(() => setZoomIdx(1), [])

  useEffect(() => {
    if (!currentTurnId || !containerRef.current) return
    const pos = positions.get(currentTurnId)
    if (!pos) return

    const el = containerRef.current
    const targetX = pos.x * cellSize - el.clientWidth / 2 + cellSize / 2
    const targetY = pos.y * cellSize - el.clientHeight / 2 + cellSize / 2
    el.scrollTo({ left: targetX, top: targetY, behavior: 'smooth' })
  }, [currentTurnId, cellSize, positions])

  const draggedCombatant = drag ? combatants.find((c) => c.id === drag.combatantId) : null

  const isSnapValid = drag
    ? (() => {
        const occupant = positionMap.get(`${drag.snapX},${drag.snapY}`)
        return !occupant || occupant.id === drag.combatantId
      })()
    : false

  const dragTokenSizeCells = draggedCombatant ? creatureSizeCells(draggedCombatant.size || 'Medium') : 1
  const dragTokenSize = cellSize * dragTokenSizeCells * 0.8

  return (
    <div className="relative border border-parchment-400 rounded-lg overflow-hidden bg-parchment-200">
      {/* Zoom Controls */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-parchment-100/90 rounded-lg border border-parchment-300 p-1">
        <button onClick={zoomOut} className="p-1 text-ink-500 hover:text-ink-900 cursor-pointer" title="Zoom out">
          <ZoomOut size={16} />
        </button>
        <button onClick={resetZoom} className="p-1 text-ink-500 hover:text-ink-900 cursor-pointer" title="Reset zoom">
          <Maximize2 size={16} />
        </button>
        <button onClick={zoomIn} className="p-1 text-ink-500 hover:text-ink-900 cursor-pointer" title="Zoom in">
          <ZoomIn size={16} />
        </button>
      </div>

      {/* Grid Container */}
      <div
        ref={containerRef}
        className="overflow-auto"
        style={{
          maxHeight: '60vh',
          touchAction: drag ? 'none' : undefined,
          userSelect: 'none',
        }}
      >
        <div
          ref={gridRef}
          className="relative"
          style={{
            width: width * cellSize,
            height: height * cellSize,
          }}
        >
          {/* Background Map Image */}
          {mapImageUrl && (
            <img
              src={mapImageUrl}
              alt="Battle map"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              draggable={false}
            />
          )}

          {/* Grid Cells */}
          <div
            className="relative grid"
            style={{
              gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
            }}
          >
            {Array.from({ length: height }).map((_, y) =>
              Array.from({ length: width }).map((_, x) => {
                const occupant = positionMap.get(`${x},${y}`)
                const isDragging = drag?.combatantId === occupant?.id
                const isSelected = occupant?.id === selectedId && !isDragging
                const isCurrentTurn = occupant?.id === currentTurnId

                return (
                  <div
                    key={`${x},${y}`}
                    onPointerDown={(e) => handlePointerDown(e, x, y)}
                    className={`relative border border-parchment-400/30 transition-colors ${
                      occupant ? 'cursor-grab' : ''
                    }`}
                    style={{ width: cellSize, height: cellSize }}
                  >
                    {occupant && !isDragging && (
                      <Token
                        combatant={occupant}
                        cellSize={cellSize}
                        isSelected={isSelected}
                        isCurrentTurn={isCurrentTurn}
                        isDM={isDM}
                      />
                    )}
                    {occupant && isDragging && (
                      <Token
                        combatant={occupant}
                        cellSize={cellSize}
                        isSelected={false}
                        isCurrentTurn={isCurrentTurn}
                        isDM={isDM}
                        opacity={0.25}
                      />
                    )}
                  </div>
                )
              }),
            )}
          </div>

          {/* Snap cell highlight */}
          {drag && (
            <div
              className="absolute pointer-events-none rounded-sm"
              style={{
                width: cellSize,
                height: cellSize,
                left: drag.snapX * cellSize,
                top: drag.snapY * cellSize,
                backgroundColor: isSnapValid
                  ? 'rgba(74, 158, 101, 0.3)'
                  : 'rgba(196, 64, 64, 0.3)',
                border: isSnapValid
                  ? '2px solid rgba(74, 158, 101, 0.7)'
                  : '2px solid rgba(196, 64, 64, 0.7)',
                zIndex: 20,
              }}
            />
          )}

          {/* Floating dragged token */}
          {drag && draggedCombatant && (
            <div
              className="absolute pointer-events-none"
              style={{
                width: dragTokenSize,
                height: dragTokenSize,
                left: drag.pixelX - dragTokenSize / 2,
                top: drag.pixelY - dragTokenSize / 2,
                zIndex: 30,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
                transform: 'scale(1.15)',
              }}
            >
              <Token
                combatant={draggedCombatant}
                cellSize={cellSize}
                isSelected={false}
                isCurrentTurn={false}
                isDM={isDM}
                floating
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// --- Token Component ---

interface TokenProps {
  combatant: EncounterCombatant
  cellSize: number
  isSelected: boolean
  isCurrentTurn: boolean
  isDM: boolean
  opacity?: number
  floating?: boolean
}

function Token({ combatant, cellSize, isSelected, isCurrentTurn, isDM, opacity, floating }: TokenProps) {
  const initials = combatant.name.slice(0, 2).toUpperCase()
  const borderColor = combatant.is_player ? 'border-gold-400' : 'border-red-500'
  const hpPercent = combatant.max_hp > 0 ? (combatant.current_hp / combatant.max_hp) * 100 : 100
  const sizeCells = creatureSizeCells(combatant.size || 'Medium')
  const tokenSize = cellSize * sizeCells * 0.8
  const fontSize = tokenSize < 28 ? 8 : tokenSize < 40 ? 10 : 12

  const hpColor =
    hpPercent > 50 ? 'rgba(74, 158, 101, 0.8)' :
    hpPercent > 25 ? 'rgba(184, 134, 11, 0.8)' :
    'rgba(196, 64, 64, 0.8)'

  return (
    <div
      className={`${floating ? '' : 'absolute'} flex items-center justify-center`}
      style={{
        width: tokenSize,
        height: tokenSize,
        top: floating ? 0 : (cellSize * sizeCells - tokenSize) / 2,
        left: floating ? 0 : (cellSize * sizeCells - tokenSize) / 2,
        opacity: opacity ?? 1,
        zIndex: sizeCells > 1 ? 5 : undefined,
      }}
    >
      <div
        className={`w-full h-full rounded-full border-2 ${borderColor} flex items-center justify-center relative ${
          isCurrentTurn ? 'animate-pulse' : ''
        } ${isSelected ? 'ring-2 ring-gold-400 ring-offset-1' : ''}`}
        style={{ backgroundColor: combatant.token_color }}
        title={`${combatant.name}${isDM || combatant.is_player ? ` (HP: ${combatant.current_hp}/${combatant.max_hp})` : ''} AC: ${combatant.armor_class}`}
      >
        <span
          className="font-display font-bold text-white select-none"
          style={{
            fontSize,
            textShadow: '0 1px 2px rgba(0,0,0,0.7)',
          }}
        >
          {initials}
        </span>

        {/* HP indicator ring (bottom) */}
        <div
          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded-full"
          style={{
            width: tokenSize * 0.6,
            height: 3,
            backgroundColor: hpColor,
          }}
        />
      </div>

      {/* Condition dots */}
      {combatant.conditions.length > 0 && (
        <div className="absolute -top-1 -right-1 flex gap-px">
          {combatant.conditions.slice(0, 3).map((cond) => (
            <div
              key={cond}
              className="w-2 h-2 rounded-full bg-arcane-400 border border-parchment-100"
              title={cond}
            />
          ))}
          {combatant.conditions.length > 3 && (
            <span className="text-[8px] text-arcane-400 font-bold">+{combatant.conditions.length - 3}</span>
          )}
        </div>
      )}
    </div>
  )
}
