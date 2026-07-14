import type { Feature } from './types/database'

/**
 * Features Engine — computes stat modifiers from character features.
 * Matches features by name to apply HP bonuses, AC overrides, and speed bonuses.
 */

function hasFeature(features: Feature[], name: string): boolean {
  return features.some(f => f.name.toLowerCase() === name.toLowerCase())
}

function hasFeatureIncludes(features: Feature[], substring: string): boolean {
  return features.some(f => f.name.toLowerCase().includes(substring.toLowerCase()))
}

// ─── HP Bonuses ───

export function computeHpBonus(features: Feature[], level: number): number {
  let bonus = 0

  // Dwarven Toughness: +1 HP per level
  if (hasFeature(features, 'Dwarven Toughness')) {
    bonus += level
  }

  // Tough feat: +2 HP per level
  if (hasFeature(features, 'Tough')) {
    bonus += level * 2
  }

  // Boon of Fortitude (Epic Boon): +40 HP
  if (hasFeature(features, 'Boon of Fortitude')) {
    bonus += 40
  }

  return bonus
}

/** Per-level HP bonus (for level-up wizard — how much extra HP this single level grants). */
export function computeHpBonusPerLevel(features: Feature[]): number {
  let bonus = 0
  if (hasFeature(features, 'Dwarven Toughness')) bonus += 1
  if (hasFeature(features, 'Tough')) bonus += 2
  return bonus
}

// ─── AC Override ───

interface AcContext {
  dexMod: number
  conMod: number
  wisMod: number
  hasArmor: boolean
  hasShield: boolean
  armorType?: 'light' | 'medium' | 'heavy'
}

/**
 * Returns an AC value if a feature overrides the normal armor calculation,
 * or null if normal armor rules should apply.
 * Only applies when NOT wearing armor (Unarmored Defense).
 */
export function computeAcOverride(features: Feature[], ctx: AcContext): number | null {
  // Defense fighting style: +1 AC while wearing armor
  // This is a bonus, not an override, so we handle it separately
  // (returned via computeAcBonus instead)
  if (ctx.hasArmor) return null // Unarmored Defense only works without armor

  let bestAc: number | null = null

  // Barbarian Unarmored Defense: 10 + DEX + CON
  if (hasFeatureIncludes(features, 'Unarmored Defense')) {
    const source = features.find(f => f.name.toLowerCase().includes('unarmored defense'))
    if (source) {
      const isBarbarian = source.source?.toLowerCase().includes('barbarian') ||
        source.description?.toLowerCase().includes('constitution')
      const isMonk = source.source?.toLowerCase().includes('monk') ||
        source.description?.toLowerCase().includes('wisdom')

      if (isBarbarian) {
        const ac = 10 + ctx.dexMod + ctx.conMod
        if (bestAc === null || ac > bestAc) bestAc = ac
      }
      if (isMonk) {
        const ac = 10 + ctx.dexMod + ctx.wisMod
        if (bestAc === null || ac > bestAc) bestAc = ac
      }
    }
  }

  // Draconic Resilience (Sorcerer): 13 + DEX (no armor)
  if (hasFeature(features, 'Draconic Resilience')) {
    const ac = 13 + ctx.dexMod
    if (bestAc === null || ac > bestAc) bestAc = ac
  }

  // Natural Armor (e.g. Tortle): fixed base AC; DEX does not apply. The value is read
  // from the feature description ("base AC of 17"), defaulting to 17 if unparseable.
  const naturalArmor = features.find(f => f.name.toLowerCase().includes('natural armor'))
  if (naturalArmor) {
    const m = naturalArmor.description?.match(/base AC of (\d+)/i)
    const ac = m ? parseInt(m[1], 10) : 17
    if (bestAc === null || ac > bestAc) bestAc = ac
  }

  return bestAc
}

/** Flat AC bonus that stacks on top of normal armor or unarmored defense. */
export function computeAcBonus(features: Feature[], hasArmor: boolean): number {
  let bonus = 0

  // Defense fighting style: +1 AC while wearing armor
  if (hasArmor && hasFeature(features, 'Defense')) {
    bonus += 1
  }

  return bonus
}

// ─── Speed Bonuses ───

/**
 * Computes bonus speed from features. Does not check for heavy armor
 * (caller should handle that if needed).
 */
export function computeSpeedBonus(features: Feature[], level: number): number {
  let bonus = 0

  // Barbarian Fast Movement: +10 ft at level 5+
  if (hasFeature(features, 'Fast Movement') && level >= 5) {
    bonus += 10
  }

  // Monk Unarmored Movement: scaling speed bonus
  if (hasFeature(features, 'Unarmored Movement')) {
    if (level >= 18) bonus += 30
    else if (level >= 14) bonus += 25
    else if (level >= 10) bonus += 20
    else if (level >= 6) bonus += 15
    else if (level >= 2) bonus += 10
  }

  // Speedy feat: +10 ft permanent
  if (hasFeature(features, 'Speedy')) {
    bonus += 10
  }

  // Boon of Speed (Epic Boon): +30 ft
  if (hasFeature(features, 'Boon of Speed')) {
    bonus += 30
  }

  // Ranger Roving: +10 ft (level 6+, no heavy armor — caller handles armor check)
  if (hasFeature(features, 'Roving')) {
    bonus += 10
  }

  return bonus
}

// ─── Initiative Bonuses ───

/** Computes initiative bonus from features. */
export function computeInitiativeBonus(features: Feature[], profBonus: number): number {
  let bonus = 0

  // Alert feat: add Proficiency Bonus to initiative
  if (hasFeature(features, 'Alert')) {
    bonus += profBonus
  }

  return bonus
}
