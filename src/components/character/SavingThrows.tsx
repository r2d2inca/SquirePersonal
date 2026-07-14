import { SectionHeader } from '@/components/ui/SectionHeader'
import { Rollable } from '@/components/ui/Rollable'
import { ABILITY_SCORES, ABILITY_ABBREVIATIONS } from '@/lib/constants'
import { abilityModifier, proficiencyBonus, formatModifier } from '@/lib/calculations'
import type { Character } from '@/lib/types/database'

interface SavingThrowsProps {
  character: Character
}

export function SavingThrows({ character }: SavingThrowsProps) {
  const profBonus = proficiencyBonus(character.level)

  return (
    <div>
      <SectionHeader>Saving Throws</SectionHeader>
      <div className="space-y-1">
        {ABILITY_SCORES.map((ability) => {
          const isProficient = character.proficiencies.savingThrows?.includes(ability) ?? false
          const mod = abilityModifier(character[ability] as number)
          const total = isProficient ? mod + profBonus : mod

          return (
            <Rollable
              key={ability}
              label={`${ABILITY_ABBREVIATIONS[ability]} Save`}
              modifier={total}
              className="w-full flex items-center gap-2 py-1 px-1"
            >
              <div
                className={`w-3 h-3 rounded-full border-2 ${
                  isProficient
                    ? 'bg-gold-400 border-gold-500'
                    : 'bg-transparent border-parchment-400'
                }`}
              />
              <span className="font-mono text-sm w-8 text-right">{formatModifier(total)}</span>
              <span className="text-sm text-ink-700">{ABILITY_ABBREVIATIONS[ability]}</span>
            </Rollable>
          )
        })}
      </div>
    </div>
  )
}
