import { useState } from 'react'
import { Shield, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { Character } from '@/lib/types/database'

interface Barrier {
  name: string
  minLevel: number
  subclass?: string
  description: string
}

const BASE_BARRIERS: Barrier[] = [
  { name: 'Guard\'s Pavise', minLevel: 1, description: 'Grant a creature within 20 ft temporary HP equal to 2x the Barrier Die rolled.' },
  { name: 'Vanguard\'s Buckler', minLevel: 1, description: 'Grant temporary HP equal to the Die + movement speed bonus (5x dice value in feet).' },
  { name: 'Berserker\'s Ward', minLevel: 1, description: 'Grant temporary HP equal to the Die + weapon damage bonus (equals dice value).' },
]

const GUARDIAN_BARRIERS: Barrier[] = [
  { name: 'Tower Wall', minLevel: 3, subclass: 'Guardian Force', description: '2x Barrier Die temp HP + AC bonus (equals dice value).' },
  { name: 'Apprentice\'s Ward', minLevel: 3, subclass: 'Guardian Force', description: '2x Barrier Die temp HP + spell save bonus (equals dice value).' },
  { name: 'Iron Shell', minLevel: 3, subclass: 'Guardian Force', description: '3x Barrier Die temp HP.' },
  { name: 'Fortress Wall', minLevel: 10, subclass: 'Guardian Force', description: '3x Barrier Die temp HP + AC bonus (equals dice value), 30 ft range.' },
  { name: 'Magus\' Ward', minLevel: 10, subclass: 'Guardian Force', description: '2x Barrier Die temp HP + spell save bonus (2x dice value), 30 ft range.' },
  { name: 'Steel Shell', minLevel: 10, subclass: 'Guardian Force', description: '4x Barrier Die temp HP.' },
  { name: 'Dreadnought Wall', minLevel: 20, subclass: 'Guardian Force', description: '3x Barrier Die temp HP + AC bonus, 40 ft range.' },
  { name: 'Archmage\'s Ward', minLevel: 20, subclass: 'Guardian Force', description: '2x Barrier Die temp HP + 2x dice spell save bonus, evasion-like effect for magical damage, 40 ft range.' },
  { name: 'Adamantine Shell', minLevel: 20, subclass: 'Guardian Force', description: '5x Barrier Die temp HP.' },
]

const ELEMENTAL_BARRIERS: Barrier[] = [
  { name: 'Flame Wall', minLevel: 3, subclass: 'Elemental Force', description: '1x Die temp HP + 1d6 fire to melee attackers, 1d4 fire reflects ranged.' },
  { name: 'Ice Mail', minLevel: 3, subclass: 'Elemental Force', description: '1x Die temp HP + 1d4 cold to melee attackers, fire/cold resistance.' },
  { name: 'Earthen Guard', minLevel: 3, subclass: 'Elemental Force', description: '1x Die temp HP + resistance to non-magical physical damage, AC bonus (half dice value).' },
  { name: 'Gale Cloak', minLevel: 3, subclass: 'Elemental Force', description: '1x Die temp HP + movement bonus (10x dice), 1d6 magical slashing reflects.' },
  { name: 'Robe of Radiance', minLevel: 10, subclass: 'Elemental Force', description: '1x Die temp HP, enhanced movement in bright light (5x dice), light manipulation in 10 ft, 1d4 radiant to fiends/undead.' },
  { name: 'Mantle of Shadow', minLevel: 10, subclass: 'Elemental Force', description: '1x Die temp HP, enhanced movement in darkness (5x dice), light suppression in 10 ft, 1d4 necrotic to celestials/humanoids.' },
]

const BLOOD_BARRIERS: Barrier[] = [
  { name: 'Mending Field', minLevel: 3, subclass: 'Blood Force', description: '1x Die temp HP + healing equal to 1/4 temp HP (minimum 1).' },
  { name: 'Healing Field', minLevel: 10, subclass: 'Blood Force', description: '1x Die temp HP + healing equal to 1/2 temp HP (minimum 1).' },
  { name: 'Vampire\'s Vest', minLevel: 10, subclass: 'Blood Force', description: '1x Die temp HP + regain temp HP equal to 1/2 damage dealt (capped at original amount).' },
  { name: 'Restorative Field', minLevel: 20, subclass: 'Blood Force', description: '2x Die temp HP + 1/2 healing.' },
  { name: 'Master Vampire\'s Vest', minLevel: 20, subclass: 'Blood Force', description: '1x Die temp HP + 1/2 damage recovery (up to 2x original, lasts 1 round after barrier ends).' },
]

const SOUL_BARRIERS: Barrier[] = [
  { name: 'Bear\'s Might', minLevel: 3, subclass: 'Soul Force', description: '1x Die temp HP + Constitution save bonus, 1d6 bludgeoning bonus to attacks.' },
  { name: 'Eagle\'s Sight', minLevel: 3, subclass: 'Soul Force', description: '1x Die temp HP + Wisdom save bonus, 1d6 piercing bonus to ranged attacks.' },
  { name: 'Wolf\'s Tactics', minLevel: 10, subclass: 'Soul Force', description: '1x Die temp HP + Strength save bonus, advantage on melee if ally within 5 ft.' },
  { name: 'Raven\'s Tactics', minLevel: 10, subclass: 'Soul Force', description: '1x Die temp HP + Intelligence check/save bonus, advantage on ranged if ally within 5 ft.' },
  { name: 'Snake\'s Agility', minLevel: 20, subclass: 'Soul Force', description: '1x Die temp HP + Dexterity check/save bonus, advantage vs. grapple/restrained.' },
  { name: 'Fox\'s Cunning', minLevel: 20, subclass: 'Soul Force', description: '1x Die temp HP + Charisma check/save bonus, advantage vs. charmed/frightened.' },
]

const ALL_SUBCLASS_BARRIERS = [...GUARDIAN_BARRIERS, ...ELEMENTAL_BARRIERS, ...BLOOD_BARRIERS, ...SOUL_BARRIERS]

export function BarriomancerBarriersPanel({ character }: { character: Character }) {
  if (!character.class.toLowerCase().includes('barriomancer')) return null

  const [expanded, setExpanded] = useState(true)
  const level = character.level
  const subclass = character.subclass

  const availableBase = BASE_BARRIERS.filter(b => level >= b.minLevel)
  const availableSubclass = ALL_SUBCLASS_BARRIERS.filter(b =>
    level >= b.minLevel && b.subclass === subclass
  )

  const dieSize = level >= 18 ? 'd12' : level >= 7 ? 'd10' : 'd8'

  return (
    <Card>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-arcane-400" />
          <span className="font-display text-xs uppercase tracking-wider text-ink-500">
            Known Barriers ({availableBase.length + availableSubclass.length})
          </span>
          <span className="text-xs text-ink-400 font-mono">{dieSize}</span>
        </div>
        {expanded ? <ChevronUp size={14} className="text-ink-400" /> : <ChevronDown size={14} className="text-ink-400" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Base Barriers */}
          <div>
            <div className="text-[10px] font-display uppercase text-ink-400 mb-1">Base Barriers</div>
            <div className="space-y-1">
              {availableBase.map(b => (
                <div key={b.name} className="text-xs bg-parchment-50 border border-parchment-300 rounded px-2 py-1.5">
                  <span className="font-body font-semibold text-ink-900">{b.name}</span>
                  <span className="text-ink-500 ml-1.5">{b.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subclass Barriers */}
          {availableSubclass.length > 0 && (
            <div>
              <div className="text-[10px] font-display uppercase text-ink-400 mb-1">{subclass} Barriers</div>
              <div className="space-y-1">
                {availableSubclass.map(b => (
                  <div key={b.name} className="text-xs bg-arcane-400/5 border border-arcane-400/20 rounded px-2 py-1.5">
                    <span className="font-body font-semibold text-ink-900">{b.name}</span>
                    <span className="text-ink-500 ml-1.5">{b.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
