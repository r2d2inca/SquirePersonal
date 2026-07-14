import { SectionHeader } from '@/components/ui/SectionHeader'
import { Rollable } from '@/components/ui/Rollable'
import { SKILLS, ABILITY_ABBREVIATIONS } from '@/lib/constants'
import { abilityModifier, proficiencyBonus, skillBonus, formatModifier } from '@/lib/calculations'
import type { Character } from '@/lib/types/database'

interface SkillsListProps {
  character: Character
}

export function SkillsList({ character }: SkillsListProps) {
  const profBonus = proficiencyBonus(character.level)

  return (
    <div>
      <SectionHeader>Skills</SectionHeader>
      <div className="space-y-0.5">
        {SKILLS.map((skill) => {
          const key = skill.name.toLowerCase()
          const isProficient = character.proficiencies.skills?.includes(key) ?? false
          const hasExpertise = character.proficiencies.expertise?.includes(key) ?? false
          const abilityScore = character[skill.ability] as number
          const total = skillBonus(abilityScore, isProficient, character.level, hasExpertise)

          return (
            <Rollable
              key={skill.name}
              label={skill.name}
              modifier={total}
              className="w-full flex items-center gap-2 py-1 px-1"
            >
              <div className="w-2.5 h-2.5 rounded-full border-2 shrink-0" style={{
                backgroundColor: hasExpertise ? 'var(--color-arcane-500)' : isProficient ? 'var(--color-gold-400)' : 'transparent',
                borderColor: hasExpertise ? 'var(--color-arcane-600)' : isProficient ? 'var(--color-gold-500)' : 'var(--color-parchment-400)',
              }} />
              <span className="font-mono text-sm w-8 text-right shrink-0">{formatModifier(total)}</span>
              <span className="text-sm text-ink-900 flex-1">
                {skill.name}
                {hasExpertise && <span className="text-xs text-arcane-500 ml-1">(E)</span>}
              </span>
              <span className="text-xs text-ink-300 font-mono">{ABILITY_ABBREVIATIONS[skill.ability]}</span>
            </Rollable>
          )
        })}
      </div>
    </div>
  )
}
