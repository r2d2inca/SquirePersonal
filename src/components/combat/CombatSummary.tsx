import { Skull, Heart, Swords, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { EncounterCombatant } from '@/lib/types/database'

interface CombatSummaryProps {
  combatants: EncounterCombatant[]
  round: number
  isDM: boolean
  onNewEncounter?: () => void
  onDismiss: () => void
}

export function CombatSummary({
  combatants,
  round,
  isDM,
  onNewEncounter,
  onDismiss,
}: CombatSummaryProps) {
  const players = combatants.filter((c) => c.is_player)
  const monsters = combatants.filter((c) => !c.is_player)
  const monstersDown = monsters.filter((c) => c.current_hp <= 0).length
  const playersDown = players.filter((c) => c.current_hp <= 0).length

  return (
    <div className="space-y-4">
      <div className="text-center">
        <Swords size={32} className="mx-auto text-gold-500 mb-2" />
        <h2 className="font-display text-xl text-ink-900">Encounter Complete</h2>
        <p className="text-sm text-ink-500 mt-1">
          {round} round{round !== 1 ? 's' : ''} of combat
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center !p-3">
          <div className="text-2xl font-mono font-bold text-ink-900">{monstersDown}/{monsters.length}</div>
          <div className="text-xs text-ink-500 font-display uppercase">Monsters Defeated</div>
        </Card>
        <Card className="text-center !p-3">
          <div className="text-2xl font-mono font-bold text-ink-900">{players.length - playersDown}/{players.length}</div>
          <div className="text-xs text-ink-500 font-display uppercase">Party Standing</div>
        </Card>
      </div>

      {/* Combatant Results */}
      <Card>
        <h3 className="font-display text-sm uppercase text-ink-500 mb-3">Combatant Results</h3>
        <div className="space-y-1.5">
          {combatants
            .sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0))
            .map((c) => {
              const isDown = c.current_hp <= 0
              const hpPct = c.max_hp > 0 ? (c.current_hp / c.max_hp) * 100 : 100
              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-2 p-2 rounded ${
                    isDown ? 'bg-danger/5 opacity-60' : 'bg-parchment-50'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0 border"
                    style={{
                      backgroundColor: c.token_color,
                      borderColor: c.is_player ? 'var(--color-gold-400)' : '#ef4444',
                    }}
                  />
                  <span className="text-sm font-display flex-1 text-ink-900">{c.name}</span>
                  {c.is_player ? (
                    <Badge variant="gold">PC</Badge>
                  ) : (
                    <Badge variant="danger">NPC</Badge>
                  )}
                  {isDown ? (
                    <div className="flex items-center gap-1 text-danger">
                      <Skull size={12} />
                      <span className="text-xs font-display">Down</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Heart size={12} className="text-heal" />
                      <span className="text-xs font-mono text-ink-700">
                        {c.current_hp}/{c.max_hp}
                      </span>
                      <div className="w-12 h-1.5 bg-parchment-300 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            hpPct > 50 ? 'bg-heal' : hpPct > 25 ? 'bg-gold-400' : 'bg-danger'
                          }`}
                          style={{ width: `${Math.max(0, hpPct)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {c.conditions.length > 0 && (
                    <div className="flex gap-0.5">
                      {c.conditions.map((cond) => (
                        <span
                          key={cond}
                          className="text-[8px] px-1 py-px bg-arcane-400/20 text-arcane-500 rounded"
                        >
                          {cond}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-2 justify-center">
        {isDM && onNewEncounter && (
          <Button onClick={onNewEncounter}>
            <Plus size={14} className="mr-1" /> New Encounter
          </Button>
        )}
        <Button variant="secondary" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}
