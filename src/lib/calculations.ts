import type { AbilityScore } from './constants'
import type { Feature, InventoryItem } from './types/database'
import { computeAcOverride, computeAcBonus } from './featuresEngine'

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function proficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1
}

export function skillBonus(
  abilityScore: number,
  isProficient: boolean,
  level: number,
  hasExpertise = false
): number {
  const mod = abilityModifier(abilityScore)
  const prof = proficiencyBonus(level)
  if (hasExpertise) return mod + prof * 2
  if (isProficient) return mod + prof
  return mod
}

export function savingThrowBonus(
  abilityScore: number,
  isProficient: boolean,
  level: number
): number {
  const mod = abilityModifier(abilityScore)
  if (isProficient) return mod + proficiencyBonus(level)
  return mod
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

export function passivePerception(
  wisdomScore: number,
  isProficient: boolean,
  level: number
): number {
  return 10 + skillBonus(wisdomScore, isProficient, level)
}

// Known armor base AC values (2024 PHB)
const ARMOR_TABLE: Record<string, { base: number; type: 'light' | 'medium' | 'heavy' }> = {
  'padded': { base: 11, type: 'light' },
  'leather': { base: 11, type: 'light' },
  'leather armor': { base: 11, type: 'light' },
  'studded leather': { base: 12, type: 'light' },
  'studded leather armor': { base: 12, type: 'light' },
  'hide': { base: 12, type: 'medium' },
  'hide armor': { base: 12, type: 'medium' },
  'chain shirt': { base: 13, type: 'medium' },
  'scale mail': { base: 14, type: 'medium' },
  'breastplate': { base: 14, type: 'medium' },
  'half plate': { base: 15, type: 'medium' },
  'ring mail': { base: 14, type: 'heavy' },
  'chain mail': { base: 16, type: 'heavy' },
  'splint': { base: 17, type: 'heavy' },
  'splint armor': { base: 17, type: 'heavy' },
  'plate': { base: 18, type: 'heavy' },
  'plate armor': { base: 18, type: 'heavy' },
}

// Sort by longest key first so "studded leather" matches before "leather", etc.
const ARMOR_TABLE_ENTRIES = Object.entries(ARMOR_TABLE).sort(
  ([a], [b]) => b.length - a.length
)

/** Ability score modifiers keyed by score name, used for custom armor AC ability selection. */
export interface AbilityModifiers {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

type ACEquippedItem = Pick<InventoryItem, 'name' | 'category' | 'armor_bonus' | 'weapon_properties' | 'ac_ability_score' | 'max_ability_modifier' | 'ac_bonus'>

/**
 * True if the item is BODY ARMOR (occupies the single armor slot). It qualifies only by
 * positive identification: a known armor name, or a category:'armor' item with an explicit
 * Light/Medium/Heavy type or a base AC value. Accessories (helm, cloak, ring, bracers,
 * amulet, boots) never qualify — even if miscategorized — so they can't hijack the armor
 * slot and tank AC. They contribute only via `ac_bonus`.
 */
function isBodyArmor(i: ACEquippedItem): boolean {
  const name = i.name.toLowerCase()
  if (name.includes('shield')) return false
  if (ARMOR_TABLE_ENTRIES.some(([a]) => name.includes(a))) return true
  if (i.category !== 'armor') return false
  const prop = (i.weapon_properties ?? '').toLowerCase()
  if (prop === 'light' || prop === 'medium' || prop === 'heavy') return true
  return i.armor_bonus != null
}

/** Base AC value of a body-armor item, used to pick the best when several qualify. */
function armorBaseValue(i: ACEquippedItem): number {
  const name = i.name.toLowerCase()
  const entry = ARMOR_TABLE_ENTRIES.find(([a]) => name.includes(a))
  if (entry) return entry[1].base
  return i.armor_bonus ?? 0
}

/** Calculate AC based on equipped armor/shield items, DEX modifier, and character features. */
export function calculateAC(
  dexMod: number,
  equippedItems: ACEquippedItem[],
  features?: Feature[],
  conMod?: number,
  wisMod?: number,
  effectsAcMod?: number,
  abilityMods?: AbilityModifiers,
): number {
  // Look for armor and shields in both 'armor' category and by name matching
  const allItems = equippedItems
  const shield = allItems.find((i) => i.name.toLowerCase().includes('shield'))
  // Only true body armor occupies the armor slot; if several qualify (e.g. a stray
  // miscategorized item), the highest-base one wins so real armor is never displaced.
  const armorCandidates = allItems.filter(isBodyArmor)
  const armor = armorCandidates.length
    ? armorCandidates.reduce((best, cur) => (armorBaseValue(cur) > armorBaseValue(best) ? cur : best))
    : undefined

  // Flat AC bonuses from magic items (Cloak/Ring of Protection, Bracers of Defense,
  // magic helmets). These ADD to AC and stack with armor or Unarmored Defense — they
  // never act as base armor. Summed across all equipped items.
  const acBonusFromItems = allItems.reduce((sum, i) => sum + (i.ac_bonus ?? 0), 0)

  // Determine armor type for feature checks
  let armorType: 'light' | 'medium' | 'heavy' | undefined
  if (armor) {
    const name = armor.name.toLowerCase()
    const tableEntry = ARMOR_TABLE_ENTRIES.find(([key]) => name.includes(key))
    if (tableEntry) {
      armorType = tableEntry[1].type
    } else if (armor.weapon_properties) {
      // Fall back to user-specified armor type from inventory form
      const propLower = armor.weapon_properties.toLowerCase()
      if (propLower === 'light') armorType = 'light'
      else if (propLower === 'medium') armorType = 'medium'
      else if (propLower === 'heavy') armorType = 'heavy'
    }
  }

  // Check for Unarmored Defense or similar feature overrides
  if (features && features.length > 0) {
    const override = computeAcOverride(features, {
      dexMod,
      conMod: conMod ?? 0,
      wisMod: wisMod ?? 0,
      hasArmor: !!armor,
      hasShield: !!shield,
      armorType,
    })
    if (override !== null) {
      // Feature override applies — still add shield bonus, item AC bonuses, and effects
      return override + (shield ? (shield.armor_bonus ?? 2) : 0) + acBonusFromItems + (effectsAcMod ?? 0)
    }
  }

  let ac: number

  if (armor) {
    const name = armor.name.toLowerCase()
    // Try to find in armor table (sorted longest-first for accurate matching)
    const tableEntry = ARMOR_TABLE_ENTRIES.find(([key]) => name.includes(key))

    if (tableEntry) {
      const [, armorData] = tableEntry
      if (armorData.type === 'heavy') {
        ac = armorData.base
      } else if (armorData.type === 'medium') {
        ac = armorData.base + Math.min(dexMod, 2)
      } else {
        ac = armorData.base + dexMod
      }
    } else if (armor.armor_bonus != null) {
      // Fallback to armor_bonus field + armor type from weapon_properties or name heuristics
      const isHeavy = armorType === 'heavy' || ['ring mail', 'chain mail', 'splint', 'plate'].some((a) => name.includes(a))
      const isMedium = armorType === 'medium' || ['hide', 'chain shirt', 'scale mail', 'breastplate', 'half plate'].some((a) => name.includes(a))

      // Determine which ability modifier to use for this custom armor
      const abilityKey = armor.ac_ability_score ?? 'dexterity'
      const abilityMod = abilityMods?.[abilityKey as keyof AbilityModifiers] ?? dexMod
      const maxMod = armor.max_ability_modifier

      if (isHeavy) ac = armor.armor_bonus
      else if (maxMod != null) ac = armor.armor_bonus + Math.min(abilityMod, maxMod)
      else if (isMedium) ac = armor.armor_bonus + Math.min(abilityMod, 2)
      else ac = armor.armor_bonus + abilityMod
    } else {
      ac = 10 + dexMod
    }
  } else {
    ac = 10 + dexMod
  }

  // Shield adds +2 AC
  if (shield) {
    ac += shield.armor_bonus ?? 2
  }

  // Feature AC bonuses (e.g. Defense fighting style: +1 while wearing armor)
  if (features && features.length > 0) {
    ac += computeAcBonus(features, !!armor)
  }

  return ac + acBonusFromItems + (effectsAcMod ?? 0)
}

export function getAbilityScoreValue(
  character: Record<string, unknown>,
  ability: AbilityScore
): number {
  return (character[ability] as number) ?? 10
}
