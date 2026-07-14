import { useState } from 'react'
import { Plus, Filter, ScrollText, Target, Wand2 } from 'lucide-react'
import { SpellSlotTracker } from './SpellSlotTracker'
import { SpellCard } from './SpellCard'
import { SpellForm } from './SpellForm'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import type { Spell, SpellSlot, SpellInsert } from '@/lib/types/database'

interface SpellsPanelProps {
  spells: Spell[]
  spellSlots: SpellSlot[]
  characterId: string
  characterClass?: string
  characterLevel?: number
  preparedMax?: number  // max spells that can be prepared (for prepared casters)
  spellSaveDC?: number | null
  spellAttackBonus?: number | null
  spellcastingAbility?: string | null
  onAddSpell: (spell: SpellInsert) => void
  onUpdateSpell: (id: string, updates: Partial<Spell>) => void
  onDeleteSpell: (id: string) => void
  onExpendSlot: (slotId: string) => void
  onRestoreSlot: (slotId: string) => void
  onLongRest: () => void
}

export function SpellsPanel({
  spells,
  spellSlots,
  characterId,
  characterClass,
  characterLevel,
  preparedMax,
  spellSaveDC,
  spellAttackBonus,
  spellcastingAbility,
  onAddSpell,
  onUpdateSpell,
  onDeleteSpell,
  onExpendSlot,
  onRestoreSlot,
  onLongRest,
}: SpellsPanelProps) {
  const [showForm, setShowForm] = useState(false)
  const [filterLevel, setFilterLevel] = useState<number | null>(null)
  const [showPreparedOnly, setShowPreparedOnly] = useState(false)

  // Max spell level the character has slots for
  const maxSpellLevel = spellSlots.length > 0
    ? Math.max(...spellSlots.map((s) => s.slot_level))
    : characterLevel ? Math.min(9, Math.ceil(characterLevel / 2)) : 9

  const filtered = spells.filter((s) => {
    if (filterLevel !== null && s.level !== filterLevel) return false
    if (showPreparedOnly && !s.is_prepared && s.level !== 0) return false
    return true
  })

  const grouped = filtered.reduce<Record<number, Spell[]>>((acc, spell) => {
    if (!acc[spell.level]) acc[spell.level] = []
    acc[spell.level].push(spell)
    return acc
  }, {})

  const levels = Object.keys(grouped).map(Number).sort((a, b) => a - b)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink-900">Spells & Magic</h2>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus size={14} className="mr-1" /> Add Spell
        </Button>
      </div>

      {/* Spells known / prepared counters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="default">
          {spells.filter((s) => s.level === 0 && s.source !== 'Species').length} Cantrips
        </Badge>
        <Badge variant="default">
          {spells.filter((s) => s.level > 0 && s.source !== 'Species').length} Spells Known
        </Badge>
        <Badge variant="gold">
          {spells.filter((s) => s.is_prepared && s.level > 0).length}{preparedMax != null ? `/${preparedMax}` : ''} Prepared
        </Badge>
      </div>

      {/* Spellcasting Stats */}
      {spellSaveDC != null && (
        <Card>
          <div className="flex items-center gap-4 flex-wrap">
            {spellcastingAbility && (
              <div className="flex items-center gap-2">
                <Wand2 size={14} className="text-arcane-500" />
                <span className="text-xs font-display uppercase text-ink-500">Ability</span>
                <span className="font-display font-bold text-ink-900 capitalize">{spellcastingAbility}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Target size={14} className="text-arcane-500" />
              <span className="text-xs font-display uppercase text-ink-500">Save DC</span>
              <span className="font-display font-bold text-lg text-ink-900">{spellSaveDC}</span>
            </div>
            <div className="flex items-center gap-2">
              <Wand2 size={14} className="text-arcane-500" />
              <span className="text-xs font-display uppercase text-ink-500">Attack</span>
              <span className="font-display font-bold text-lg text-ink-900">
                {spellAttackBonus != null ? (spellAttackBonus >= 0 ? `+${spellAttackBonus}` : spellAttackBonus) : '—'}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Spell Slot Tracker */}
      {spellSlots.length > 0 && (
        <Card>
          <SpellSlotTracker
            spellSlots={spellSlots}
            onExpend={onExpendSlot}
            onRestore={onRestoreSlot}
            onLongRest={onLongRest}
          />
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={16} className="text-ink-500" />
        <button
          onClick={() => setFilterLevel(null)}
          className={`px-3 py-1 rounded text-xs font-display uppercase cursor-pointer transition-colors ${
            filterLevel === null ? 'bg-gold-400 text-ink-900' : 'bg-parchment-200 text-ink-500 hover:bg-parchment-300'
          }`}
        >
          All
        </button>
        {Array.from({ length: 10 }, (_, i) => i).map((level) => {
          const count = spells.filter((s) => s.level === level).length
          if (count === 0) return null
          return (
            <button
              key={level}
              onClick={() => setFilterLevel(filterLevel === level ? null : level)}
              className={`px-3 py-1 rounded text-xs font-display uppercase cursor-pointer transition-colors ${
                filterLevel === level ? 'bg-gold-400 text-ink-900' : 'bg-parchment-200 text-ink-500 hover:bg-parchment-300'
              }`}
            >
              {level === 0 ? 'Cantrip' : `Lvl ${level}`} ({count})
            </button>
          )
        })}
        <button
          onClick={() => setShowPreparedOnly(!showPreparedOnly)}
          className={`px-3 py-1 rounded text-xs font-display uppercase cursor-pointer transition-colors ${
            showPreparedOnly ? 'bg-arcane-400 text-white' : 'bg-parchment-200 text-ink-500 hover:bg-parchment-300'
          }`}
        >
          Prepared Only
        </button>
      </div>

      <Divider />

      {/* Spell List */}
      {spells.length === 0 ? (
        <EmptyState
          icon={<ScrollText size={48} />}
          title="No Spells"
          description="Add spells to your spellbook to track them here."
          action={{ label: 'Add Spell', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-6">
          {levels.map((level) => (
            <div key={level}>
              <SectionHeader>
                {level === 0 ? 'Cantrips' : `Level ${level} Spells`}
              </SectionHeader>
              <div className="space-y-2">
                {grouped[level].map((spell) => {
                  const preparedCount = spells.filter(s => s.is_prepared && s.level > 0).length
                  const atPrepareMax = preparedMax != null && preparedCount >= preparedMax && !spell.is_prepared && spell.level > 0
                  return (
                  <SpellCard
                    key={spell.id}
                    spell={spell}
                    prepareDisabled={atPrepareMax}
                    onTogglePrepared={() =>
                      onUpdateSpell(spell.id, { is_prepared: !spell.is_prepared })
                    }
                    onDelete={() => onDeleteSpell(spell.id)}
                  />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Spell Form */}
      <SpellForm
        open={showForm}
        onClose={() => setShowForm(false)}
        characterClass={characterClass}
        maxSpellLevel={maxSpellLevel}
        existingSpellNames={spells.map(s => s.name.toLowerCase())}
        onSubmit={(data) => {
          onAddSpell({ ...data, character_id: characterId })
          setShowForm(false)
        }}
      />
    </div>
  )
}
