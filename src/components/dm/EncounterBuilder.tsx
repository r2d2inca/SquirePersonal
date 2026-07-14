import { useState } from 'react'
import { Plus, Minus, Trash2, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useMonsters, useMonsterDetail } from '@/hooks/useMonsters'
import { useCombatStore, type EncounterMonster } from '@/stores/combatStore'
import { calculateEncounterDifficulty, parseCR, crToXP, getMonsterDetail as fetchMonsterDetail, type DifficultyRating, type SRDMonsterSummary } from '@/lib/dnd5e'

const DIFFICULTY_COLORS: Record<DifficultyRating, string> = {
  Easy: 'bg-heal text-parchment-100',
  Medium: 'bg-gold-400 text-ink-900',
  Hard: 'bg-warning text-parchment-100',
  Deadly: 'bg-danger text-parchment-100',
}

interface EncounterBuilderProps {
  partyLevels: number[]
}

export function EncounterBuilder({ partyLevels }: EncounterBuilderProps) {
  const { encounterMonsters, addEncounterMonster, removeEncounterMonster, updateMonsterQuantity, clearEncounter, addCombatant, startCombat } = useCombatStore()
  const [search, setSearch] = useState('')
  const { monsters: allMonsters, isLoading } = useMonsters()

  const filteredMonsters = search.trim()
    ? allMonsters.filter((m) => m.name.toLowerCase().includes(search.toLowerCase())).slice(0, 20)
    : []

  async function handleAddMonster(monster: SRDMonsterSummary) {
    try {
      const detail = await fetchMonsterDetail(monster.index)
      const m: EncounterMonster = {
        index: monster.index,
        name: detail.name,
        cr: String(detail.challenge_rating),
        hp: detail.hit_points,
        ac: detail.armor_class[0]?.value ?? 10,
        quantity: 1,
      }
      addEncounterMonster(m)
    } catch {
      // Fallback if detail fetch fails
      addEncounterMonster({
        index: monster.index,
        name: monster.name,
        cr: '0',
        hp: 10,
        ac: 10,
        quantity: 1,
      })
    }
  }

  function handleStartEncounter() {
    // Add all encounter monsters as combatants
    for (const m of encounterMonsters) {
      for (let i = 0; i < m.quantity; i++) {
        addCombatant({
          id: crypto.randomUUID(),
          name: m.quantity > 1 ? `${m.name} ${i + 1}` : m.name,
          initiative: Math.floor(Math.random() * 20) + 1,
          maxHp: m.hp,
          currentHp: m.hp,
          armorClass: m.ac,
          isPlayer: false,
          conditions: [],
        })
      }
    }
    startCombat()
  }

  // Calculate difficulty
  const monsterCRs = encounterMonsters.flatMap((m) =>
    Array(m.quantity).fill(parseCR(m.cr))
  )
  const difficultyInfo = partyLevels.length > 0 && monsterCRs.length > 0
    ? calculateEncounterDifficulty(partyLevels, monsterCRs)
    : null

  const totalXP = monsterCRs.reduce((sum, cr) => sum + crToXP(cr), 0)

  return (
    <div className="space-y-6">
      {/* Monster Search */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              placeholder="Search monsters..."
              className="w-full pl-9 pr-4 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400"
            />
          </div>
          {isLoading && <Loader2 size={16} className="animate-spin text-ink-400" />}
        </div>

        {filteredMonsters.length > 0 && (
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredMonsters.map((m) => (
              <div key={m.index} className="flex items-center justify-between p-2 hover:bg-parchment-200/50 rounded">
                <div>
                  <span className="text-sm text-ink-900">{m.name}</span>
                </div>
                <button
                  onClick={() => handleAddMonster(m)}
                  className="p-1 text-ink-300 hover:text-gold-500 cursor-pointer"
                >
                  <Plus size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Encounter List */}
      {encounterMonsters.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="font-display text-sm text-ink-900">Encounter</span>
            <button onClick={clearEncounter} className="text-xs text-ink-300 hover:text-danger cursor-pointer">
              Clear All
            </button>
          </div>

          <div className="space-y-2">
            {encounterMonsters.map((m) => (
              <div key={m.index} className="flex items-center justify-between p-2 bg-parchment-50 border border-parchment-300 rounded">
                <div>
                  <span className="text-sm text-ink-900">{m.name}</span>
                  <span className="text-xs text-ink-400 ml-2">CR {m.cr} · {crToXP(parseCR(m.cr))} XP</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateMonsterQuantity(m.index, m.quantity - 1)}
                    className="p-0.5 text-ink-300 hover:text-ink-700 cursor-pointer"
                    disabled={m.quantity <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-mono text-sm w-6 text-center text-ink-900">{m.quantity}</span>
                  <button
                    onClick={() => updateMonsterQuantity(m.index, m.quantity + 1)}
                    className="p-0.5 text-ink-300 hover:text-ink-700 cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => removeEncounterMonster(m.index)}
                    className="p-0.5 text-ink-300 hover:text-danger cursor-pointer ml-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Difficulty */}
          <div className="mt-3 pt-3 border-t border-parchment-300">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-500">
                Total XP: <span className="font-mono text-ink-700">{totalXP.toLocaleString()}</span>
                {difficultyInfo && (
                  <span className="ml-2">
                    Adjusted: <span className="font-mono text-ink-700">{difficultyInfo.adjustedXP.toLocaleString()}</span>
                  </span>
                )}
              </span>
              {difficultyInfo && (
                <Badge className={DIFFICULTY_COLORS[difficultyInfo.difficulty]}>
                  {difficultyInfo.difficulty}
                </Badge>
              )}
            </div>
            {difficultyInfo && (
              <div className="flex gap-3 mt-2 text-[10px] text-ink-400">
                <span>Easy: {difficultyInfo.thresholds.Easy}</span>
                <span>Med: {difficultyInfo.thresholds.Medium}</span>
                <span>Hard: {difficultyInfo.thresholds.Hard}</span>
                <span>Deadly: {difficultyInfo.thresholds.Deadly}</span>
              </div>
            )}
          </div>

          <Button onClick={handleStartEncounter} className="w-full mt-3" size="sm">
            Start Encounter
          </Button>
        </Card>
      )}
    </div>
  )
}
