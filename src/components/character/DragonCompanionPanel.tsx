import { useState } from 'react'
import { Heart, Shield, Wind, Flame, Pencil, Check, X, Minus, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  getDragonData,
  updateDragonData,
  getCompanionStats,
  getCompanionAttacks,
  getCompanionAbilities,
  DRAGON_ELEMENTS,
  type DragonElement,
} from '@/lib/dragonCompanion'
import type { Character, CharacterUpdate } from '@/lib/types/database'

interface DragonCompanionPanelProps {
  character: Character
  onUpdate: (updates: CharacterUpdate) => void
}

export function DragonCompanionPanel({ character, onUpdate }: DragonCompanionPanelProps) {
  const isDR = character.class.toLowerCase().includes('dragon-rider')
  if (!isDR) return null

  const dragonData = getDragonData(character.appearance)
  const [hpAmountStr, setHpAmountStr] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [showAbilities, setShowAbilities] = useState(false)

  const stats = getCompanionStats(character.level)
  const attacks = getCompanionAttacks(character.level)
  const abilities = getCompanionAbilities(character.level)

  // If no dragon data yet, show setup prompt
  if (!dragonData) {
    return <DragonSetup character={character} onUpdate={onUpdate} />
  }

  const currentHp = dragonData.dragonCurrentHp
  const maxHp = stats.maxHp
  const hpPercent = maxHp > 0 ? Math.max(0, (currentHp / maxHp) * 100) : 0
  const hpAmount = parseInt(hpAmountStr) || 0

  function updateHp(newHp: number) {
    const clamped = Math.max(0, Math.min(maxHp, newHp))
    onUpdate({ appearance: updateDragonData(character.appearance, { dragonCurrentHp: clamped }) })
  }

  function handleDamage() {
    if (hpAmount > 0) {
      updateHp(currentHp - hpAmount)
      setHpAmountStr('')
    }
  }

  function handleHeal() {
    if (hpAmount > 0) {
      updateHp(currentHp + hpAmount)
      setHpAmountStr('')
    }
  }

  function handleNameSave() {
    if (draftName.trim()) {
      onUpdate({ appearance: updateDragonData(character.appearance, { dragonName: draftName.trim() }) })
    }
    setEditingName(false)
  }

  const barColor = hpPercent > 50 ? 'bg-heal' : hpPercent > 25 ? 'bg-[#b8860b]' : 'bg-danger'

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-gold-500" />
          <span className="font-display text-sm uppercase tracking-wider text-ink-500">Dragon Companion</span>
        </div>
        <span className="text-xs px-2 py-0.5 bg-gold-200 text-gold-700 rounded font-display uppercase">
          {dragonData.dragonElement}
        </span>
      </div>

      {/* Dragon Name */}
      <div className="flex items-center gap-2 mb-3">
        {editingName ? (
          <div className="flex items-center gap-1 flex-1">
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="flex-1 px-2 py-1 bg-parchment-50 border border-gold-400 rounded text-sm font-display text-ink-900 focus:outline-none focus:ring-1 focus:ring-gold-400"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
            />
            <button onClick={handleNameSave} className="p-1 text-heal cursor-pointer"><Check size={14} /></button>
            <button onClick={() => setEditingName(false)} className="p-1 text-danger cursor-pointer"><X size={14} /></button>
          </div>
        ) : (
          <>
            <h3 className="font-display text-lg text-ink-900">{dragonData.dragonName}</h3>
            <button
              onClick={() => { setDraftName(dragonData.dragonName); setEditingName(true) }}
              className="text-ink-300 hover:text-gold-500 transition-colors cursor-pointer"
            >
              <Pencil size={12} />
            </button>
          </>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-2 mb-3 text-center text-xs">
        <div className="bg-parchment-200 rounded p-1.5">
          <div className="font-display uppercase text-[10px] text-ink-400">Size</div>
          <div className="font-body text-ink-900">{stats.size}</div>
        </div>
        <div className="bg-parchment-200 rounded p-1.5">
          <div className="font-display uppercase text-[10px] text-ink-400">AC</div>
          <div className="font-mono text-ink-900">{stats.ac}</div>
        </div>
        <div className="bg-parchment-200 rounded p-1.5">
          <div className="font-display uppercase text-[10px] text-ink-400">Walk</div>
          <div className="font-mono text-ink-900">{stats.walk} ft</div>
        </div>
        <div className="bg-parchment-200 rounded p-1.5">
          <div className="font-display uppercase text-[10px] text-ink-400">Fly</div>
          <div className="font-mono text-ink-900">{stats.fly} ft</div>
        </div>
        <div className="bg-parchment-200 rounded p-1.5">
          <div className="font-display uppercase text-[10px] text-ink-400">Saves</div>
          <div className="font-mono text-ink-900">{stats.saveBonusAll}</div>
        </div>
      </div>

      {/* HP Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Heart size={14} className="text-health" />
            <span className="text-xs font-display uppercase text-ink-500">Dragon HP</span>
          </div>
          <span className="font-mono text-sm">
            <span className={currentHp <= maxHp / 4 ? 'text-danger font-bold' : 'text-ink-900'}>{currentHp}</span>
            <span className="text-ink-300"> / {maxHp}</span>
          </span>
        </div>
        <div className="h-2 bg-parchment-300 rounded-full overflow-hidden mb-2">
          <div className={`h-full ${barColor} transition-all duration-300`} style={{ width: `${hpPercent}%` }} />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={hpAmountStr}
            onChange={(e) => setHpAmountStr(e.target.value)}
            className="w-16 text-center font-mono text-sm border border-parchment-400 rounded py-1 bg-parchment-50 text-ink-900"
            placeholder="0"
          />
          <button
            onClick={handleDamage}
            disabled={!hpAmount}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-display uppercase bg-danger/20 text-danger hover:bg-danger/30 cursor-pointer disabled:opacity-30 disabled:cursor-default transition-colors"
          >
            <Minus size={12} /> Damage
          </button>
          <button
            onClick={handleHeal}
            disabled={!hpAmount}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-display uppercase bg-heal/20 text-heal hover:bg-heal/30 cursor-pointer disabled:opacity-30 disabled:cursor-default transition-colors"
          >
            <Plus size={12} /> Heal
          </button>
          <button
            onClick={() => updateHp(maxHp)}
            disabled={currentHp >= maxHp}
            className="px-2 py-1 rounded text-xs font-display uppercase bg-gold-200 text-gold-700 hover:bg-gold-300 cursor-pointer disabled:opacity-30 disabled:cursor-default transition-colors"
          >
            Full
          </button>
        </div>
      </div>

      {/* Attacks */}
      <div className="mb-3">
        <div className="font-display text-xs uppercase tracking-wider text-ink-500 mb-1.5">Attacks</div>
        <div className="space-y-1">
          {attacks.map(atk => (
            <div key={atk.name} className="flex items-center justify-between text-xs bg-parchment-50 border border-parchment-300 rounded px-2 py-1.5">
              <div>
                <span className="font-body font-semibold text-ink-900">{atk.name}</span>
                <span className="text-ink-400 ml-1.5">{atk.reach}</span>
              </div>
              <div className="font-mono text-ink-700">{atk.damage}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Abilities (collapsible) */}
      {abilities.length > 0 && (
        <div>
          <button
            onClick={() => setShowAbilities(!showAbilities)}
            className="flex items-center gap-1 font-display text-xs uppercase tracking-wider text-ink-500 cursor-pointer hover:text-ink-700 transition-colors mb-1.5"
          >
            Abilities ({abilities.length})
            {showAbilities ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showAbilities && (
            <div className="space-y-1.5">
              {abilities.map(ability => (
                <div key={ability.name} className="text-xs bg-parchment-50 border border-parchment-300 rounded p-2">
                  <div className="font-body font-semibold text-ink-900">{ability.name}</div>
                  <p className="text-ink-500 mt-0.5">{ability.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// ─── Setup Component (shown when no dragon data exists yet) ───

function DragonSetup({ character, onUpdate }: { character: Character; onUpdate: (updates: CharacterUpdate) => void }) {
  const [name, setName] = useState('')
  const [element, setElement] = useState<DragonElement>('Fire')

  function handleCreate() {
    if (!name.trim()) return
    const stats = getCompanionStats(character.level)
    onUpdate({
      appearance: updateDragonData(character.appearance, {
        dragonName: name.trim(),
        dragonElement: element,
        dragonCurrentHp: stats.maxHp,
      }),
    })
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Flame size={16} className="text-gold-500" />
        <span className="font-display text-sm uppercase tracking-wider text-ink-500">Bond Your Dragon</span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-display uppercase text-ink-500">Dragon Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-parchment-50 border border-parchment-400 rounded text-sm font-body text-ink-900 focus:outline-none focus:ring-1 focus:ring-gold-400"
            placeholder="Name your dragon companion..."
          />
        </div>

        <div>
          <label className="text-xs font-display uppercase text-ink-500">Elemental Affinity</label>
          <div className="grid grid-cols-4 gap-2 mt-1">
            {DRAGON_ELEMENTS.map(el => (
              <button
                key={el}
                onClick={() => setElement(el)}
                className={`px-2 py-1.5 rounded text-xs font-display uppercase transition-colors cursor-pointer ${
                  element === el
                    ? 'bg-gold-400 text-ink-900 border-2 border-gold-500'
                    : 'bg-parchment-200 text-ink-500 border-2 border-transparent hover:border-gold-300'
                }`}
              >
                {el}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleCreate} disabled={!name.trim()}>
          Bond Dragon
        </Button>
      </div>
    </Card>
  )
}
