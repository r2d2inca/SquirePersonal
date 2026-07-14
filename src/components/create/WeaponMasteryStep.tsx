import { useState } from 'react'
import { Swords, Info } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { WEAPONS_2024, MASTERY_DESCRIPTIONS, type Weapon2024, type WeaponMastery } from '@/lib/weaponData2024'

interface WeaponMasteryStepProps {
  /** How many weapons the character can choose mastery for */
  maxChoices: number
  /** Currently selected weapon names */
  selected: string[]
  /** Weapons the character is proficient with (filters available choices) */
  weaponProficiencies: string[]
  /** Callback when selections change */
  onChange: (selected: string[]) => void
  /** Class name for display */
  className: string
}

function hasWeaponProficiency(weapon: Weapon2024, proficiencies: string[]): boolean {
  const profs = proficiencies.map(p => p.toLowerCase())
  // Check exact weapon name
  if (profs.includes(weapon.name.toLowerCase())) return true
  // Check category proficiency
  if (weapon.category.startsWith('Simple') && profs.some(p => p.includes('simple'))) return true
  if (weapon.category.startsWith('Martial') && profs.some(p => p.includes('martial'))) return true
  // Monk special: martial weapons with Light property
  if (profs.some(p => p.includes('light property')) && weapon.category.startsWith('Martial') && weapon.properties.includes('Light')) return true
  return false
}

export function WeaponMasteryStep({ maxChoices, selected, weaponProficiencies, onChange, className }: WeaponMasteryStepProps) {
  const [expandedMastery, setExpandedMastery] = useState<WeaponMastery | null>(null)

  const availableWeapons = WEAPONS_2024.filter(w => hasWeaponProficiency(w, weaponProficiencies))

  // Group by mastery property for display
  const byMastery = availableWeapons.reduce((acc, w) => {
    if (!acc[w.mastery]) acc[w.mastery] = []
    acc[w.mastery].push(w)
    return acc
  }, {} as Record<WeaponMastery, Weapon2024[]>)

  function toggleWeapon(weaponName: string) {
    if (selected.includes(weaponName)) {
      onChange(selected.filter(s => s !== weaponName))
    } else if (selected.length < maxChoices) {
      onChange([...selected, weaponName])
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-500">
        As a {className}, your training with weapons allows you to use the mastery property of{' '}
        <span className="font-bold text-ink-700">{maxChoices}</span> weapon{maxChoices !== 1 ? 's' : ''} of your choice.
        You can change these whenever you finish a Long Rest.
      </p>

      <div className="flex items-center gap-2 text-sm text-ink-700">
        <Swords size={16} className="text-gold-500" />
        <span className="font-display uppercase">
          {selected.length} / {maxChoices} Selected
        </span>
      </div>

      {/* Selected weapons summary */}
      {selected.length > 0 && (
        <Card>
          <div className="text-xs font-display uppercase text-ink-500 mb-2">Your Weapon Masteries</div>
          <div className="flex flex-wrap gap-2">
            {selected.map(name => {
              const weapon = WEAPONS_2024.find(w => w.name === name)
              return (
                <button
                  key={name}
                  onClick={() => toggleWeapon(name)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-200 border border-gold-400 text-sm text-ink-900 cursor-pointer hover:bg-gold-300 transition-colors"
                >
                  <span className="font-medium">{name}</span>
                  {weapon && (
                    <span className="text-xs text-gold-700">({weapon.mastery})</span>
                  )}
                  <span className="text-ink-400 ml-1">&times;</span>
                </button>
              )
            })}
          </div>
        </Card>
      )}

      {/* Weapons grouped by mastery */}
      <div className="space-y-3">
        {(Object.entries(byMastery) as [WeaponMastery, Weapon2024[]][])
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([mastery, weapons]) => (
          <Card key={mastery}>
            <button
              onClick={() => setExpandedMastery(expandedMastery === mastery ? null : mastery)}
              className="w-full flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="font-display text-sm uppercase text-ink-700">{mastery}</span>
                <span className="text-xs text-ink-400">({weapons.length} weapons)</span>
              </div>
              <Info size={14} className="text-ink-400" />
            </button>

            {expandedMastery === mastery && (
              <p className="text-xs text-ink-500 mt-2 mb-3 pl-1 border-l-2 border-gold-300 ml-1">
                {MASTERY_DESCRIPTIONS[mastery]}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-3">
              {weapons.map(weapon => {
                const isSelected = selected.includes(weapon.name)
                const isDisabled = !isSelected && selected.length >= maxChoices
                return (
                  <button
                    key={weapon.name}
                    onClick={() => !isDisabled && toggleWeapon(weapon.name)}
                    disabled={isDisabled}
                    className={`flex items-center justify-between p-2 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'border-gold-400 bg-gold-100/60'
                        : isDisabled
                          ? 'border-parchment-200 bg-parchment-50 opacity-40 cursor-default'
                          : 'border-parchment-300 hover:border-gold-300 cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium text-ink-900">{weapon.name}</div>
                      <div className="text-xs text-ink-500">
                        {weapon.damage} {weapon.damageType} · {weapon.category}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-gold-400 flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">&#10003;</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
