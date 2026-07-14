import { useState } from 'react'
import { ChevronLeft, ChevronRight, Heart, Shield, X, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useCombatStore, STATUS_CONDITIONS, type StatusCondition } from '@/stores/combatStore'

export function CombatTracker() {
  const {
    combatants, currentTurnIndex, round, nextTurn, prevTurn,
    updateCombatant, removeCombatant, endCombat, toggleCondition,
  } = useCombatStore()

  const [showConditions, setShowConditions] = useState<string | null>(null)
  const [hpDelta, setHpDelta] = useState<Record<string, string>>({})

  function applyHpChange(id: string, mode: 'damage' | 'heal') {
    const amount = parseInt(hpDelta[id] || '0')
    if (!amount) return
    const c = combatants.find((c) => c.id === id)
    if (!c) return
    const newHp = mode === 'damage'
      ? Math.max(0, c.currentHp - amount)
      : Math.min(c.maxHp, c.currentHp + amount)
    updateCombatant(id, { currentHp: newHp })
    setHpDelta((prev) => ({ ...prev, [id]: '' }))
  }

  return (
    <div className="space-y-4">
      {/* Round & Turn Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-display text-lg text-ink-900">Round {round}</span>
          <div className="flex items-center gap-2">
            <button onClick={prevTurn} className="p-1.5 bg-parchment-200 rounded hover:bg-parchment-300 cursor-pointer">
              <ChevronLeft size={16} />
            </button>
            <button onClick={nextTurn} className="p-1.5 bg-parchment-200 rounded hover:bg-parchment-300 cursor-pointer">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <Button variant="danger" size="sm" onClick={endCombat}>
          End Combat
        </Button>
      </div>

      {/* Initiative Order */}
      <div className="space-y-2">
        {combatants.map((c, idx) => {
          const isActive = idx === currentTurnIndex
          const hpPercent = Math.round((c.currentHp / c.maxHp) * 100)
          const hpColor = hpPercent <= 25 ? 'bg-danger' : hpPercent <= 50 ? 'bg-gold-400' : 'bg-health'

          return (
            <Card
              key={c.id}
              className={`!p-3 ${isActive ? 'border-gold-400 bg-gold-50' : ''} ${c.currentHp === 0 ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-3">
                {/* Initiative */}
                <div className="w-10 text-center">
                  <div className="font-mono text-lg font-bold text-ink-900">{c.initiative}</div>
                  <div className="text-[10px] text-ink-400">INIT</div>
                </div>

                {/* Name & Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {isActive && <span className="w-2 h-2 bg-gold-400 rounded-full animate-pulse" />}
                    <span className={`font-display text-sm ${c.isPlayer ? 'text-ink-900' : 'text-danger'}`}>
                      {c.name}
                    </span>
                    {c.isPlayer && <Badge variant="gold">PC</Badge>}
                  </div>

                  {/* Conditions */}
                  {c.conditions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.conditions.map((cond) => (
                        <span
                          key={cond}
                          onClick={() => toggleCondition(c.id, cond)}
                          className="text-[10px] px-1.5 py-0.5 bg-arcane-400/20 text-arcane-500 rounded cursor-pointer hover:bg-arcane-400/40"
                        >
                          {cond} &times;
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* AC */}
                <div className="flex items-center gap-1">
                  <Shield size={12} className="text-ink-400" />
                  <span className="font-mono text-xs text-ink-700">{c.armorClass}</span>
                </div>

                {/* HP Bar */}
                <div className="w-32">
                  <div className="flex items-center justify-between mb-0.5">
                    <Heart size={12} className="text-health" />
                    <span className="font-mono text-xs text-ink-700">{c.currentHp}/{c.maxHp}</span>
                  </div>
                  <div className="h-1.5 bg-parchment-300 rounded-full overflow-hidden">
                    <div className={`h-full ${hpColor} rounded-full transition-all`} style={{ width: `${Math.max(0, hpPercent)}%` }} />
                  </div>
                </div>

                {/* HP Controls */}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={hpDelta[c.id] || ''}
                    onChange={(e) => setHpDelta((prev) => ({ ...prev, [c.id]: e.target.value }))}
                    className="w-12 text-center font-mono text-xs border border-parchment-400 rounded py-1 bg-parchment-50 text-ink-900"
                    placeholder="0"
                  />
                  <button
                    onClick={() => applyHpChange(c.id, 'damage')}
                    className="p-1 text-danger hover:bg-danger/10 rounded cursor-pointer"
                    title="Damage"
                  >
                    <Minus size={14} />
                  </button>
                  <button
                    onClick={() => applyHpChange(c.id, 'heal')}
                    className="p-1 text-heal hover:bg-heal/10 rounded cursor-pointer"
                    title="Heal"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Conditions Toggle */}
                <button
                  onClick={() => setShowConditions(showConditions === c.id ? null : c.id)}
                  className="p-1 text-ink-300 hover:text-arcane-500 cursor-pointer text-xs font-display"
                  title="Conditions"
                >
                  FX
                </button>

                {/* Remove */}
                {!c.isPlayer && (
                  <button onClick={() => removeCombatant(c.id)} className="p-1 text-ink-300 hover:text-danger cursor-pointer">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Conditions Picker */}
              {showConditions === c.id && (
                <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-parchment-300">
                  {STATUS_CONDITIONS.map((cond) => (
                    <button
                      key={cond}
                      onClick={() => toggleCondition(c.id, cond)}
                      className={`text-[10px] px-2 py-1 rounded cursor-pointer transition-colors ${
                        c.conditions.includes(cond)
                          ? 'bg-arcane-400 text-parchment-100'
                          : 'bg-parchment-200 text-ink-500 hover:bg-parchment-300'
                      }`}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
