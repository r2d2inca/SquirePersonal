import { useState } from 'react'
import { Dices, X, Trash2 } from 'lucide-react'
import { useDiceStore, describeRoll, type DiceRoll } from '@/stores/diceStore'
import { playSound } from '@/lib/sound'

const DICE = [
  { label: 'd4', sides: 4 },
  { label: 'd6', sides: 6 },
  { label: 'd8', sides: 8 },
  { label: 'd10', sides: 10 },
  { label: 'd12', sides: 12 },
  { label: 'd20', sides: 20 },
  { label: 'd100', sides: 100 },
]

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1
}

export function DiceRoller() {
  // lastRoll lives in the store, not local state, so rolls fired from the character
  // sheet (via rollCheck) show up in this panel too.
  const { isOpen, toggleOpen, history, addRoll, clearHistory, lastRoll } = useDiceStore()
  const [modifierStr, setModifierStr] = useState('')
  const [countStr, setCountStr] = useState('')
  const modifier = parseInt(modifierStr) || 0
  const count = Math.min(100, Math.max(1, parseInt(countStr) || 1))

  function handleRoll(sides: number, label: string) {
    const rolls = Array.from({ length: count }, () => rollDie(sides))
    const total = rolls.reduce((sum, r) => sum + r, 0) + modifier
    const roll: DiceRoll = {
      id: crypto.randomUUID(),
      die: label,
      count,
      modifier,
      rolls,
      total,
      timestamp: Date.now(),
    }
    addRoll(roll)

    playSound('diceRoll')
    if (sides === 20 && count === 1) {
      if (rolls[0] === 20) playSound('critSuccess')
      else if (rolls[0] === 1) playSound('critFail')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-20 right-4 md:bottom-4 md:right-4 w-80 bg-parchment-100 border border-parchment-400 rounded-2xl shadow-[var(--shadow-lg)] z-50 flex flex-col max-h-[70vh] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-parchment-300">
        <div className="flex items-center gap-2">
          <Dices size={18} className="text-gold-500" />
          <span className="font-display text-sm text-ink-900">Dice Roller</span>
        </div>
        <button onClick={toggleOpen} className="p-1 text-ink-300 hover:text-ink-700 cursor-pointer">
          <X size={16} />
        </button>
      </div>

      {/* Last Roll Result */}
      {lastRoll && (
        <div className="px-3 py-2 bg-gold-100 border-b border-parchment-300 text-center">
          <div className="font-mono text-2xl font-bold text-ink-900">{lastRoll.total}</div>
          <div className="text-xs text-ink-500">
            {describeRoll(lastRoll)}
            {lastRoll.modifier !== 0 && (lastRoll.modifier > 0 ? ` + ${lastRoll.modifier}` : ` - ${Math.abs(lastRoll.modifier)}`)}
            {lastRoll.rolls.length > 1 && ` [${lastRoll.rolls.join(', ')}]`}
          </div>
        </div>
      )}

      {/* Dice Buttons */}
      <div className="p-3 space-y-3">
        <div className="grid grid-cols-4 gap-2">
          {DICE.map(({ label, sides }) => (
            <button
              key={label}
              onClick={() => handleRoll(sides, label)}
              className="px-2 py-2 bg-leather-800 text-gold-400 rounded-lg font-display text-sm hover:bg-leather-700 transition-colors cursor-pointer"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Count & Modifier */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <label className="text-xs font-display text-ink-500">Count</label>
            <input
              type="number"
              min={1}
              max={100}
              value={countStr}
              onChange={(e) => setCountStr(e.target.value)}
              className="w-14 text-center font-mono text-sm border border-parchment-400 rounded py-1 bg-parchment-50 text-ink-900"
              placeholder="1"
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs font-display text-ink-500">Modifier</label>
            <input
              type="number"
              value={modifierStr}
              onChange={(e) => setModifierStr(e.target.value)}
              className="w-14 text-center font-mono text-sm border border-parchment-400 rounded py-1 bg-parchment-50 text-ink-900"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Roll History */}
      {history.length > 0 && (
        <div className="border-t border-parchment-300 flex-1 overflow-y-auto min-h-0">
          <div className="flex items-center justify-between px-3 pt-2">
            <span className="text-xs font-display text-ink-400 uppercase">History</span>
            <button onClick={clearHistory} className="p-1 text-ink-300 hover:text-danger cursor-pointer">
              <Trash2 size={12} />
            </button>
          </div>
          <div className="px-3 pb-2 space-y-1 mt-1">
            {history.slice(0, 10).map((roll) => (
              <div key={roll.id} className="flex items-center justify-between text-xs py-1 border-b border-parchment-200 last:border-0">
                <span className="text-ink-500 truncate mr-2">
                  {describeRoll(roll)}
                  {roll.modifier !== 0 && (roll.modifier > 0 ? `+${roll.modifier}` : roll.modifier)}
                </span>
                <span className="font-mono font-bold text-ink-900">{roll.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function DiceRollerTrigger() {
  const toggleOpen = useDiceStore((s) => s.toggleOpen)
  return (
    <button
      onClick={toggleOpen}
      className="p-2 text-parchment-400 hover:text-gold-400 transition-colors cursor-pointer"
      title="Dice Roller"
    >
      <Dices size={20} />
    </button>
  )
}
