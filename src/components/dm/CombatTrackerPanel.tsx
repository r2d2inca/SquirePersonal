import { useState } from 'react'
import { Swords, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { EncounterBuilder } from './EncounterBuilder'
import { CombatTracker } from './CombatTracker'
import { useCombatStore, type Combatant } from '@/stores/combatStore'
import type { Character } from '@/lib/types/database'

interface CombatTrackerPanelProps {
  partyCharacters: Character[]
  hasCampaign: boolean
}

export function CombatTrackerPanel({ partyCharacters, hasCampaign }: CombatTrackerPanelProps) {
  const { phase, combatants, addCombatant, startCombat } = useCombatStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newInit, setNewInit] = useState('')
  const [newHp, setNewHp] = useState('')
  const [newAc, setNewAc] = useState('')

  if (!hasCampaign) {
    return (
      <EmptyState
        icon={<Swords size={48} />}
        title="No Campaign Selected"
        description="Select a campaign to use the combat tracker."
      />
    )
  }

  if (phase === 'running') {
    return (
      <div className="space-y-6">
        <h2 className="font-display text-2xl text-ink-900">Combat Tracker</h2>
        <CombatTracker />
      </div>
    )
  }

  // Setup phase
  const partyLevels = partyCharacters.map((c) => c.level)

  function addPartyToCombat() {
    for (const char of partyCharacters) {
      // Check not already added
      if (combatants.some((c) => c.name === char.name && c.isPlayer)) continue
      addCombatant({
        id: crypto.randomUUID(),
        name: char.name,
        initiative: 0,
        maxHp: char.max_hp,
        currentHp: char.current_hp,
        armorClass: char.armor_class,
        isPlayer: true,
        conditions: [],
      })
    }
  }

  function handleAddCustom() {
    if (!newName.trim()) return
    addCombatant({
      id: crypto.randomUUID(),
      name: newName.trim(),
      initiative: parseInt(newInit) || 0,
      maxHp: parseInt(newHp) || 10,
      currentHp: parseInt(newHp) || 10,
      armorClass: parseInt(newAc) || 10,
      isPlayer: false,
      conditions: [],
    })
    setNewName('')
    setNewInit('')
    setNewHp('')
    setNewAc('')
    setShowAddForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink-900">Combat Tracker</h2>
        <div className="flex items-center gap-2">
          {partyCharacters.length > 0 && (
            <Button variant="secondary" size="sm" onClick={addPartyToCombat}>
              <Plus size={14} className="mr-1" /> Add Party
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={14} className="mr-1" /> Custom
          </Button>
        </div>
      </div>

      {/* Add Custom Combatant Form */}
      {showAddForm && (
        <Card>
          <div className="grid grid-cols-4 gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              className="col-span-4 sm:col-span-1 px-3 py-2 bg-parchment-50 border border-parchment-400 rounded font-body text-sm focus:outline-none focus:border-gold-400 text-ink-900"
            />
            <input
              value={newInit}
              onChange={(e) => setNewInit(e.target.value)}
              placeholder="Init"
              type="number"
              className="px-3 py-2 bg-parchment-50 border border-parchment-400 rounded font-mono text-sm focus:outline-none focus:border-gold-400 text-ink-900"
            />
            <input
              value={newHp}
              onChange={(e) => setNewHp(e.target.value)}
              placeholder="HP"
              type="number"
              className="px-3 py-2 bg-parchment-50 border border-parchment-400 rounded font-mono text-sm focus:outline-none focus:border-gold-400 text-ink-900"
            />
            <input
              value={newAc}
              onChange={(e) => setNewAc(e.target.value)}
              placeholder="AC"
              type="number"
              className="px-3 py-2 bg-parchment-50 border border-parchment-400 rounded font-mono text-sm focus:outline-none focus:border-gold-400 text-ink-900"
            />
          </div>
          <Button size="sm" onClick={handleAddCustom} className="mt-2">
            Add Combatant
          </Button>
        </Card>
      )}

      {/* Current Combatants */}
      {combatants.length > 0 && (
        <div>
          <SectionHeader>Combatants ({combatants.length})</SectionHeader>
          <div className="space-y-1">
            {combatants.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-2 bg-parchment-50 border border-parchment-300 rounded">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-display ${c.isPlayer ? 'text-ink-900' : 'text-danger'}`}>
                    {c.name}
                  </span>
                  {c.isPlayer && <span className="text-[10px] text-gold-500">PC</span>}
                </div>
                <div className="flex items-center gap-4 text-xs text-ink-500">
                  <span>Init: <input
                    type="number"
                    value={c.initiative}
                    onChange={(e) => {
                      const { updateCombatant } = useCombatStore.getState()
                      updateCombatant(c.id, { initiative: parseInt(e.target.value) || 0 })
                    }}
                    className="w-12 text-center font-mono border border-parchment-400 rounded py-0.5 bg-parchment-50 text-ink-900"
                  /></span>
                  <span>HP: {c.currentHp}/{c.maxHp}</span>
                  <span>AC: {c.armorClass}</span>
                </div>
              </div>
            ))}
          </div>
          <Button onClick={startCombat} className="w-full mt-3">
            <Swords size={14} className="mr-1" /> Start Combat
          </Button>
        </div>
      )}

      {/* Encounter Builder */}
      <div>
        <SectionHeader>Encounter Builder</SectionHeader>
        <EncounterBuilder partyLevels={partyLevels} />
      </div>
    </div>
  )
}
