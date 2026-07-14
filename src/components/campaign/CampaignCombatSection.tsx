import { useState } from 'react'
import { Swords } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { BattleGrid } from '@/components/combat/BattleGrid'
import { InitiativeTracker } from '@/components/combat/InitiativeTracker'
import { TurnWizard } from '@/components/combat/TurnWizard'
import { InitiativeRollPrompt } from '@/components/combat/InitiativeRollPrompt'
import { CombatSummary } from '@/components/combat/CombatSummary'
import { useEncounter } from '@/hooks/useEncounter'
import { useEncounterActions } from '@/hooks/useEncounterActions'
import type { StatusConditionName } from '@/lib/types/database'

interface CampaignCombatSectionProps {
  campaignId: string
  userId: string
}

export function CampaignCombatSection({ campaignId, userId }: CampaignCombatSectionProps) {
  const { encounter, combatants, isLoading } = useEncounter(campaignId)
  const actions = useEncounterActions(campaignId)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    )
  }

  if (!encounter) {
    return (
      <EmptyState
        icon={<Swords size={48} />}
        title="No Active Encounter"
        description="Your DM hasn't started combat yet. When they do, it will appear here."
      />
    )
  }

  const currentCombatant = combatants.find((c) => c.id === encounter.current_turn_combatant_id)
  const myCombatant = combatants.find((c) => c.user_id === userId && c.is_player)
  const isMyTurn = currentCombatant?.user_id === userId

  function handleMoveCombatant(id: string, x: number, y: number) {
    actions.updateCombatant({ id, updates: { grid_x: x, grid_y: y } }).catch(() => {})
  }

  function handleApplyDamage(targetId: string, damage: number) {
    const target = combatants.find((c) => c.id === targetId)
    if (!target) return
    const newHp = Math.max(0, target.current_hp - damage)
    actions.updateCombatant({ id: targetId, updates: { current_hp: newHp } })
  }

  function handleApplyHealing(targetId: string, healing: number) {
    const target = combatants.find((c) => c.id === targetId)
    if (!target) return
    const newHp = Math.min(target.max_hp, target.current_hp + healing)
    actions.updateCombatant({ id: targetId, updates: { current_hp: newHp } })
  }

  function handleUpdateConditions(targetId: string, conditions: StatusConditionName[]) {
    actions.updateCombatant({ id: targetId, updates: { conditions } })
  }

  function handleRollInitiative(combatantId: string, initiative: number) {
    actions.updateCombatant({ id: combatantId, updates: { initiative } })
  }

  function handleEndTurn() {
    if (!encounter) return
    actions.advanceTurn({
      encounterId: encounter.id,
      combatants: combatants.map((c) => ({ id: c.id, initiative: c.initiative })),
      currentTurnId: encounter.current_turn_combatant_id,
      round: encounter.round,
    })
  }

  // ─── Completed — Show Summary ───
  if (encounter.status === 'completed') {
    return (
      <CombatSummary
        combatants={combatants}
        round={encounter.round}
        isDM={false}
        onDismiss={() => {}}
      />
    )
  }

  // ─── Setup Phase (player waits) ───
  if (encounter.status === 'setup') {
    return (
      <EmptyState
        icon={<Swords size={48} />}
        title="Encounter Being Prepared"
        description="Your DM is setting up the encounter. Stand by..."
      />
    )
  }

  // ─── Initiative Phase ───
  if (encounter.status === 'initiative') {
    return (
      <div className="space-y-4">
        <h3 className="font-display text-lg text-ink-900">Combat Starting!</h3>
        <InitiativeRollPrompt
          combatants={combatants}
          userId={userId}
          isDM={false}
          onRollInitiative={handleRollInitiative}
          onStartCombat={() => {}}
        />
      </div>
    )
  }

  // ─── Active Combat ───
  return (
    <div className="space-y-4">
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
            isDM={false}
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
            isDM={false}
            userId={userId}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {currentCombatant && (
            <TurnWizard
              combatant={currentCombatant}
              allCombatants={combatants}
              isDM={false}
              isMyTurn={isMyTurn}
              round={encounter.round}
              onApplyDamage={handleApplyDamage}
              onApplyHealing={handleApplyHealing}
              onUpdateConditions={handleUpdateConditions}
              onEndTurn={handleEndTurn}
              onLogAction={() => {}}
            />
          )}
        </div>
      </div>
    </div>
  )
}
