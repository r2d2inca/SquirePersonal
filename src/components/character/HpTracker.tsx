import { useState } from 'react'
import { Heart, Plus, Minus, Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface HpTrackerProps {
  currentHp: number
  maxHp: number
  tempHp: number
  onUpdate: (updates: { current_hp?: number; temp_hp?: number }) => void
  onDamageTaken?: (amount: number) => void
}

export function HpTracker({ currentHp, maxHp, tempHp, onUpdate, onDamageTaken }: HpTrackerProps) {
  const [amountStr, setAmountStr] = useState('')
  const amount = parseInt(amountStr) || 0

  function takeDamage() {
    if (!amount) return
    let remaining = amount
    if (tempHp > 0) {
      const absorbed = Math.min(tempHp, remaining)
      remaining -= absorbed
      onUpdate({ temp_hp: tempHp - absorbed, current_hp: Math.max(0, currentHp - remaining) })
    } else {
      onUpdate({ current_hp: Math.max(0, currentHp - remaining) })
    }
    onDamageTaken?.(amount)
  }

  function heal() {
    if (!amount) return
    onUpdate({ current_hp: Math.min(maxHp, currentHp + amount) })
  }

  function addTempHp() {
    if (!amount) return
    onUpdate({ temp_hp: Math.max(tempHp, amount) })
  }

  const hpPercent = maxHp > 0 ? Math.max(0, (currentHp / maxHp) * 100) : 0
  const barColor =
    hpPercent > 50 ? 'bg-heal' : hpPercent > 25 ? 'bg-[#b8860b]' : 'bg-danger'

  return (
    <div className="space-y-3">
      {/* HP Bar */}
      <div className="relative h-6 bg-parchment-300 rounded-full overflow-hidden border border-parchment-400">
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${hpPercent}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-ink-900">
          {currentHp} / {maxHp}
          {tempHp > 0 && <span className="text-temphp font-semibold ml-1">+{tempHp}</span>}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center border border-parchment-400 rounded-lg overflow-hidden bg-parchment-50">
          <button
            onClick={() => setAmountStr(String(Math.max(1, amount - 1)))}
            className="px-2 py-1 hover:bg-parchment-200 transition-colors cursor-pointer"
          >
            <Minus size={14} />
          </button>
          <input
            type="number"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            className="w-14 text-center font-mono text-sm border-x border-parchment-400 py-1 bg-parchment-50 text-ink-900"
            min={1}
            placeholder="0"
          />
          <button
            onClick={() => setAmountStr(String(amount + 1))}
            className="px-2 py-1 hover:bg-parchment-200 transition-colors cursor-pointer"
          >
            <Plus size={14} />
          </button>
        </div>

        <Button variant="danger" size="sm" onClick={takeDamage}>
          <Heart size={14} className="mr-1" /> Damage
        </Button>
        <Button variant="secondary" size="sm" onClick={heal}>
          <Plus size={14} className="mr-1" /> Heal
        </Button>
        <Button variant="ghost" size="sm" onClick={addTempHp}>
          <Shield size={14} className="mr-1" /> Temp
        </Button>
      </div>
    </div>
  )
}
