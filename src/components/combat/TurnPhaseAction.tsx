import { useState } from 'react'
import { Swords, Wand2, Wind, Shield, Users, Eye, EyeOff, Package, Zap, Heart, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { EncounterCombatant, StatusConditionName } from '@/lib/types/database'

const ALL_CONDITIONS: StatusConditionName[] = [
  'Blinded', 'Charmed', 'Deafened', 'Frightened', 'Flying', 'Grappled',
  'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned',
  'Prone', 'Restrained', 'Stunned', 'Unconscious', 'Exhaustion',
]

interface ActionOption {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  type: 'attack' | 'spell' | 'movement' | 'condition' | 'log'
}

const ACTIONS: ActionOption[] = [
  { id: 'attack', name: 'Attack', description: 'Make a melee or ranged attack', icon: <Swords size={16} />, type: 'attack' },
  { id: 'cast-spell', name: 'Cast a Spell', description: 'Cast an action spell or apply spell effects', icon: <Wand2 size={16} />, type: 'spell' },
  { id: 'dash', name: 'Dash', description: 'Double your movement for this turn', icon: <Wind size={16} />, type: 'log' },
  { id: 'dodge', name: 'Dodge', description: 'Attacks against you have disadvantage', icon: <Shield size={16} />, type: 'log' },
  { id: 'disengage', name: 'Disengage', description: 'Move without provoking opportunity attacks', icon: <Wind size={16} />, type: 'log' },
  { id: 'help', name: 'Help', description: 'Give an ally advantage on their next check', icon: <Users size={16} />, type: 'log' },
  { id: 'hide', name: 'Hide', description: 'Make a Stealth check to become hidden', icon: <EyeOff size={16} />, type: 'log' },
  { id: 'ready', name: 'Ready', description: 'Prepare an action with a trigger', icon: <Eye size={16} />, type: 'log' },
  { id: 'use-object', name: 'Use an Object', description: 'Interact with an object or use an item', icon: <Package size={16} />, type: 'log' },
]

const BONUS_ACTIONS: ActionOption[] = [
  { id: 'bonus-attack', name: 'Attack', description: 'Off-hand attack or class feature attack', icon: <Swords size={16} />, type: 'attack' },
  { id: 'bonus-spell', name: 'Cast a Spell', description: 'Cast a bonus action spell', icon: <Wand2 size={16} />, type: 'spell' },
  { id: 'class-ability', name: 'Class Ability', description: 'Use a class feature (e.g., Second Wind, Cunning Action)', icon: <Zap size={16} />, type: 'log' },
  { id: 'bonus-other', name: 'Other', description: 'Any other bonus action', icon: <ChevronRight size={16} />, type: 'log' },
]

interface TurnPhaseActionProps {
  combatant: EncounterCombatant
  allCombatants: EncounterCombatant[]
  label: 'Action' | 'Bonus Action'
  isDM: boolean
  onApplyDamage: (targetId: string, damage: number) => void
  onApplyHealing: (targetId: string, healing: number) => void
  onUpdateConditions: (targetId: string, conditions: StatusConditionName[]) => void
  onLogAction: (entry: string) => void
  onComplete: () => void
  onSkip: () => void
}

export function TurnPhaseAction({
  combatant,
  allCombatants,
  label,
  isDM,
  onApplyDamage,
  onApplyHealing,
  onUpdateConditions,
  onLogAction,
  onComplete,
  onSkip,
}: TurnPhaseActionProps) {
  const [selectedAction, setSelectedAction] = useState<ActionOption | null>(null)
  const [subMode, setSubMode] = useState<'select' | 'target-damage' | 'target-heal' | 'conditions' | null>(null)
  const [targetId, setTargetId] = useState('')
  const [amount, setAmount] = useState('')
  const [conditionTarget, setConditionTarget] = useState('')

  const actions = label === 'Action' ? ACTIONS : BONUS_ACTIONS

  function handleSelectAction(action: ActionOption) {
    setSelectedAction(action)
    if (action.type === 'attack') {
      setSubMode('target-damage')
    } else if (action.type === 'spell') {
      setSubMode('target-damage') // default to damage, can switch to heal
    } else if (action.type === 'condition') {
      setSubMode('conditions')
    } else {
      // Log-only actions
      onLogAction(`${combatant.name} used ${action.name}`)
      onComplete()
    }
  }

  function handleApplyDamage() {
    const dmg = parseInt(amount)
    if (!targetId || !dmg || dmg <= 0) return
    const target = allCombatants.find(c => c.id === targetId)
    onApplyDamage(targetId, dmg)
    onLogAction(`${combatant.name} attacked ${target?.name ?? 'target'} for ${dmg} damage`)
    onComplete()
  }

  function handleApplyHealing() {
    const heal = parseInt(amount)
    if (!targetId || !heal || heal <= 0) return
    const target = allCombatants.find(c => c.id === targetId)
    onApplyHealing(targetId, heal)
    onLogAction(`${combatant.name} healed ${target?.name ?? 'target'} for ${heal} HP`)
    onComplete()
  }

  function toggleCondition(cId: string, condition: StatusConditionName) {
    const target = allCombatants.find(c => c.id === cId)
    if (!target) return
    const has = target.conditions.includes(condition)
    const newConditions = has
      ? target.conditions.filter(c => c !== condition)
      : [...target.conditions, condition]
    onUpdateConditions(cId, newConditions)
    onLogAction(`${combatant.name} ${has ? 'removed' : 'applied'} ${condition} on ${target.name}`)
  }

  // Action selection menu
  if (!selectedAction) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-display text-sm uppercase text-ink-500">{label}</h4>
          <Button size="sm" variant="ghost" onClick={onSkip}>
            Skip {label}
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {actions.map(action => (
            <button
              key={action.id}
              onClick={() => handleSelectAction(action)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-parchment-300 hover:border-gold-400 hover:bg-gold-100/30 transition-colors cursor-pointer text-left"
            >
              <span className="text-gold-500">{action.icon}</span>
              <div className="flex-1">
                <div className="font-display text-sm text-ink-900">{action.name}</div>
                <div className="text-xs text-ink-500">{action.description}</div>
              </div>
              <ChevronRight size={14} className="text-ink-300" />
            </button>
          ))}
          {/* Conditions button */}
          <button
            onClick={() => { setSelectedAction({ id: 'conditions', name: 'Apply Condition', description: '', icon: null, type: 'condition' }); setSubMode('conditions') }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-parchment-300 hover:border-arcane-400 hover:bg-arcane-400/10 transition-colors cursor-pointer text-left"
          >
            <span className="text-arcane-500"><Shield size={16} /></span>
            <div className="flex-1">
              <div className="font-display text-sm text-ink-900">Apply Condition</div>
              <div className="text-xs text-ink-500">Add or remove a condition on a target</div>
            </div>
            <ChevronRight size={14} className="text-ink-300" />
          </button>
        </div>
      </div>
    )
  }

  // Target + Damage/Heal sub-flow
  if (subMode === 'target-damage' || subMode === 'target-heal') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="font-display text-sm uppercase text-ink-500">{label}: {selectedAction.name}</h4>
          </div>
          <Button size="sm" variant="ghost" onClick={() => { setSelectedAction(null); setSubMode(null); setTargetId(''); setAmount('') }}>
            Back
          </Button>
        </div>

        {/* Damage / Heal toggle for spells */}
        {selectedAction.type === 'spell' && (
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setSubMode('target-damage')}
              className={`flex-1 py-1.5 rounded text-xs font-display uppercase cursor-pointer transition-colors ${
                subMode === 'target-damage' ? 'bg-danger/20 text-danger border border-danger/40' : 'bg-parchment-200 text-ink-500'
              }`}
            >
              <Swords size={12} className="inline mr-1" /> Damage
            </button>
            <button
              onClick={() => setSubMode('target-heal')}
              className={`flex-1 py-1.5 rounded text-xs font-display uppercase cursor-pointer transition-colors ${
                subMode === 'target-heal' ? 'bg-heal/20 text-heal border border-heal/40' : 'bg-parchment-200 text-ink-500'
              }`}
            >
              <Heart size={12} className="inline mr-1" /> Heal
            </button>
          </div>
        )}

        <Card>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-display uppercase text-ink-500 block mb-1">Target</label>
              <select
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
                className="w-full px-3 py-2 bg-parchment-50 border border-parchment-400 rounded text-sm text-ink-900 focus:outline-none focus:border-gold-400"
              >
                <option value="">Select target...</option>
                {allCombatants
                  .filter(c => subMode === 'target-heal' || c.current_hp > 0)
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.current_hp}/{c.max_hp} HP, AC {isDM || c.is_player ? c.armor_class : '??'})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-display uppercase text-ink-500 block mb-1">
                {subMode === 'target-heal' ? 'Healing' : 'Damage'}
              </label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-parchment-50 border border-parchment-400 rounded font-mono text-sm text-ink-900 focus:outline-none focus:border-gold-400"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    subMode === 'target-heal' ? handleApplyHealing() : handleApplyDamage()
                  }
                }}
              />
            </div>
            <Button
              className="w-full"
              variant={subMode === 'target-heal' ? 'primary' : 'danger'}
              onClick={subMode === 'target-heal' ? handleApplyHealing : handleApplyDamage}
            >
              Apply {subMode === 'target-heal' ? 'Healing' : 'Damage'}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Conditions sub-flow
  if (subMode === 'conditions') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-display text-sm uppercase text-ink-500">Apply Condition</h4>
          <Button size="sm" variant="ghost" onClick={() => { setSelectedAction(null); setSubMode(null); setConditionTarget('') }}>
            Back
          </Button>
        </div>
        <Card>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-display uppercase text-ink-500 block mb-1">Target</label>
              <select
                value={conditionTarget}
                onChange={e => setConditionTarget(e.target.value)}
                className="w-full px-3 py-2 bg-parchment-50 border border-parchment-400 rounded text-sm text-ink-900 focus:outline-none focus:border-gold-400"
              >
                <option value="">Select target...</option>
                {allCombatants.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {conditionTarget && (
              <div className="flex flex-wrap gap-1">
                {ALL_CONDITIONS.map(cond => {
                  const target = allCombatants.find(c => c.id === conditionTarget)
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
                      {cond}
                    </button>
                  )
                })}
              </div>
            )}
            <Button variant="ghost" onClick={() => { setSelectedAction(null); setSubMode(null) }} className="w-full">
              Done
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return null
}
