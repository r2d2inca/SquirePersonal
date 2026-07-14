import { proficiencyBonus } from './calculations'

export interface DragonCompanionData {
  dragonName: string
  dragonElement: DragonElement
  dragonCurrentHp: number
}

export type DragonElement = 'Fire' | 'Cold' | 'Lightning' | 'Acid' | 'Poison' | 'Thunder' | 'Radiant' | 'Necrotic'

export const DRAGON_ELEMENTS: DragonElement[] = ['Fire', 'Cold', 'Lightning', 'Acid', 'Poison', 'Thunder', 'Radiant', 'Necrotic']

interface CompanionTier {
  minLevel: number
  size: string
  walk: number
  fly: number
  biteDie: string
  notes: string
}

const COMPANION_TIERS: CompanionTier[] = [
  { minLevel: 1,  size: 'Tiny',   walk: 30, fly: 20, biteDie: '1d6',  notes: '' },
  { minLevel: 3,  size: 'Small',  walk: 30, fly: 30, biteDie: '1d8',  notes: 'Breath: 2d6 / 15-ft cone' },
  { minLevel: 5,  size: 'Medium', walk: 30, fly: 40, biteDie: '1d10', notes: 'Breath: 3d6, Claws 1d4' },
  { minLevel: 8,  size: 'Medium', walk: 30, fly: 50, biteDie: '1d10', notes: 'Breath: 4d6, Guardian Instinct' },
  { minLevel: 11, size: 'Large',  walk: 40, fly: 60, biteDie: '2d6',  notes: 'Breath: 5d6, Pulse, Claws 1d6' },
  { minLevel: 15, size: 'Large',  walk: 40, fly: 70, biteDie: '2d8',  notes: 'Breath: 6d6, Tail 1d8, Claws 1d8' },
  { minLevel: 17, size: 'Huge',   walk: 40, fly: 80, biteDie: '2d10', notes: 'Breath: 7d6, Aegis' },
]

function getTier(level: number): CompanionTier {
  let tier = COMPANION_TIERS[0]
  for (const t of COMPANION_TIERS) {
    if (level >= t.minLevel) tier = t
  }
  return tier
}

export function getCompanionStats(level: number) {
  const tier = getTier(level)
  const pb = proficiencyBonus(level)
  const maxHp = 12 + (6 * level)
  const ac = 13 + pb

  return {
    size: tier.size,
    ac,
    maxHp,
    walk: tier.walk,
    fly: tier.fly,
    biteDamage: `${tier.biteDie} + ${pb}`,
    saveBonusAll: `+${pb}`,
    notes: tier.notes,
    passivePerception: 12 + pb,
  }
}

export interface CompanionAttack {
  name: string
  minLevel: number
  toHit: string
  reach: string
  damage: string
  notes?: string
}

export function getCompanionAttacks(level: number): CompanionAttack[] {
  const pb = proficiencyBonus(level)
  const tier = getTier(level)
  const attacks: CompanionAttack[] = []

  attacks.push({
    name: 'Bite',
    minLevel: 1,
    toHit: `+${pb} + Str/Dex`,
    reach: '5 ft',
    damage: `${tier.biteDie} + ${pb} piercing`,
  })

  if (level >= 5) {
    const clawDie = level >= 15 ? '1d8' : level >= 11 ? '1d6' : '1d4'
    attacks.push({
      name: 'Claws',
      minLevel: 5,
      toHit: `+${pb} + Str/Dex`,
      reach: '5 ft',
      damage: `${clawDie} slashing`,
      notes: 'Secondary attack (no PB to damage)',
    })
  }

  if (level >= 15) {
    attacks.push({
      name: 'Tail Swipe',
      minLevel: 15,
      toHit: `+${pb} + Str/Dex`,
      reach: '10 ft',
      damage: `1d8 + ${pb} bludgeoning`,
      notes: 'STR save or knocked prone',
    })
  }

  return attacks
}

export interface CompanionAbility {
  name: string
  minLevel: number
  description: string
}

export function getCompanionAbilities(level: number): CompanionAbility[] {
  const pb = proficiencyBonus(level)
  const all: CompanionAbility[] = [
    { name: 'Keen Sense', minLevel: 1, description: 'Advantage on Wisdom (Perception) checks.' },
    { name: 'Breath Weapon', minLevel: 3, description: `15-ft cone or 30-ft line. DEX save (DC 8 + PB + Wis mod). ${pb} uses per long rest.` },
    { name: 'Aerial Balance', minLevel: 5, description: 'Advantage on saves to avoid being knocked prone while flying.' },
    { name: 'Draconic Roar', minLevel: 7, description: `Roar (action, 1/LR). Enemies in 20 ft: WIS save (DC 8 + PB + Wis) or Frightened until end of next turn.` },
    { name: 'Guardian Instinct', minLevel: 8, description: 'When an enemy attacks you within 5 ft, dragon uses reaction to impose disadvantage.' },
    { name: 'Elemental Pulse', minLevel: 11, description: `When dragon uses breath, creatures within 5 ft: CON save (DC 8 + PB + Con) or take ${pb} elemental damage.` },
    { name: 'Elemental Aegis', minLevel: 17, description: `Enemies within 5 ft take ${pb} elemental damage at start of their turn. Allies within 5 ft gain temp resistance and heal ${pb} HP at start of their turn.` },
  ]

  return all.filter(a => level >= a.minLevel)
}

// Read dragon data from the character's appearance JSON
export function getDragonData(appearance: string): DragonCompanionData | null {
  try {
    const parsed = JSON.parse(appearance)
    if (parsed.dragonName && parsed.dragonElement) {
      return {
        dragonName: parsed.dragonName,
        dragonElement: parsed.dragonElement,
        dragonCurrentHp: parsed.dragonCurrentHp ?? 0,
      }
    }
  } catch {
    // Not valid JSON or no dragon data
  }
  return null
}

// Update dragon data in the character's appearance JSON
export function updateDragonData(appearance: string, updates: Partial<DragonCompanionData>): string {
  try {
    const parsed = JSON.parse(appearance)
    return JSON.stringify({ ...parsed, ...updates })
  } catch {
    return JSON.stringify(updates)
  }
}
