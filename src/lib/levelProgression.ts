import type { SRDClassLevel } from './dnd5e'

export const XP_THRESHOLDS: Record<number, number> = {
  1: 0, 2: 300, 3: 900, 4: 2700, 5: 6500, 6: 14000, 7: 23000, 8: 34000,
  9: 48000, 10: 64000, 11: 85000, 12: 100000, 13: 120000, 14: 140000,
  15: 165000, 16: 195000, 17: 225000, 18: 265000, 19: 305000, 20: 355000,
}

/** The character level a given total XP qualifies for (1–20). */
export function levelFromXP(xp: number): number {
  for (let level = 20; level >= 1; level--) {
    if (xp >= XP_THRESHOLDS[level]) return level
  }
  return 1
}

/** XP needed to reach the next level, or null if already at 20. */
export function xpToNextLevel(xp: number): number | null {
  const current = levelFromXP(xp)
  if (current >= 20) return null
  return XP_THRESHOLDS[current + 1] - xp
}

/** DMG starting gold by level tier (using average rolls) */
export function getStartingGoldByLevel(level: number): number {
  if (level <= 4) return 0 // use background equipment
  if (level <= 10) return 625 // 500 + 5.5*25
  if (level <= 16) return 6375 // 5000 + 5.5*250
  return 21375 // 20000 + 5.5*250
}

/** Detect which levels grant ASIs by checking for "Ability Score Improvement" features */
export function getASILevels(classLevels: SRDClassLevel[], maxLevel: number): number[] {
  const asiLevels: number[] = []
  for (const cl of classLevels) {
    if (cl.level > maxLevel) break
    if (cl.level <= 1) continue
    const hasASI = cl.features.some(f =>
      f.name.toLowerCase().includes('ability score improvement')
    )
    if (hasASI) asiLevels.push(cl.level)
  }
  return asiLevels
}

/** Compute total HP for a character from level 1 to targetLevel.
 *  Level 1: hitDie + conMod
 *  Levels 2+: (floor(hitDie/2) + 1) + conMod each (min 1 per level)
 *  hpBonus: flat bonus added at the end (from features like Dwarven Toughness, Tough)
 */
export function computeTotalHp(hitDie: number, conMod: number, targetLevel: number, hpBonus = 0): number {
  const level1Hp = hitDie + conMod
  if (targetLevel <= 1) return Math.max(1, level1Hp + hpBonus)
  const avgPerLevel = Math.floor(hitDie / 2) + 1 + conMod
  return Math.max(1, level1Hp) + (targetLevel - 1) * Math.max(1, avgPerLevel) + hpBonus
}

/** Collect all non-ASI features from levels 1..maxLevel */
export function collectFeatures(
  classLevels: SRDClassLevel[],
  maxLevel: number
): { level: number; name: string; index: string }[] {
  const features: { level: number; name: string; index: string }[] = []
  for (const cl of classLevels) {
    if (cl.level > maxLevel) break
    for (const f of cl.features) {
      if (!f.name.toLowerCase().includes('ability score improvement') &&
          !f.name.toLowerCase().includes('subclass feature')) {
        features.push({ level: cl.level, name: f.name, index: f.index })
      }
    }
  }
  return features
}
