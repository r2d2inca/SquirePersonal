import { Badge } from '@/components/ui/Badge'
import {
  assessEncounter,
  templateCreatureCount,
  templateTotalXP,
  LEGACY_DIFFICULTY_CLASSES,
  MODERN_RATING_CLASSES,
} from '@/lib/encounterPlanning'
import type { EncounterTemplateMonster } from '@/lib/types/database'

interface EncounterDifficultyCardProps {
  monsters: EncounterTemplateMonster[]
  partyLevels: number[]
  compact?: boolean
}

/**
 * Difficulty under both rulesets. The 2024 budget is the headline (no
 * multiplier, three tiers); the 2014 adjusted-XP thresholds sit underneath for
 * DMs who still think in Easy/Medium/Hard/Deadly.
 */
export function EncounterDifficultyCard({ monsters, partyLevels, compact = false }: EncounterDifficultyCardProps) {
  const { legacy, modern } = assessEncounter(partyLevels, monsters)
  const totalXP = templateTotalXP(monsters)
  const count = templateCreatureCount(monsters)

  if (partyLevels.length === 0) {
    return (
      <p className="text-xs text-ink-400">
        {count > 0 ? `${count} creature${count === 1 ? '' : 's'} · ${totalXP.toLocaleString()} XP · ` : ''}
        Add party members with characters to see difficulty.
      </p>
    )
  }

  if (!modern || !legacy) {
    return <p className="text-xs text-ink-400">Add creatures to see difficulty.</p>
  }

  const fill = Math.min(1, modern.fillRatio)

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Badge className={MODERN_RATING_CLASSES[modern.rating]}>{modern.rating}</Badge>
        <span>{count} creature{count === 1 ? '' : 's'} · {totalXP.toLocaleString()} XP</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-display uppercase tracking-wider text-ink-400">2024 XP Budget</p>
          <p className="text-sm text-ink-700">
            <span className="font-mono">{totalXP.toLocaleString()}</span> XP across {count} creature{count === 1 ? '' : 's'}
          </p>
        </div>
        <Badge className={MODERN_RATING_CLASSES[modern.rating]}>{modern.rating}</Badge>
      </div>

      {/* Budget bar with the three tier marks */}
      <div className="relative h-2 rounded-full bg-parchment-300 overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-gold-400 transition-all" style={{ width: `${fill * 100}%` }} />
        {(['Low', 'Moderate'] as const).map((tier) => (
          <div
            key={tier}
            className="absolute inset-y-0 w-px bg-ink-700/40"
            style={{ left: `${(modern.budgets[tier] / modern.budgets.High) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-ink-400 font-mono">
        <span>Low {modern.budgets.Low.toLocaleString()}</span>
        <span>Mod {modern.budgets.Moderate.toLocaleString()}</span>
        <span>High {modern.budgets.High.toLocaleString()}</span>
      </div>

      <div className="pt-2 border-t border-parchment-300 flex items-center justify-between">
        <div className="text-[10px] text-ink-400">
          <span className="font-display uppercase tracking-wider">2014 adjusted</span>{' '}
          <span className="font-mono">{legacy.adjustedXP.toLocaleString()}</span> ·{' '}
          E {legacy.thresholds.Easy.toLocaleString()} / M {legacy.thresholds.Medium.toLocaleString()} / H {legacy.thresholds.Hard.toLocaleString()} / D {legacy.thresholds.Deadly.toLocaleString()}
        </div>
        <Badge className={LEGACY_DIFFICULTY_CLASSES[legacy.difficulty]}>{legacy.difficulty}</Badge>
      </div>
    </div>
  )
}
