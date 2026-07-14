import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { AbilityScore } from '@/lib/constants'

interface ASIAllocation {
  mode: 'single' | 'dual'
  first: AbilityScore
  second: AbilityScore
}

interface ASIStepProps {
  asiLevels: number[]
  asiAllocations: Record<number, ASIAllocation>
  onAllocationsChange: (allocs: Record<number, ASIAllocation>) => void
  abilityLabels: Record<string, string>
  abilityScores: readonly string[]
}

export function ASIStep({
  asiLevels,
  asiAllocations,
  onAllocationsChange,
  abilityLabels,
  abilityScores,
}: ASIStepProps) {
  function updateAllocation(level: number, patch: Partial<ASIAllocation>) {
    const current = asiAllocations[level] ?? { mode: 'single', first: 'strength' as AbilityScore, second: 'dexterity' as AbilityScore }
    const updated = { ...current, ...patch }
    // If switching to dual and both are the same, fix second
    if (updated.mode === 'dual' && updated.first === updated.second) {
      const alt = abilityScores.find(a => a !== updated.first)
      if (alt) updated.second = alt as AbilityScore
    }
    onAllocationsChange({ ...asiAllocations, [level]: updated })
  }

  return (
    <div className="space-y-4">
      {asiLevels.map(level => {
        const alloc = asiAllocations[level] ?? { mode: 'single', first: 'strength' as AbilityScore, second: 'dexterity' as AbilityScore }
        return (
          <Card key={level}>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="gold">Lvl {level}</Badge>
              <span className="font-display text-sm text-ink-900">Ability Score Improvement</span>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => updateAllocation(level, { mode: 'single' })}
                className={`flex-1 p-2 rounded-lg border-2 text-center cursor-pointer transition-colors ${
                  alloc.mode === 'single' ? 'border-gold-400 bg-gold-100/50' : 'border-parchment-300'
                }`}
              >
                <div className="font-display text-xs uppercase">+2 to one ability</div>
              </button>
              <button
                onClick={() => updateAllocation(level, { mode: 'dual' })}
                className={`flex-1 p-2 rounded-lg border-2 text-center cursor-pointer transition-colors ${
                  alloc.mode === 'dual' ? 'border-gold-400 bg-gold-100/50' : 'border-parchment-300'
                }`}
              >
                <div className="font-display text-xs uppercase">+1 to two abilities</div>
              </button>
            </div>

            {alloc.mode === 'single' ? (
              <div>
                <label className="block text-xs font-display uppercase text-ink-500 mb-1">+2 Bonus</label>
                <select
                  value={alloc.first}
                  onChange={e => updateAllocation(level, { first: e.target.value as AbilityScore })}
                  className="w-full px-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400"
                >
                  {abilityScores.map(ab => (
                    <option key={ab} value={ab}>{abilityLabels[ab]}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-display uppercase text-ink-500 mb-1">First +1</label>
                  <select
                    value={alloc.first}
                    onChange={e => {
                      const val = e.target.value as AbilityScore
                      if (val === alloc.second) {
                        updateAllocation(level, { first: val, second: alloc.first })
                      } else {
                        updateAllocation(level, { first: val })
                      }
                    }}
                    className="w-full px-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400"
                  >
                    {abilityScores.map(ab => (
                      <option key={ab} value={ab}>{abilityLabels[ab]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-display uppercase text-ink-500 mb-1">Second +1</label>
                  <select
                    value={alloc.second}
                    onChange={e => {
                      const val = e.target.value as AbilityScore
                      if (val === alloc.first) {
                        updateAllocation(level, { second: val, first: alloc.second })
                      } else {
                        updateAllocation(level, { second: val })
                      }
                    }}
                    className="w-full px-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400"
                  >
                    {abilityScores.map(ab => (
                      <option key={ab} value={ab}>{abilityLabels[ab]}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
