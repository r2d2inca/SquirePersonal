import { StatBlock } from '@/components/ui/StatBlock'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { ABILITY_SCORES, ABILITY_ABBREVIATIONS } from '@/lib/constants'
import type { Character, CharacterUpdate } from '@/lib/types/database'

interface AbilityScoresProps {
  character: Character
  onUpdate?: (updates: CharacterUpdate) => void
}

export function AbilityScores({ character, onUpdate }: AbilityScoresProps) {
  return (
    <div>
      <SectionHeader>Ability Scores</SectionHeader>
      <div className="grid grid-cols-3 gap-3">
        {ABILITY_SCORES.map((ability) => (
          <StatBlock
            key={ability}
            ability={ability}
            score={character[ability] as number}
            rollLabel={`${ABILITY_ABBREVIATIONS[ability]} Check`}
            onScoreChange={onUpdate ? (val) => onUpdate({ [ability]: val }) : undefined}
          />
        ))}
      </div>
    </div>
  )
}
