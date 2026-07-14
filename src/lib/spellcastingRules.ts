import type { SRDClassLevel } from './dnd5e'
import { getSpellcasting2024, getWarlockPactMagic, has2024SpellData, getPreparedSpells2024 } from './spellcastingData'

export interface SpellSelectionRules {
  cantripsKnown: number
  spellsToSelect: number
  spellSelectionLabel: string
  isPreparedCaster: boolean
  preparedCount: number
  hasSpells: boolean
  maxSpellLevel: number
  /** Per-spell-level caps (e.g., { 1: 8, 2: 4, 3: 2 }) — only set for Wizard */
  perLevelCaps?: Record<number, number>
}

const PREPARED_CASTERS = new Set(['cleric', 'druid', 'paladin', 'artificer', 'barriomancer'])
const HALF_CASTERS = new Set(['paladin', 'ranger', 'artificer', 'barriomancer'])
const WIZARD = 'wizard'

export function getSpellSelectionRules(
  className: string,
  classLevelData: SRDClassLevel | undefined,
  abilityMod: number,
  level: number = 1,
): SpellSelectionRules {
  const classLower = className.toLowerCase()

  // ─── Use 2024 PHB data when available ───
  if (has2024SpellData(classLower)) {
    return get2024Rules(classLower, abilityMod, level)
  }

  // ─── Fallback to SRD API data ───
  const sc = classLevelData?.spellcasting
  const cantripsKnown = sc?.cantrips_known ?? 0
  const hasSlots = (sc?.spell_slots_level_1 ?? 0) > 0

  if (!sc || (!cantripsKnown && !hasSlots)) {
    return {
      cantripsKnown: 0,
      spellsToSelect: 0,
      spellSelectionLabel: '',
      isPreparedCaster: false,
      preparedCount: 0,
      hasSpells: false,
      maxSpellLevel: 0,
    }
  }

  let maxSpellLevel = 0
  for (let i = 1; i <= 9; i++) {
    const key = `spell_slots_level_${i}` as keyof typeof sc
    if ((sc[key] as number) > 0) maxSpellLevel = i
  }

  return {
    cantripsKnown,
    spellsToSelect: sc.spells_known ?? 0,
    spellSelectionLabel: 'Spells Known',
    isPreparedCaster: false,
    preparedCount: 0,
    hasSpells: cantripsKnown > 0 || (sc.spells_known ?? 0) > 0 || hasSlots,
    maxSpellLevel,
  }
}

/** Build spell selection rules from 2024 PHB data */
function get2024Rules(classLower: string, abilityMod: number, level: number): SpellSelectionRules {
  const isPreparedCaster = PREPARED_CASTERS.has(classLower)

  // Warlock uses Pact Magic (special case)
  if (classLower === 'warlock') {
    const wl = getWarlockPactMagic(level)
    return {
      cantripsKnown: wl.cantripsKnown,
      spellsToSelect: wl.spellsKnown,
      spellSelectionLabel: 'Spells Known',
      isPreparedCaster: false,
      preparedCount: 0,
      hasSpells: true,
      maxSpellLevel: wl.slotLevel,
    }
  }

  const data = getSpellcasting2024(classLower, level)
  if (!data) {
    return {
      cantripsKnown: 0, spellsToSelect: 0, spellSelectionLabel: '',
      isPreparedCaster: false, preparedCount: 0, hasSpells: false, maxSpellLevel: 0,
    }
  }

  // Compute max spell level from slots
  let maxSpellLevel = 0
  for (let i = 0; i < data.spellSlots.length; i++) {
    if (data.spellSlots[i] > 0) maxSpellLevel = i + 1
  }

  const hasSlots = maxSpellLevel > 0

  // Determine spells to select
  let spellsToSelect = 0
  let spellSelectionLabel = 'Spells Known'
  let perLevelCaps: Record<number, number> | undefined

  if (classLower === WIZARD) {
    spellsToSelect = 6 + 2 * (level - 1)
    spellSelectionLabel = 'Spellbook Spells'

    // Per-level caps for Wizard spellbook
    // Wizards start with 6 first-level spells, then gain 2 per level-up.
    // Spell level N unlocks at class level (2*N - 1).
    // Cap per level = the 2 spells gained at each level-up where that was the highest new tier.
    if (level > 1 && maxSpellLevel > 0) {
      perLevelCaps = {}
      for (let sl = 1; sl <= maxSpellLevel; sl++) {
        const unlocksAt = sl === 1 ? 1 : 2 * sl - 1
        const nextUnlocksAt = 2 * (sl + 1) - 1
        const exclusiveLevels = Math.max(0, Math.min(level, nextUnlocksAt - 1) - unlocksAt + 1)
        perLevelCaps[sl] = sl === 1
          ? 6 + 2 * Math.max(0, exclusiveLevels - 1)
          : 2 * exclusiveLevels
      }
    }
  } else if (isPreparedCaster) {
    spellsToSelect = 0
    spellSelectionLabel = 'Prepared Spells'
  } else {
    // Bard, Sorcerer, Ranger — 2024 fixed "Prepared Spells" count (they swap on level-up in
    // this app's model). Fall back to the stored spellsKnown if there's no 2024 table.
    spellsToSelect = getPreparedSpells2024(classLower, level) ?? data.spellsKnown ?? 0
  }

  let preparedCount = 0
  if (isPreparedCaster) {
    // 2024: a fixed number from the class table, NOT ability mod + level. Homebrew
    // half-casters without an official table fall back to the legacy formula.
    const fixed = getPreparedSpells2024(classLower, level)
    if (fixed != null) {
      preparedCount = fixed
    } else if (HALF_CASTERS.has(classLower)) {
      preparedCount = Math.max(1, abilityMod + Math.floor(level / 2))
    } else {
      preparedCount = Math.max(1, abilityMod + level)
    }
  }

  return {
    cantripsKnown: data.cantripsKnown,
    spellsToSelect,
    spellSelectionLabel,
    isPreparedCaster,
    preparedCount,
    hasSpells: data.cantripsKnown > 0 || spellsToSelect > 0 || hasSlots,
    maxSpellLevel,
    perLevelCaps,
  }
}
