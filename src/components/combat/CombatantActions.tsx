import { useState } from 'react'
import { Swords, Heart, Shield, SkipForward, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { EncounterCombatant, StatusConditionName } from '@/lib/types/database'

const ALL_CONDITIONS: StatusConditionName[] = [
  'Blinded', 'Charmed', 'Deafened', 'Frightened', 'Flying', 'Grappled',
  'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned',
  'Prone', 'Restrained', 'Stunned', 'Unconscious', 'Exhaustion',
]

interface CombatantActionsProps {
  combatant: EncounterCombatant
  allCombatants: EncounterCombatant[]
  isDM: boolean
  isMyTurn: boolean
  onApplyDamage: (targetId: string, damage: number) => void
  onApplyHealing: (targetId: string, healing: number) => void
  onUpdateConditions: (targetId: string, conditions: StatusConditionName[]) => void
  onEndTurn: () => void
}

export function CombatantActions({
  combatant,
  allCombatants,
  isDM,
  isMyTurn,
  onApplyDamage,
  onApplyHealing,
  onUpdateConditions,
  onEndTurn,
}: CombatantActionsProps) {
  const [mode, setMode] = useState<'idle' | 'damage' | 'heal' | 'condition'>('idle')
  const [targetId, setTargetId] = useState<string>('')
  const [amount, setAmount] = useState('')
  const [conditionTarget, setConditionTarget] = useState<string>('')

  const canAct = isDM || isMyTurn
  const isDown = combatant.current_hp <= 0 && !isDM

  function handleApplyDamage() {
    const dmg = parseInt(amount)
    if (!targetId || !dmg || dmg <= 0) return
    onApplyDamage(targetId, dmg)
    setAmount('')
    setTargetId('')
    setMode('idle')
  }

  function handleApplyHealing() {
    const heal = parseInt(amount)
    if (!targetId || !heal || heal <= 0) return
    onApplyHealing(targetId, heal)
    setAmount('')
    setTargetId('')
    setMode('idle')
  }

  function toggleCondition(cId: string, condition: StatusConditionName) {
    const target = allCombatants.find((c) => c.id === cId)
    if (!target) return
    const has = target.conditions.includes(condition)
    const newConditions = has
      ? target.conditions.filter((c) => c !== condition)
      : [...target.conditions, condition]
    onUpdateConditions(cId, newConditions)
  }

  if (!canAct) {
    return (
      <div className="p-3 bg-parchment-100 border border-parchment-400 rounded-lg text-center">
        <p className="text-sm text-ink-500 font-display">
          Waiting for <span className="text-gold-600 font-bold">{combatant.name}</span>'s turn...
        </p>
      </div>
    )
  }

  if (isDown) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm uppercase text-danger">
            {combatant.name} is Down!
          </h3>
          <Button size="sm" onClick={onEndTurn}>
            <SkipForward size={14} className="mr-1" /> End Turn
          </Button>
        </div>
        <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-center">
          <p className="text-sm text-ink-700 font-body">
            You are unconscious. Roll death saving throws on your character sheet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase text-ink-500">
          {combatant.name}'s Turn
        </h3>
        <Button size="sm" onClick={onEndTurn}>
          <SkipForward size={14} className="mr-1" /> End Turn
        </Button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode(mode === 'damage' ? 'idle' : 'damage')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-display uppercase cursor-pointer transition-colors ${
            mode === 'damage'
              ? 'bg-danger/20 text-danger border border-danger/40'
              : 'bg-parchment-200 text-ink-700 border border-parchment-400 hover:bg-parchment-100'
          }`}
        >
          <Swords size={12} /> Damage
        </button>
        <button
          onClick={() => setMode(mode === 'heal' ? 'idle' : 'heal')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-display uppercase cursor-pointer transition-colors ${
            mode === 'heal'
              ? 'bg-heal/20 text-heal border border-heal/40'
              : 'bg-parchment-200 text-ink-700 border border-parchment-400 hover:bg-parchment-100'
          }`}
        >
          <Heart size={12} /> Heal
        </button>
        <button
          onClick={() => setMode(mode === 'condition' ? 'idle' : 'condition')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-display uppercase cursor-pointer transition-colors ${
            mode === 'condition'
              ? 'bg-arcane-400/20 text-arcane-500 border border-arcane-400/40'
              : 'bg-parchment-200 text-ink-700 border border-parchment-400 hover:bg-parchment-100'
          }`}
        >
          <Shield size={12} /> Conditions
        </button>
      </div>

      {/* Damage / Heal panel */}
      {(mode === 'damage' || mode === 'heal') && (
        <div className="p-3 bg-parchment-50 border border-parchment-300 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-ink-500 font-display w-14">Target</label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="flex-1 px-2 py-1 bg-parchment-50 border border-parchment-400 rounded text-sm text-ink-900 focus:outline-none focus:border-gold-400"
            >
              <option value="">Select target...</option>
              {allCombatants
                .filter((c) => c.current_hp > 0 || mode === 'heal')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.current_hp}/{c.max_hp})
                  </option>
                ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-ink-500 font-display w-14">
              {mode === 'damage' ? 'Dmg' : 'Heal'}
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-20 px-2 py-1 bg-parchment-50 border border-parchment-400 rounded font-mono text-sm text-ink-900 focus:outline-none focus:border-gold-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  mode === 'damage' ? handleApplyDamage() : handleApplyHealing()
                }
              }}
            />
            <Button
              size="sm"
              variant={mode === 'damage' ? 'danger' : 'primary'}
              onClick={mode === 'damage' ? handleApplyDamage : handleApplyHealing}
            >
              Apply
            </Button>
          </div>
        </div>
      )}

      {/* Condition panel */}
      {mode === 'condition' && (
        <div className="p-3 bg-parchment-50 border border-parchment-300 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-ink-500 font-display w-14">Target</label>
            <select
              value={conditionTarget}
              onChange={(e) => setConditionTarget(e.target.value)}
              className="flex-1 px-2 py-1 bg-parchment-50 border border-parchment-400 rounded text-sm text-ink-900 focus:outline-none focus:border-gold-400"
            >
              <option value="">Select target...</option>
              {allCombatants.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {conditionTarget && (
            <div className="flex flex-wrap gap-1">
              {ALL_CONDITIONS.map((cond) => {
                const target = allCombatants.find((c) => c.id === conditionTarget)
                const isActive = target?.conditions.includes(cond)
                return (
                  <button
                    key={cond}
                    onClick={() => toggleCondition(conditionTarget, cond)}
                    className={`px-2 py-0.5 rounded text-[10px] font-display uppercase cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-arcane-400/30 text-arcane-600 border border-arcane-400'
                        : 'bg-parchment-200 text-ink-500 border border-parchment-300 hover:border-arcane-400'
                    }`}
                  >
                    {isActive && <X size={8} className="inline mr-0.5" />}
                    {cond}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
