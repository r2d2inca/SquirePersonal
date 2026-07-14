/**
 * Multiclass support utilities.
 * Multiclass data is stored in the character's appearance JSON field
 * alongside other metadata (dragon companion, physical description).
 * Single-class characters don't have multiclass data — all functions
 * gracefully handle this case.
 */

import { CLASS_HIT_DICE } from './dnd5e'
import { getClassData2024 } from './classFeatures2024'
import { extractSubclassFeature } from './featureRefresh'
import type { Feature } from './types/database'

export interface ClassLevel {
  class: string
  level: number
  subclass: string | null
}

export interface MulticlassData {
  classLevels: ClassLevel[]
}

// ─── Read/Write from appearance JSON ───

export function getMulticlassData(appearance: string): MulticlassData | null {
  try {
    const parsed = JSON.parse(appearance)
    if (parsed.classLevels && Array.isArray(parsed.classLevels) && parsed.classLevels.length > 1) {
      return { classLevels: parsed.classLevels }
    }
  } catch {
    // Not valid JSON
  }
  return null
}

export function updateMulticlassData(appearance: string, data: MulticlassData): string {
  try {
    const parsed = JSON.parse(appearance)
    return JSON.stringify({ ...parsed, classLevels: data.classLevels })
  } catch {
    return JSON.stringify({ classLevels: data.classLevels })
  }
}

// ─── Helpers ───

/** Get class levels array — works for both single and multiclass characters */
export function getClassLevels(character: { class: string; level: number; subclass: string | null; appearance: string }): ClassLevel[] {
  const mc = getMulticlassData(character.appearance)
  if (mc) return mc.classLevels

  // Single class character
  return [{
    class: character.class,
    level: character.level,
    subclass: character.subclass,
  }]
}

/** Check if a character has any levels in a specific class */
export function hasClassLevels(character: { class: string; level: number; subclass: string | null; appearance: string }, className: string): boolean {
  const levels = getClassLevels(character)
  return levels.some(cl => cl.class.toLowerCase() === className.toLowerCase())
}

/** Get the level in a specific class (0 if none) */
export function getClassLevel(character: { class: string; level: number; subclass: string | null; appearance: string }, className: string): number {
  const levels = getClassLevels(character)
  const entry = levels.find(cl => cl.class.toLowerCase() === className.toLowerCase())
  return entry?.level ?? 0
}

/** Get the subclass for a specific class */
export function getClassSubclass(character: { class: string; level: number; subclass: string | null; appearance: string }, className: string): string | null {
  const levels = getClassLevels(character)
  const entry = levels.find(cl => cl.class.toLowerCase() === className.toLowerCase())
  return entry?.subclass ?? null
}

/** Check if the character is multiclassed */
export function isMulticlassed(character: { appearance: string }): boolean {
  return getMulticlassData(character.appearance) !== null
}

/** Format class display string: "Fighter 5 / Wizard 5" */
export function formatClassDisplay(classLevels: ClassLevel[]): string {
  return classLevels.map(cl => `${cl.class} ${cl.level}`).join(' / ')
}

/** Build the hit_dice_total string for multiclass: "5d10 + 5d6" */
export function buildHitDiceTotal(classLevels: ClassLevel[]): string {
  return classLevels
    .map(cl => {
      const die = CLASS_HIT_DICE[cl.class.toLowerCase()] ?? 8
      return `${cl.level}d${die}`
    })
    .join(' + ')
}

/** Get the primary class (highest level, or first if tied) */
export function getPrimaryClass(classLevels: ClassLevel[]): ClassLevel {
  return classLevels.reduce((primary, cl) => cl.level > primary.level ? cl : primary, classLevels[0])
}

/** Multiclass spellcasting: compute effective caster level for spell slot table */
export function getMulticlassCasterLevel(classLevels: ClassLevel[]): number {
  const FULL_CASTERS = new Set(['bard', 'cleric', 'druid', 'sorcerer', 'wizard'])
  const HALF_CASTERS = new Set(['paladin', 'ranger', 'barriomancer'])
  const THIRD_CASTERS = new Set(['artificer'])
  // Eldritch Knight (Fighter) and Arcane Trickster (Rogue) count as 1/3

  let casterLevel = 0
  for (const cl of classLevels) {
    const classLower = cl.class.toLowerCase()
    if (FULL_CASTERS.has(classLower)) {
      casterLevel += cl.level
    } else if (HALF_CASTERS.has(classLower)) {
      casterLevel += Math.floor(cl.level / 2)
    } else if (THIRD_CASTERS.has(classLower)) {
      casterLevel += Math.floor(cl.level / 2) // Artificer rounds up but counted as half
    } else if (classLower === 'fighter' && cl.subclass?.toLowerCase().includes('eldritch')) {
      casterLevel += Math.floor(cl.level / 3)
    } else if (classLower === 'rogue' && cl.subclass?.toLowerCase().includes('arcane')) {
      casterLevel += Math.floor(cl.level / 3)
    }
  }
  return casterLevel
}

/** Multiclass spell slot table (PHB p.165) */
export function getMulticlassSpellSlots(casterLevel: number): number[] {
  const table: Record<number, number[]> = {
    0:  [0, 0, 0, 0, 0, 0, 0, 0, 0],
    1:  [2, 0, 0, 0, 0, 0, 0, 0, 0],
    2:  [3, 0, 0, 0, 0, 0, 0, 0, 0],
    3:  [4, 2, 0, 0, 0, 0, 0, 0, 0],
    4:  [4, 3, 0, 0, 0, 0, 0, 0, 0],
    5:  [4, 3, 2, 0, 0, 0, 0, 0, 0],
    6:  [4, 3, 3, 0, 0, 0, 0, 0, 0],
    7:  [4, 3, 3, 1, 0, 0, 0, 0, 0],
    8:  [4, 3, 3, 2, 0, 0, 0, 0, 0],
    9:  [4, 3, 3, 3, 1, 0, 0, 0, 0],
    10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
    11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
    12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
    13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
    14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
    15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
    16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
    17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
    18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
    19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
    20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
  }
  return table[Math.min(20, Math.max(0, casterLevel))] ?? table[0]
}

/**
 * Build the class features a class contributes up to a given level, with the chosen subclass's
 * per-tier features extracted. Used to grant secondary-class features at creation, since the
 * load-time featureRefresh keys on the single-class string and can't backfill multiclass chars.
 */
export function collectClassFeaturesForLevel(className: string, level: number, subclass: string | null): Feature[] {
  const data = getClassData2024(className.toLowerCase())
  if (!data) return []
  const out: Feature[] = []
  for (const f of data.features) {
    if (f.level > level) continue
    if (f.hasChoice) continue // skip ASI / subclass-choice placeholders (chosen elsewhere)
    const isSubclassBlock = f.name === 'Subclass Feature' || f.name.includes('Path Feature')
    if (isSubclassBlock) {
      if (!subclass) continue
      const extracted = extractSubclassFeature(f.description.join('\n\n'), subclass)
      if (extracted && !out.some((o) => o.name === extracted.name)) {
        out.push({ name: extracted.name, description: extracted.description, source: data.name })
      }
      continue
    }
    if (out.some((o) => o.name === f.name)) continue
    out.push({ name: f.name, description: f.description.join('\n\n'), source: data.name })
  }
  return out
}

/** Multiclass proficiency gains (subset of full class proficiencies) */
export const MULTICLASS_PROFICIENCIES: Record<string, { armor: string[]; weapons: string[] }> = {
  artificer: { armor: ['Light Armor', 'Medium Armor', 'Shields'], weapons: [] },
  barbarian: { armor: ['Shields'], weapons: ['Simple Weapons', 'Martial Weapons'] },
  barriomancer: { armor: ['Medium Armor', 'Heavy Armor', 'Shields'], weapons: [] },
  bard: { armor: ['Light Armor'], weapons: ['Simple Weapons'] },
  cleric: { armor: ['Light Armor', 'Medium Armor', 'Shields'], weapons: [] },
  'dragon-rider': { armor: ['Light Armor', 'Medium Armor', 'Shields'], weapons: ['Simple Weapons', 'Martial Weapons'] },
  druid: { armor: ['Light Armor', 'Medium Armor', 'Shields'], weapons: [] },
  fighter: { armor: ['Light Armor', 'Medium Armor', 'Shields'], weapons: ['Simple Weapons', 'Martial Weapons'] },
  monk: { armor: [], weapons: ['Simple Weapons'] },
  paladin: { armor: ['Light Armor', 'Medium Armor', 'Shields'], weapons: ['Simple Weapons', 'Martial Weapons'] },
  ranger: { armor: ['Light Armor', 'Medium Armor', 'Shields'], weapons: ['Simple Weapons', 'Martial Weapons'] },
  rogue: { armor: ['Light Armor'], weapons: ['Simple Weapons'] },
  sorcerer: { armor: [], weapons: [] },
  warlock: { armor: ['Light Armor'], weapons: ['Simple Weapons'] },
  wizard: { armor: [], weapons: [] },
}
