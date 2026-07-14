import { Heart, Shield, Gauge, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { computeSpeedBonus } from '@/lib/featuresEngine'
import type { Character, ActiveEffect } from '@/lib/types/database'

interface HeaderProps {
  character?: Character | null
  activeEffects?: ActiveEffect[]
}

export function Header({ character, activeEffects = [] }: HeaderProps) {
  const concentrationEffects = activeEffects.filter((e) => e.is_concentration)
  const conditions = activeEffects.filter((e) => e.effect_type === 'condition')

  return (
    <header className="bg-parchment-100 border-b border-parchment-300 px-3 md:px-6 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 md:gap-6">
        {character && (
          <>
            {/* HP Display */}
            <div className="flex items-center gap-2">
              <Heart size={18} className="text-health" />
              <span className="font-mono text-sm">
                <span className={character.current_hp <= character.max_hp / 4 ? 'text-danger font-bold' : 'text-ink-900'}>
                  {character.current_hp}
                </span>
                <span className="text-ink-300"> / {character.max_hp}</span>
                {character.temp_hp > 0 && (
                  <span className="text-temphp font-semibold"> +{character.temp_hp}</span>
                )}
              </span>
            </div>

            {/* AC Display */}
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-ink-500" />
              <span className="font-mono text-sm text-ink-900">{character.armor_class}</span>
            </div>

            {/* Speed */}
            <div className="flex items-center gap-2">
              <Gauge size={18} className="text-ink-500" />
              <span className="font-mono text-sm text-ink-900">{character.speed + computeSpeedBonus(character.features ?? [], character.level)} ft</span>
            </div>
          </>
        )}
      </div>

      {/* Active Effects */}
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {concentrationEffects.map((effect) => (
          <Badge key={effect.id} variant="arcane">
            <AlertTriangle size={12} className="mr-1" />
            Conc: {effect.name}
          </Badge>
        ))}
        {conditions.map((effect) => (
          <Badge key={effect.id} variant="danger">
            {effect.name}
          </Badge>
        ))}
      </div>
    </header>
  )
}
