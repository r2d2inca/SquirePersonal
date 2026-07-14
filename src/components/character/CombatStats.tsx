import { Heart, Shield, Zap, Gauge, Star } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Rollable } from '@/components/ui/Rollable'
import { proficiencyBonus, abilityModifier, formatModifier, passivePerception, skillBonus } from '@/lib/calculations'
import { computeSpeedBonus, computeInitiativeBonus } from '@/lib/featuresEngine'
import type { Character, CharacterUpdate } from '@/lib/types/database'

interface CombatStatsProps {
  character: Character
  onUpdate?: (updates: CharacterUpdate) => void
}

export function CombatStats({ character, onUpdate }: CombatStatsProps) {
  const profBonus = proficiencyBonus(character.level)
  // Initiative = DEX modifier + initiative_bonus (which stores extra bonuses like Alert's PB)
  const initBonus = abilityModifier(character.dexterity) + (character.initiative_bonus ?? 0)
  const speedBonus = computeSpeedBonus(character.features ?? [], character.level)
  const totalSpeed = character.speed + speedBonus

  const passiveInvestigation = 10 + skillBonus(
    character.intelligence,
    character.proficiencies?.skills?.includes('investigation') ?? false,
    character.level,
  )
  const passiveInsight = 10 + skillBonus(
    character.wisdom,
    character.proficiencies?.skills?.includes('insight') ?? false,
    character.level,
  )

  const hasInspiration = !!character.heroic_inspiration

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <SectionHeader>Combat</SectionHeader>
        <button
          onClick={() => onUpdate?.({ heroic_inspiration: !hasInspiration })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 transition-colors cursor-pointer ${
            hasInspiration
              ? 'border-gold-400 bg-gold-100/50 text-gold-700'
              : 'border-parchment-300 bg-parchment-50 text-ink-400 hover:border-gold-300'
          }`}
          title={hasInspiration ? 'You have Heroic Inspiration' : 'No Heroic Inspiration'}
        >
          <Star size={14} className={hasInspiration ? 'fill-gold-500 text-gold-500' : ''} />
          <span className="font-display text-xs uppercase">Inspiration</span>
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* HP */}
        <Card className="!p-4 text-center">
          <Heart size={20} className="text-health mx-auto mb-1" />
          <div className="font-display text-xs uppercase tracking-[0.16em] text-ink-500">Hit Points</div>
          <div className="font-mono text-xl">
            <span className={character.current_hp <= character.max_hp / 4 ? 'text-danger' : 'text-ink-900'}>
              {character.current_hp}
            </span>
            <span className="text-ink-300 text-sm"> / {character.max_hp}</span>
          </div>
          {character.temp_hp > 0 && (
            <div className="font-mono text-sm text-temphp font-semibold">+{character.temp_hp} temp</div>
          )}
        </Card>

        {/* AC */}
        <Card className="!p-4 text-center">
          <Shield size={20} className="text-ink-500 mx-auto mb-1" />
          <div className="font-display text-xs uppercase tracking-[0.16em] text-ink-500">Armor Class</div>
          <div className="font-mono text-2xl text-ink-900">{character.armor_class}</div>
        </Card>

        {/* Initiative */}
        <Card className="!p-4 text-center">
          <Zap size={20} className="text-gold-500 mx-auto mb-1" />
          <div className="font-display text-xs uppercase tracking-[0.16em] text-ink-500">Initiative</div>
          <Rollable label="Initiative" modifier={initBonus} className="px-2 mx-auto block">
            <div className="font-mono text-2xl text-ink-900">{formatModifier(initBonus)}</div>
          </Rollable>
        </Card>

        {/* Speed */}
        <Card className="!p-4 text-center">
          <Gauge size={20} className="text-ink-500 mx-auto mb-1" />
          <div className="font-display text-xs uppercase tracking-[0.16em] text-ink-500">Speed</div>
          <div className="font-mono text-2xl text-ink-900">{totalSpeed}<span className="text-sm text-ink-300"> ft</span></div>
        </Card>
      </div>

      {/* Extra combat info */}
      <div className="mt-3 flex items-center gap-4 text-sm text-ink-500 flex-wrap">
        <span>Proficiency Bonus: <span className="font-mono text-ink-900">+{profBonus}</span></span>
        <span>Passive Perception: <span className="font-mono text-ink-900">{passivePerception(character.wisdom, character.proficiencies?.skills?.includes('perception') ?? false, character.level)}</span></span>
        <span>Passive Investigation: <span className="font-mono text-ink-900">{passiveInvestigation}</span></span>
        <span>Passive Insight: <span className="font-mono text-ink-900">{passiveInsight}</span></span>
        <span>Hit Dice: <span className="font-mono text-ink-900">{character.hit_dice_remaining}/{character.hit_dice_total}</span></span>
      </div>
    </div>
  )
}
