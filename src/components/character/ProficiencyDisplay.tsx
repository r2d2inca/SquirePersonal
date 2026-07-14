import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Badge } from '@/components/ui/Badge'
import { MASTERY_DESCRIPTIONS, getWeapon, type WeaponMastery } from '@/lib/weaponData2024'
import type { Proficiencies } from '@/lib/types/database'

interface ProficiencyDisplayProps {
  proficiencies: Proficiencies
}

const SECTIONS: { key: keyof Proficiencies; label: string }[] = [
  { key: 'languages', label: 'Languages' },
  { key: 'tools', label: 'Tools' },
  { key: 'weapons', label: 'Weapons' },
  { key: 'armor', label: 'Armor' },
]

export function ProficiencyDisplay({ proficiencies }: ProficiencyDisplayProps) {
  const [expandedMastery, setExpandedMastery] = useState<string | null>(null)
  const masteries = proficiencies.weaponMasteries ?? []

  return (
    <div>
      <SectionHeader>Proficiencies</SectionHeader>
      <div className="space-y-3">
        {SECTIONS.map(({ key, label }) => {
          const items = proficiencies[key] ?? []
          if (items.length === 0) return null
          return (
            <div key={key}>
              <span className="text-xs font-display uppercase tracking-wider text-ink-500">{label}</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {items.map((item) => (
                  <Badge key={item} variant="gold">{item}</Badge>
                ))}
              </div>
            </div>
          )
        })}

        {/* Weapon Masteries */}
        {masteries.length > 0 && (
          <div>
            <span className="text-xs font-display uppercase tracking-wider text-ink-500">Weapon Masteries</span>
            <div className="space-y-1 mt-1">
              {masteries.map((weapon) => {
                const isExpanded = expandedMastery === weapon
                return (
                  <div key={weapon}>
                    <button
                      onClick={() => setExpandedMastery(isExpanded ? null : weapon)}
                      className="flex items-center justify-between w-full text-left px-2 py-1.5 rounded-lg bg-parchment-50 border border-parchment-300 hover:border-gold-300 transition-colors cursor-pointer"
                    >
                      <span className="font-display text-sm text-ink-900">{weapon}</span>
                      {isExpanded ? <ChevronUp size={14} className="text-ink-400" /> : <ChevronDown size={14} className="text-ink-400" />}
                    </button>
                    {isExpanded && (() => {
                      const weaponData = getWeapon(weapon)
                      const mastery = weaponData?.mastery
                      const desc = mastery ? MASTERY_DESCRIPTIONS[mastery as WeaponMastery] : null
                      return (
                        <div className="ml-2 mt-1 pl-2 border-l-2 border-gold-300">
                          {mastery && desc ? (
                            <div>
                              <Badge variant="arcane">{mastery}</Badge>
                              <p className="text-xs text-ink-500 mt-1">{desc}</p>
                              {weaponData && (
                                <p className="text-xs text-ink-400 mt-1">{weaponData.damage} {weaponData.damageType}{weaponData.properties.length > 0 ? ` — ${weaponData.properties.join(', ')}` : ''}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-ink-400">Weapon mastery details not found.</p>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
