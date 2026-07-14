import { useState, useCallback } from 'react'
import { Swords, Plus, ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { BattleGrid } from '@/components/combat/BattleGrid'
import { InitiativeTracker } from '@/components/combat/InitiativeTracker'
import { TurnWizard } from '@/components/combat/TurnWizard'
import { InitiativeRollPrompt } from '@/components/combat/InitiativeRollPrompt'
import { EncounterSetup } from '@/components/combat/EncounterSetup'
import { CombatSummary } from '@/components/combat/CombatSummary'
import { useEncounter } from '@/hooks/useEncounter'
import { useEncounterActions } from '@/hooks/useEncounterActions'
import { useNpcs } from '@/hooks/useNpcs'
import { supabase } from '@/lib/supabase'
import type { Character, StatusConditionName } from '@/lib/types/database'

interface SharedCombatPanelProps {
  campaignId: string
  userId: string
  partyCharacters: Character[]
  hasCampaign: boolean
}

export function SharedCombatPanel({
  campaignId,
  userId,
  partyCharacters,
  hasCampaign,
}: SharedCombatPanelProps) {
  const { encounter, combatants, isLoading } = useEncounter(campaignId)
  const actions = useEncounterActions(campaignId)
  const { npcs } = useNpcs(userId, campaignId)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [combatLog, setCombatLog] = useState<string[]>([])
  const [showLog, setShowLog] = useState(false)

  const addLog = useCallback((entry: string) => {
    setCombatLog((prev) => [...prev, `[R${encounter?.round ?? 1}] ${entry}`])
  }, [encounter?.round])

  if (!hasCampaign) {
    return (
      <EmptyState
        icon={<Swords size={48} />}
        title="No Campaign Selected"
        description="Select a campaign to use the combat tracker."
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    )
  }

  function handleCreateEncounter() {
    actions.createEncounter({
      campaign_id: campaignId,
      dm_user_id: userId,
      status: 'setup',
      current_turn_combatant_id: null,
      round: 1,
      grid_width: 20,
      grid_height: 15,
      map_image_url: null,
    })
  }

  // No active encounter — show create button
  if (!encounter) {
    return (
      <div className="space-y-6">
        <h2 className="font-display text-2xl text-ink-900">Combat Tracker</h2>
        <EmptyState
          icon={<Swords size={48} />}
          title="No Active Encounter"
          description="Start a new encounter to begin tracking combat."
        />
        <div className="flex justify-center">
          <Button onClick={handleCreateEncounter}>
            <Plus size={14} className="mr-1" /> New Encounter
          </Button>
        </div>
      </div>
    )
  }

  const currentCombatant = combatants.find((c) => c.id === encounter.current_turn_combatant_id)

  function handleMoveCombatant(id: string, x: number, y: number) {
    actions.updateCombatant({ id, updates: { grid_x: x, grid_y: y } }).catch(() => {})
  }

  // Sync player combatant HP back to their character sheet
  function syncPlayerHp(target: typeof combatants[0], newHp: number) {
    if (target.is_player && target.user_id) {
      const pc = partyCharacters.find((c) => c.user_id === target.user_id)
      if (pc) {
        supabase.from('characters').update({ current_hp: newHp }).eq('id', pc.id)
          .then(({ error }) => {
            if (error) console.error('Failed to sync player HP:', error)
          })
      }
    }
  }

  function handleApplyDamage(targetId: string, damage: number) {
    const target = combatants.find((c) => c.id === targetId)
    if (!target) return
    const newHp = Math.max(0, target.current_hp - damage)
    actions.updateCombatant({ id: targetId, updates: { current_hp: newHp } })
    syncPlayerHp(target, newHp)
    const attacker = currentCombatant?.name ?? 'Unknown'
    addLog(`${attacker} dealt ${damage} damage to ${target.name} (${target.current_hp} → ${newHp} HP)`)
  }

  function handleApplyHealing(targetId: string, healing: number) {
    const target = combatants.find((c) => c.id === targetId)
    if (!target) return
    const newHp = Math.min(target.max_hp, target.current_hp + healing)
    actions.updateCombatant({ id: targetId, updates: { current_hp: newHp } })
    syncPlayerHp(target, newHp)
    addLog(`${target.name} healed for ${healing} (${target.current_hp} → ${newHp} HP)`)
  }

  function handleUpdateConditions(targetId: string, conditions: StatusConditionName[]) {
    const target = combatants.find((c) => c.id === targetId)
    actions.updateCombatant({ id: targetId, updates: { conditions } })
    if (target) addLog(`${target.name} conditions updated: ${conditions.length > 0 ? conditions.join(', ') : 'none'}`)
  }

  function handleRollInitiative(combatantId: string, initiative: number) {
    actions.updateCombatant({ id: combatantId, updates: { initiative } })
  }

  function handleStartCombat() {
    if (!encounter) return
    const sorted = [...combatants]
      .filter((c) => c.initiative != null)
      .sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0))
    if (sorted.length === 0) return
    actions.updateEncounter({
      id: encounter.id,
      updates: {
        status: 'active',
        current_turn_combatant_id: sorted[0].id,
        round: 1,
      },
    })
  }

  function handleEndTurn() {
    if (!encounter) return
    if (currentCombatant) addLog(`${currentCombatant.name} ended their turn`)
    actions.advanceTurn({
      encounterId: encounter.id,
      combatants: combatants.map((c) => ({ id: c.id, initiative: c.initiative })),
      currentTurnId: encounter.current_turn_combatant_id,
      round: encounter.round,
    })
  }

  function handleEndEncounter() {
    if (!encounter) return
    actions.updateEncounter({ id: encounter.id, updates: { status: 'completed' } })
  }

  // ─── Completed — Show Summary ───
  if (encounter.status === 'completed') {
    return (
      <div className="space-y-6">
        <h2 className="font-display text-2xl text-ink-900">Combat Tracker</h2>
        <CombatSummary
          combatants={combatants}
          round={encounter.round}
          isDM={true}
          onNewEncounter={handleCreateEncounter}
          onDismiss={() => actions.deleteEncounter(encounter.id)}
        />
      </div>
    )
  }

  // ─── Setup Phase ───
  if (encounter.status === 'setup') {
    return (
      <div className="space-y-6">
        <h2 className="font-display text-2xl text-ink-900">Combat Tracker</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <BattleGrid
              width={encounter.grid_width}
              height={encounter.grid_height}
              combatants={combatants}
              mapImageUrl={encounter.map_image_url}
              currentTurnId={null}
              selectedId={selectedId}
              userId={userId}
              isDM={true}
              onSelectCombatant={setSelectedId}
              onMoveCombatant={handleMoveCombatant}
            />
          </div>
          <div>
            <EncounterSetup
              encounter={encounter}
              partyCharacters={partyCharacters.map((c) => ({ character: c, userId: c.user_id }))}
              npcs={npcs}
              existingCombatants={combatants}
              onAddCombatants={(c) => actions.addCombatants(c)}
              onRemoveCombatant={(id) => actions.removeCombatant(id)}
              onUploadMap={(file) => actions.uploadMap({ encounterId: encounter.id, file })}
              onUpdateEncounter={(updates) =>
                actions.updateEncounter({ id: encounter.id, updates })
              }
              onStartInitiative={() =>
                actions.updateEncounter({ id: encounter.id, updates: { status: 'initiative' } })
              }
              onDeleteEncounter={() => actions.deleteEncounter(encounter.id)}
            />
          </div>
        </div>
      </div>
    )
  }

  // ─── Initiative Phase ───
  if (encounter.status === 'initiative') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink-900">Combat Tracker</h2>
          <Button size="sm" variant="danger" onClick={() => actions.updateEncounter({ id: encounter.id, updates: { status: 'setup' } })}>
            Back to Setup
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <BattleGrid
              width={encounter.grid_width}
              height={encounter.grid_height}
              combatants={combatants}
              mapImageUrl={encounter.map_image_url}
              currentTurnId={null}
              selectedId={selectedId}
              userId={userId}
              isDM={true}
              onSelectCombatant={setSelectedId}
              onMoveCombatant={handleMoveCombatant}
            />
          </div>
          <div>
            <InitiativeRollPrompt
              combatants={combatants}
              userId={userId}
              isDM={true}
              onRollInitiative={handleRollInitiative}
              onStartCombat={handleStartCombat}
            />
          </div>
        </div>
      </div>
    )
  }

  // ─── Active Combat ───
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink-900">Combat Tracker</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowLog(!showLog)}>
            <ScrollText size={14} className="mr-1" /> Log ({combatLog.length})
          </Button>
          <Button size="sm" variant="danger" onClick={handleEndEncounter}>
            End Encounter
          </Button>
        </div>
      </div>

      {showLog && combatLog.length > 0 && (
        <div className="max-h-40 overflow-y-auto bg-parchment-50 border border-parchment-300 rounded-lg p-3 space-y-1">
          {combatLog.map((entry, i) => (
            <p key={i} className="text-xs font-mono text-ink-600">{entry}</p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Grid */}
        <div className="lg:col-span-2">
          <BattleGrid
            width={encounter.grid_width}
            height={encounter.grid_height}
            combatants={combatants}
            mapImageUrl={encounter.map_image_url}
            currentTurnId={encounter.current_turn_combatant_id}
            selectedId={selectedId}
            userId={userId}
            isDM={true}
            onSelectCombatant={setSelectedId}
            onMoveCombatant={handleMoveCombatant}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <InitiativeTracker
            combatants={combatants}
            currentTurnId={encounter.current_turn_combatant_id}
            round={encounter.round}
            isDM={true}
            userId={userId}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {currentCombatant && (
            <TurnWizard
              combatant={currentCombatant}
              allCombatants={combatants}
              isDM={true}
              isMyTurn={true}
              round={encounter.round}
              onApplyDamage={handleApplyDamage}
              onApplyHealing={handleApplyHealing}
              onUpdateConditions={handleUpdateConditions}
              onEndTurn={handleEndTurn}
              onLogAction={addLog}
            />
          )}
        </div>
      </div>
    </div>
  )
}
