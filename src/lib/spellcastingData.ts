/**
 * 2024 PHB spellcasting progression tables.
 * Accurate to 2024 PHB (5.5e) rules.
 */

export interface SpellcastingProgression {
  cantripsKnown: number
  spellsKnown?: number  // for known-casters (Bard, Sorcerer, Ranger, Warlock)
  spellSlots: number[]   // index 0 = 1st level slots, index 8 = 9th level slots
}

// Warlock uses Pact Magic (different system)
export interface WarlockProgression {
  cantripsKnown: number
  spellsKnown: number
  pactSlots: number
  slotLevel: number
}

// ─── Full Casters ───

const WIZARD_PROGRESSION: Record<number, SpellcastingProgression> = {
  1:  { cantripsKnown: 3, spellSlots: [2, 0, 0, 0, 0, 0, 0, 0, 0] },
  2:  { cantripsKnown: 3, spellSlots: [3, 0, 0, 0, 0, 0, 0, 0, 0] },
  3:  { cantripsKnown: 3, spellSlots: [4, 2, 0, 0, 0, 0, 0, 0, 0] },
  4:  { cantripsKnown: 4, spellSlots: [4, 3, 0, 0, 0, 0, 0, 0, 0] },
  5:  { cantripsKnown: 4, spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0] },
  6:  { cantripsKnown: 4, spellSlots: [4, 3, 3, 0, 0, 0, 0, 0, 0] },
  7:  { cantripsKnown: 4, spellSlots: [4, 3, 3, 1, 0, 0, 0, 0, 0] },
  8:  { cantripsKnown: 4, spellSlots: [4, 3, 3, 2, 0, 0, 0, 0, 0] },
  9:  { cantripsKnown: 4, spellSlots: [4, 3, 3, 3, 1, 0, 0, 0, 0] },
  10: { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 0, 0, 0, 0] },
  11: { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
  12: { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
  13: { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
  14: { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
  15: { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
  16: { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
  17: { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1, 1, 1, 1] },
  18: { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 3, 1, 1, 1, 1] },
  19: { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 3, 2, 1, 1, 1] },
  20: { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 3, 2, 2, 1, 1] },
}

const CLERIC_PROGRESSION: Record<number, SpellcastingProgression> = {
  1:  { cantripsKnown: 3, spellSlots: [2, 0, 0, 0, 0, 0, 0, 0, 0] },
  2:  { cantripsKnown: 3, spellSlots: [3, 0, 0, 0, 0, 0, 0, 0, 0] },
  3:  { cantripsKnown: 3, spellSlots: [4, 2, 0, 0, 0, 0, 0, 0, 0] },
  4:  { cantripsKnown: 4, spellSlots: [4, 3, 0, 0, 0, 0, 0, 0, 0] },
  5:  { cantripsKnown: 4, spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0] },
  6:  { cantripsKnown: 4, spellSlots: [4, 3, 3, 0, 0, 0, 0, 0, 0] },
  7:  { cantripsKnown: 4, spellSlots: [4, 3, 3, 1, 0, 0, 0, 0, 0] },
  8:  { cantripsKnown: 4, spellSlots: [4, 3, 3, 2, 0, 0, 0, 0, 0] },
  9:  { cantripsKnown: 4, spellSlots: [4, 3, 3, 3, 1, 0, 0, 0, 0] },
  10: { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 0, 0, 0, 0] },
  11: { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
  12: { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
  13: { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
  14: { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
  15: { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
  16: { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
  17: { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1, 1, 1, 1] },
  18: { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 3, 1, 1, 1, 1] },
  19: { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 3, 2, 1, 1, 1] },
  20: { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 3, 2, 2, 1, 1] },
}

const DRUID_PROGRESSION: Record<number, SpellcastingProgression> = {
  1:  { cantripsKnown: 2, spellSlots: [2, 0, 0, 0, 0, 0, 0, 0, 0] },
  2:  { cantripsKnown: 2, spellSlots: [3, 0, 0, 0, 0, 0, 0, 0, 0] },
  3:  { cantripsKnown: 2, spellSlots: [4, 2, 0, 0, 0, 0, 0, 0, 0] },
  4:  { cantripsKnown: 3, spellSlots: [4, 3, 0, 0, 0, 0, 0, 0, 0] },
  5:  { cantripsKnown: 3, spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0] },
  6:  { cantripsKnown: 3, spellSlots: [4, 3, 3, 0, 0, 0, 0, 0, 0] },
  7:  { cantripsKnown: 3, spellSlots: [4, 3, 3, 1, 0, 0, 0, 0, 0] },
  8:  { cantripsKnown: 3, spellSlots: [4, 3, 3, 2, 0, 0, 0, 0, 0] },
  9:  { cantripsKnown: 3, spellSlots: [4, 3, 3, 3, 1, 0, 0, 0, 0] },
  10: { cantripsKnown: 4, spellSlots: [4, 3, 3, 3, 2, 0, 0, 0, 0] },
  11: { cantripsKnown: 4, spellSlots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
  12: { cantripsKnown: 4, spellSlots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
  13: { cantripsKnown: 4, spellSlots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
  14: { cantripsKnown: 4, spellSlots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
  15: { cantripsKnown: 4, spellSlots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
  16: { cantripsKnown: 4, spellSlots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
  17: { cantripsKnown: 4, spellSlots: [4, 3, 3, 3, 2, 1, 1, 1, 1] },
  18: { cantripsKnown: 4, spellSlots: [4, 3, 3, 3, 3, 1, 1, 1, 1] },
  19: { cantripsKnown: 4, spellSlots: [4, 3, 3, 3, 3, 2, 1, 1, 1] },
  20: { cantripsKnown: 4, spellSlots: [4, 3, 3, 3, 3, 2, 2, 1, 1] },
}

const BARD_PROGRESSION: Record<number, SpellcastingProgression> = {
  1:  { cantripsKnown: 2, spellsKnown: 4,  spellSlots: [2, 0, 0, 0, 0, 0, 0, 0, 0] },
  2:  { cantripsKnown: 2, spellsKnown: 5,  spellSlots: [3, 0, 0, 0, 0, 0, 0, 0, 0] },
  3:  { cantripsKnown: 2, spellsKnown: 6,  spellSlots: [4, 2, 0, 0, 0, 0, 0, 0, 0] },
  4:  { cantripsKnown: 3, spellsKnown: 7,  spellSlots: [4, 3, 0, 0, 0, 0, 0, 0, 0] },
  5:  { cantripsKnown: 3, spellsKnown: 8,  spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0] },
  6:  { cantripsKnown: 3, spellsKnown: 9,  spellSlots: [4, 3, 3, 0, 0, 0, 0, 0, 0] },
  7:  { cantripsKnown: 3, spellsKnown: 10, spellSlots: [4, 3, 3, 1, 0, 0, 0, 0, 0] },
  8:  { cantripsKnown: 3, spellsKnown: 11, spellSlots: [4, 3, 3, 2, 0, 0, 0, 0, 0] },
  9:  { cantripsKnown: 3, spellsKnown: 12, spellSlots: [4, 3, 3, 3, 1, 0, 0, 0, 0] },
  10: { cantripsKnown: 4, spellsKnown: 14, spellSlots: [4, 3, 3, 3, 2, 0, 0, 0, 0] },
  11: { cantripsKnown: 4, spellsKnown: 15, spellSlots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
  12: { cantripsKnown: 4, spellsKnown: 15, spellSlots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
  13: { cantripsKnown: 4, spellsKnown: 16, spellSlots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
  14: { cantripsKnown: 4, spellsKnown: 18, spellSlots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
  15: { cantripsKnown: 4, spellsKnown: 19, spellSlots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
  16: { cantripsKnown: 4, spellsKnown: 19, spellSlots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
  17: { cantripsKnown: 4, spellsKnown: 20, spellSlots: [4, 3, 3, 3, 2, 1, 1, 1, 1] },
  18: { cantripsKnown: 4, spellsKnown: 22, spellSlots: [4, 3, 3, 3, 3, 1, 1, 1, 1] },
  19: { cantripsKnown: 4, spellsKnown: 22, spellSlots: [4, 3, 3, 3, 3, 2, 1, 1, 1] },
  20: { cantripsKnown: 4, spellsKnown: 22, spellSlots: [4, 3, 3, 3, 3, 2, 2, 1, 1] },
}

const SORCERER_PROGRESSION: Record<number, SpellcastingProgression> = {
  1:  { cantripsKnown: 4, spellsKnown: 2,  spellSlots: [2, 0, 0, 0, 0, 0, 0, 0, 0] },
  2:  { cantripsKnown: 4, spellsKnown: 3,  spellSlots: [3, 0, 0, 0, 0, 0, 0, 0, 0] },
  3:  { cantripsKnown: 4, spellsKnown: 4,  spellSlots: [4, 2, 0, 0, 0, 0, 0, 0, 0] },
  4:  { cantripsKnown: 5, spellsKnown: 5,  spellSlots: [4, 3, 0, 0, 0, 0, 0, 0, 0] },
  5:  { cantripsKnown: 5, spellsKnown: 6,  spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0] },
  6:  { cantripsKnown: 5, spellsKnown: 7,  spellSlots: [4, 3, 3, 0, 0, 0, 0, 0, 0] },
  7:  { cantripsKnown: 5, spellsKnown: 8,  spellSlots: [4, 3, 3, 1, 0, 0, 0, 0, 0] },
  8:  { cantripsKnown: 5, spellsKnown: 9,  spellSlots: [4, 3, 3, 2, 0, 0, 0, 0, 0] },
  9:  { cantripsKnown: 5, spellsKnown: 10, spellSlots: [4, 3, 3, 3, 1, 0, 0, 0, 0] },
  10: { cantripsKnown: 6, spellsKnown: 11, spellSlots: [4, 3, 3, 3, 2, 0, 0, 0, 0] },
  11: { cantripsKnown: 6, spellsKnown: 12, spellSlots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
  12: { cantripsKnown: 6, spellsKnown: 12, spellSlots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
  13: { cantripsKnown: 6, spellsKnown: 13, spellSlots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
  14: { cantripsKnown: 6, spellsKnown: 13, spellSlots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
  15: { cantripsKnown: 6, spellsKnown: 14, spellSlots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
  16: { cantripsKnown: 6, spellsKnown: 14, spellSlots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
  17: { cantripsKnown: 6, spellsKnown: 15, spellSlots: [4, 3, 3, 3, 2, 1, 1, 1, 1] },
  18: { cantripsKnown: 6, spellsKnown: 15, spellSlots: [4, 3, 3, 3, 3, 1, 1, 1, 1] },
  19: { cantripsKnown: 6, spellsKnown: 15, spellSlots: [4, 3, 3, 3, 3, 2, 1, 1, 1] },
  20: { cantripsKnown: 6, spellsKnown: 15, spellSlots: [4, 3, 3, 3, 3, 2, 2, 1, 1] },
}

// ─── Half Casters ───

const RANGER_PROGRESSION: Record<number, SpellcastingProgression> = {
  1:  { cantripsKnown: 0, spellsKnown: 2,  spellSlots: [2, 0, 0, 0, 0, 0, 0, 0, 0] },
  2:  { cantripsKnown: 0, spellsKnown: 2,  spellSlots: [2, 0, 0, 0, 0, 0, 0, 0, 0] },
  3:  { cantripsKnown: 0, spellsKnown: 3,  spellSlots: [3, 0, 0, 0, 0, 0, 0, 0, 0] },
  4:  { cantripsKnown: 0, spellsKnown: 3,  spellSlots: [3, 0, 0, 0, 0, 0, 0, 0, 0] },
  5:  { cantripsKnown: 0, spellsKnown: 4,  spellSlots: [4, 2, 0, 0, 0, 0, 0, 0, 0] },
  6:  { cantripsKnown: 0, spellsKnown: 4,  spellSlots: [4, 2, 0, 0, 0, 0, 0, 0, 0] },
  7:  { cantripsKnown: 0, spellsKnown: 5,  spellSlots: [4, 3, 0, 0, 0, 0, 0, 0, 0] },
  8:  { cantripsKnown: 0, spellsKnown: 5,  spellSlots: [4, 3, 0, 0, 0, 0, 0, 0, 0] },
  9:  { cantripsKnown: 0, spellsKnown: 6,  spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0] },
  10: { cantripsKnown: 0, spellsKnown: 6,  spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0] },
  11: { cantripsKnown: 0, spellsKnown: 7,  spellSlots: [4, 3, 3, 0, 0, 0, 0, 0, 0] },
  12: { cantripsKnown: 0, spellsKnown: 7,  spellSlots: [4, 3, 3, 0, 0, 0, 0, 0, 0] },
  13: { cantripsKnown: 0, spellsKnown: 8,  spellSlots: [4, 3, 3, 1, 0, 0, 0, 0, 0] },
  14: { cantripsKnown: 0, spellsKnown: 8,  spellSlots: [4, 3, 3, 1, 0, 0, 0, 0, 0] },
  15: { cantripsKnown: 0, spellsKnown: 9,  spellSlots: [4, 3, 3, 2, 0, 0, 0, 0, 0] },
  16: { cantripsKnown: 0, spellsKnown: 9,  spellSlots: [4, 3, 3, 2, 0, 0, 0, 0, 0] },
  17: { cantripsKnown: 0, spellsKnown: 10, spellSlots: [4, 3, 3, 3, 1, 0, 0, 0, 0] },
  18: { cantripsKnown: 0, spellsKnown: 10, spellSlots: [4, 3, 3, 3, 1, 0, 0, 0, 0] },
  19: { cantripsKnown: 0, spellsKnown: 11, spellSlots: [4, 3, 3, 3, 2, 0, 0, 0, 0] },
  20: { cantripsKnown: 0, spellsKnown: 11, spellSlots: [4, 3, 3, 3, 2, 0, 0, 0, 0] },
}

// Paladin has no cantrips, prepared = CHA mod + floor(level/2)
const PALADIN_PROGRESSION: Record<number, SpellcastingProgression> = {
  1:  { cantripsKnown: 0, spellSlots: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
  2:  { cantripsKnown: 0, spellSlots: [2, 0, 0, 0, 0, 0, 0, 0, 0] },
  3:  { cantripsKnown: 0, spellSlots: [3, 0, 0, 0, 0, 0, 0, 0, 0] },
  4:  { cantripsKnown: 0, spellSlots: [3, 0, 0, 0, 0, 0, 0, 0, 0] },
  5:  { cantripsKnown: 0, spellSlots: [4, 2, 0, 0, 0, 0, 0, 0, 0] },
  6:  { cantripsKnown: 0, spellSlots: [4, 2, 0, 0, 0, 0, 0, 0, 0] },
  7:  { cantripsKnown: 0, spellSlots: [4, 3, 0, 0, 0, 0, 0, 0, 0] },
  8:  { cantripsKnown: 0, spellSlots: [4, 3, 0, 0, 0, 0, 0, 0, 0] },
  9:  { cantripsKnown: 0, spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0] },
  10: { cantripsKnown: 0, spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0] },
  11: { cantripsKnown: 0, spellSlots: [4, 3, 3, 0, 0, 0, 0, 0, 0] },
  12: { cantripsKnown: 0, spellSlots: [4, 3, 3, 0, 0, 0, 0, 0, 0] },
  13: { cantripsKnown: 0, spellSlots: [4, 3, 3, 1, 0, 0, 0, 0, 0] },
  14: { cantripsKnown: 0, spellSlots: [4, 3, 3, 1, 0, 0, 0, 0, 0] },
  15: { cantripsKnown: 0, spellSlots: [4, 3, 3, 2, 0, 0, 0, 0, 0] },
  16: { cantripsKnown: 0, spellSlots: [4, 3, 3, 2, 0, 0, 0, 0, 0] },
  17: { cantripsKnown: 0, spellSlots: [4, 3, 3, 3, 1, 0, 0, 0, 0] },
  18: { cantripsKnown: 0, spellSlots: [4, 3, 3, 3, 1, 0, 0, 0, 0] },
  19: { cantripsKnown: 0, spellSlots: [4, 3, 3, 3, 2, 0, 0, 0, 0] },
  20: { cantripsKnown: 0, spellSlots: [4, 3, 3, 3, 2, 0, 0, 0, 0] },
}

// ─── Warlock (Pact Magic) ───

const WARLOCK_PROGRESSION: Record<number, WarlockProgression> = {
  1:  { cantripsKnown: 2, spellsKnown: 2,  pactSlots: 1, slotLevel: 1 },
  2:  { cantripsKnown: 2, spellsKnown: 3,  pactSlots: 2, slotLevel: 1 },
  3:  { cantripsKnown: 2, spellsKnown: 4,  pactSlots: 2, slotLevel: 2 },
  4:  { cantripsKnown: 3, spellsKnown: 5,  pactSlots: 2, slotLevel: 2 },
  5:  { cantripsKnown: 3, spellsKnown: 6,  pactSlots: 2, slotLevel: 3 },
  6:  { cantripsKnown: 3, spellsKnown: 7,  pactSlots: 2, slotLevel: 3 },
  7:  { cantripsKnown: 3, spellsKnown: 8,  pactSlots: 2, slotLevel: 4 },
  8:  { cantripsKnown: 3, spellsKnown: 9,  pactSlots: 2, slotLevel: 4 },
  9:  { cantripsKnown: 3, spellsKnown: 10, pactSlots: 2, slotLevel: 5 },
  10: { cantripsKnown: 4, spellsKnown: 10, pactSlots: 2, slotLevel: 5 },
  11: { cantripsKnown: 4, spellsKnown: 11, pactSlots: 3, slotLevel: 5 },
  12: { cantripsKnown: 4, spellsKnown: 11, pactSlots: 3, slotLevel: 5 },
  13: { cantripsKnown: 4, spellsKnown: 12, pactSlots: 3, slotLevel: 5 },
  14: { cantripsKnown: 4, spellsKnown: 12, pactSlots: 3, slotLevel: 5 },
  15: { cantripsKnown: 4, spellsKnown: 13, pactSlots: 3, slotLevel: 5 },
  16: { cantripsKnown: 4, spellsKnown: 13, pactSlots: 3, slotLevel: 5 },
  17: { cantripsKnown: 4, spellsKnown: 14, pactSlots: 4, slotLevel: 5 },
  18: { cantripsKnown: 4, spellsKnown: 14, pactSlots: 4, slotLevel: 5 },
  19: { cantripsKnown: 4, spellsKnown: 15, pactSlots: 4, slotLevel: 5 },
  20: { cantripsKnown: 4, spellsKnown: 15, pactSlots: 4, slotLevel: 5 },
}

// ─── Artificer (half-caster, spells from level 1) ───

const ARTIFICER_PROGRESSION: Record<number, SpellcastingProgression> = {
  1:  { cantripsKnown: 2, spellSlots: [2, 0, 0, 0, 0, 0, 0, 0, 0] },
  2:  { cantripsKnown: 2, spellSlots: [2, 0, 0, 0, 0, 0, 0, 0, 0] },
  3:  { cantripsKnown: 2, spellSlots: [3, 0, 0, 0, 0, 0, 0, 0, 0] },
  4:  { cantripsKnown: 2, spellSlots: [3, 0, 0, 0, 0, 0, 0, 0, 0] },
  5:  { cantripsKnown: 2, spellSlots: [4, 2, 0, 0, 0, 0, 0, 0, 0] },
  6:  { cantripsKnown: 2, spellSlots: [4, 2, 0, 0, 0, 0, 0, 0, 0] },
  7:  { cantripsKnown: 2, spellSlots: [4, 3, 0, 0, 0, 0, 0, 0, 0] },
  8:  { cantripsKnown: 2, spellSlots: [4, 3, 0, 0, 0, 0, 0, 0, 0] },
  9:  { cantripsKnown: 2, spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0] },
  10: { cantripsKnown: 3, spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0] },
  11: { cantripsKnown: 3, spellSlots: [4, 3, 3, 0, 0, 0, 0, 0, 0] },
  12: { cantripsKnown: 3, spellSlots: [4, 3, 3, 0, 0, 0, 0, 0, 0] },
  13: { cantripsKnown: 3, spellSlots: [4, 3, 3, 1, 0, 0, 0, 0, 0] },
  14: { cantripsKnown: 4, spellSlots: [4, 3, 3, 1, 0, 0, 0, 0, 0] },
  15: { cantripsKnown: 4, spellSlots: [4, 3, 3, 2, 0, 0, 0, 0, 0] },
  16: { cantripsKnown: 4, spellSlots: [4, 3, 3, 2, 0, 0, 0, 0, 0] },
  17: { cantripsKnown: 4, spellSlots: [4, 3, 3, 3, 1, 0, 0, 0, 0] },
  18: { cantripsKnown: 4, spellSlots: [4, 3, 3, 3, 1, 0, 0, 0, 0] },
  19: { cantripsKnown: 4, spellSlots: [4, 3, 3, 3, 2, 0, 0, 0, 0] },
  20: { cantripsKnown: 4, spellSlots: [4, 3, 3, 3, 2, 0, 0, 0, 0] },
}

// ─── Lookup ───

// Barriomancer — half caster, CHA-based, prepared (CHA mod + floor(level/2))
const BARRIOMANCER_PROGRESSION: Record<number, SpellcastingProgression> = {
  1:  { cantripsKnown: 0, spellSlots: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
  2:  { cantripsKnown: 0, spellSlots: [2, 0, 0, 0, 0, 0, 0, 0, 0] },
  3:  { cantripsKnown: 0, spellSlots: [3, 0, 0, 0, 0, 0, 0, 0, 0] },
  4:  { cantripsKnown: 0, spellSlots: [3, 0, 0, 0, 0, 0, 0, 0, 0] },
  5:  { cantripsKnown: 0, spellSlots: [4, 2, 0, 0, 0, 0, 0, 0, 0] },
  6:  { cantripsKnown: 0, spellSlots: [4, 2, 0, 0, 0, 0, 0, 0, 0] },
  7:  { cantripsKnown: 0, spellSlots: [4, 3, 0, 0, 0, 0, 0, 0, 0] },
  8:  { cantripsKnown: 0, spellSlots: [4, 3, 0, 0, 0, 0, 0, 0, 0] },
  9:  { cantripsKnown: 0, spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0] },
  10: { cantripsKnown: 0, spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0] },
  11: { cantripsKnown: 0, spellSlots: [4, 3, 3, 0, 0, 0, 0, 0, 0] },
  12: { cantripsKnown: 0, spellSlots: [4, 3, 3, 0, 0, 0, 0, 0, 0] },
  13: { cantripsKnown: 0, spellSlots: [4, 3, 3, 1, 0, 0, 0, 0, 0] },
  14: { cantripsKnown: 0, spellSlots: [4, 3, 3, 1, 0, 0, 0, 0, 0] },
  15: { cantripsKnown: 0, spellSlots: [4, 3, 3, 2, 0, 0, 0, 0, 0] },
  16: { cantripsKnown: 0, spellSlots: [4, 3, 3, 2, 0, 0, 0, 0, 0] },
  17: { cantripsKnown: 0, spellSlots: [4, 3, 3, 3, 1, 0, 0, 0, 0] },
  18: { cantripsKnown: 0, spellSlots: [4, 3, 3, 3, 1, 0, 0, 0, 0] },
  19: { cantripsKnown: 0, spellSlots: [4, 3, 3, 3, 2, 0, 0, 0, 0] },
  20: { cantripsKnown: 0, spellSlots: [4, 3, 3, 3, 2, 0, 0, 0, 0] },
}

const PROGRESSIONS: Record<string, Record<number, SpellcastingProgression>> = {
  artificer: ARTIFICER_PROGRESSION,
  barriomancer: BARRIOMANCER_PROGRESSION,
  wizard: WIZARD_PROGRESSION,
  cleric: CLERIC_PROGRESSION,
  druid: DRUID_PROGRESSION,
  bard: BARD_PROGRESSION,
  sorcerer: SORCERER_PROGRESSION,
  ranger: RANGER_PROGRESSION,
  paladin: PALADIN_PROGRESSION,
}

// 2024 PHB "Prepared Spells" column — a FIXED number per class level (replaces the old
// ability-mod + level formula). Index 0 = level 1. Values transcribed from the 2024 PHB
// class tables. Full casters (Bard/Cleric/Druid/Sorcerer/Wizard) and half casters
// (Paladin/Ranger) all use this fixed count; every caster "prepares" in 2024.
const PREPARED_SPELLS_2024: Record<string, number[]> = {
  cleric:   [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  druid:    [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  wizard:   [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 19, 21, 22, 23, 24, 25],
  bard:     [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  sorcerer: [2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  paladin:  [2, 2, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15],
  ranger:   [2, 3, 4, 5, 6, 6, 7, 7, 8, 8, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15],
}

/** 2024 fixed "Prepared Spells" count for a class at a level, or null if the class has no
 *  official 2024 table (e.g. homebrew half-casters, which fall back to the legacy formula). */
export function getPreparedSpells2024(className: string, level: number): number | null {
  const arr = PREPARED_SPELLS_2024[className.toLowerCase()]
  if (!arr) return null
  return arr[Math.min(20, Math.max(1, level)) - 1] ?? null
}

/** Get 2024 PHB spellcasting data for a class at a given level */
export function getSpellcasting2024(className: string, level: number): SpellcastingProgression | null {
  const table = PROGRESSIONS[className.toLowerCase()]
  if (!table) return null
  return table[Math.min(20, Math.max(1, level))] ?? null
}

/** Get 2024 PHB Warlock pact magic data at a given level */
export function getWarlockPactMagic(level: number): WarlockProgression {
  return WARLOCK_PROGRESSION[Math.min(20, Math.max(1, level))]
}

/** Check if a class uses 2024 override data (vs SRD API fallback) */
export function has2024SpellData(className: string): boolean {
  return className.toLowerCase() in PROGRESSIONS || className.toLowerCase() === 'warlock'
}
