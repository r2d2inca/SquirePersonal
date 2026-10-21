import { crToXP, calculateEncounterDifficulty, type DifficultyRating } from '@/lib/dnd5e'
import { abilityModifier } from '@/lib/calculations'
import type {
  CreatureSize,
  EncounterCombatantInsert,
  EncounterTemplate,
  EncounterTemplateMonster,
  Npc,
  Character,
} from '@/lib/types/database'
import type { SRDMonsterDetail } from '@/lib/dnd5e'

/* ── 2024 DMG encounter budget ──
 * The 2024 rules drop the 2014 "adjusted XP" multiplier entirely: add up the
 * monsters' XP and compare it to a per-character budget summed across the
 * party. Three tiers instead of four. */

export type Budget2024Tier = 'Low' | 'Moderate' | 'High'

/** Per-character XP budget by level: [Low, Moderate, High]. 2024 DMG ch. 4. */
const XP_BUDGET_2024: Record<number, [number, number, number]> = {
  1: [50, 75, 100],
  2: [100, 150, 200],
  3: [150, 225, 400],
  4: [250, 375, 500],
  5: [500, 750, 1100],
  6: [600, 1000, 1400],
  7: [750, 1300, 1700],
  8: [1000, 1700, 2100],
  9: [1300, 2000, 2600],
  10: [1600, 2300, 3100],
  11: [1900, 2900, 4100],
  12: [2200, 3700, 4700],
  13: [2600, 4200, 5400],
  14: [2900, 4900, 6200],
  15: [3300, 5400, 7800],
  16: [3800, 6100, 9800],
  17: [4500, 7200, 11700],
  18: [5000, 8700, 14200],
  19: [5500, 10700, 17200],
  20: [6400, 13200, 22000],
}

export interface Budget2024 {
  budgets: Record<Budget2024Tier, number>
  totalXP: number
  /** The highest tier the encounter meets, or 'Trivial' if it is under Low. */
  rating: Budget2024Tier | 'Trivial' | 'Beyond High'
  /** 0..1+ — how much of the High budget the encounter uses. */
  fillRatio: number
}

export function partyBudget2024(partyLevels: number[]): Record<Budget2024Tier, number> {
  const budgets: Record<Budget2024Tier, number> = { Low: 0, Moderate: 0, High: 0 }
  for (const level of partyLevels) {
    const row = XP_BUDGET_2024[Math.min(20, Math.max(1, level))] ?? XP_BUDGET_2024[1]
    budgets.Low += row[0]
    budgets.Moderate += row[1]
    budgets.High += row[2]
  }
  return budgets
}

export function calculateBudget2024(partyLevels: number[], monsterCRs: number[]): Budget2024 {
  const budgets = partyBudget2024(partyLevels)
  const totalXP = monsterCRs.reduce((sum, cr) => sum + crToXP(cr), 0)
  let rating: Budget2024['rating'] = 'Trivial'
  if (totalXP > budgets.High * 1.5) rating = 'Beyond High'
  else if (totalXP >= budgets.High) rating = 'High'
  else if (totalXP >= budgets.Moderate) rating = 'Moderate'
  else if (totalXP >= budgets.Low) rating = 'Low'
  const fillRatio = budgets.High > 0 ? totalXP / budgets.High : 0
  return { budgets, totalXP, rating, fillRatio }
}

/* ── Template helpers ── */

export function templateCRs(monsters: EncounterTemplateMonster[]): number[] {
  return monsters.flatMap((m) => Array<number>(Math.max(1, m.quantity)).fill(m.cr))
}

export function templateTotalXP(monsters: EncounterTemplateMonster[]): number {
  return templateCRs(monsters).reduce((sum, cr) => sum + crToXP(cr), 0)
}

export function templateCreatureCount(monsters: EncounterTemplateMonster[]): number {
  return monsters.reduce((sum, m) => sum + Math.max(1, m.quantity), 0)
}

export interface EncounterAssessment {
  legacy: ReturnType<typeof calculateEncounterDifficulty> | null
  modern: Budget2024 | null
}

/** Both rulesets side by side. Null when there is no party or no monsters to compare. */
export function assessEncounter(partyLevels: number[], monsters: EncounterTemplateMonster[]): EncounterAssessment {
  const crs = templateCRs(monsters)
  if (partyLevels.length === 0 || crs.length === 0) return { legacy: null, modern: null }
  return {
    legacy: calculateEncounterDifficulty(partyLevels, crs),
    modern: calculateBudget2024(partyLevels, crs),
  }
}

export const LEGACY_DIFFICULTY_CLASSES: Record<DifficultyRating, string> = {
  Easy: 'bg-heal text-parchment-100',
  Medium: 'bg-gold-400 text-ink-900',
  Hard: 'bg-warning text-parchment-100',
  Deadly: 'bg-danger text-parchment-100',
}

export const MODERN_RATING_CLASSES: Record<Budget2024['rating'], string> = {
  Trivial: 'bg-parchment-300 text-ink-700',
  Low: 'bg-heal text-parchment-100',
  Moderate: 'bg-gold-400 text-ink-900',
  High: 'bg-warning text-parchment-100',
  'Beyond High': 'bg-danger text-parchment-100',
}

export const TOKEN_COLORS = [
  '#c9981e', '#4a9e65', '#3b82f6', '#ef4444', '#a855f7',
  '#ec4899', '#f97316', '#14b8a6', '#6366f1', '#78716c',
]

const SIZES: CreatureSize[] = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']

function normalizeSize(size: string | undefined | null): CreatureSize {
  return (SIZES.find((s) => s.toLowerCase() === (size ?? '').toLowerCase()) ?? 'Medium')
}

export function monsterFromSrd(detail: SRDMonsterDetail, color = TOKEN_COLORS[3]): EncounterTemplateMonster {
  return {
    id: crypto.randomUUID(),
    source: 'srd',
    ref: detail.index,
    name: detail.name,
    cr: Number(detail.challenge_rating) || 0,
    hp: detail.hit_points,
    ac: detail.armor_class[0]?.value ?? 10,
    initiative_bonus: abilityModifier(detail.dexterity),
    size: normalizeSize(detail.size),
    quantity: 1,
    token_color: color,
    group_initiative: true,
  }
}

export function monsterFromNpc(npc: Npc, color = TOKEN_COLORS[5]): EncounterTemplateMonster {
  return {
    id: crypto.randomUUID(),
    source: 'npc',
    ref: npc.id,
    name: npc.name,
    cr: Number(npc.challenge_rating) || 0,
    hp: npc.hit_points,
    ac: npc.armor_class,
    initiative_bonus: abilityModifier(npc.dexterity),
    size: normalizeSize(npc.size),
    quantity: 1,
    token_color: color,
    group_initiative: true,
  }
}

export function monsterCustom(input: { name: string; cr: number; hp: number; ac: number; size?: CreatureSize; color?: string }): EncounterTemplateMonster {
  return {
    id: crypto.randomUUID(),
    source: 'custom',
    ref: null,
    name: input.name,
    cr: input.cr,
    hp: input.hp,
    ac: input.ac,
    initiative_bonus: 0,
    size: input.size ?? 'Medium',
    quantity: 1,
    token_color: input.color ?? TOKEN_COLORS[4],
    group_initiative: true,
  }
}

/* ── Launching ──
 * Turn a template into combatant rows for a freshly created live encounter.
 * Monsters line up along the top row, the party along the bottom, which is
 * the same convention EncounterSetup uses for its manual adds. */

interface LaunchGrid {
  encounterId: string
  gridWidth: number
  gridHeight: number
}

export function buildLaunchCombatants(
  template: Pick<EncounterTemplate, 'monsters'>,
  party: Character[],
  grid: LaunchGrid,
  includeParty: boolean,
): EncounterCombatantInsert[] {
  const rows: EncounterCombatantInsert[] = []
  const occupied = new Set<string>()

  function openCell(preferredY: number): { x: number; y: number } {
    for (let attempt = 0; attempt < grid.gridWidth * grid.gridHeight; attempt++) {
      const x = attempt % grid.gridWidth
      const yOffset = Math.floor(attempt / grid.gridWidth)
      const y = preferredY === 0
        ? Math.min(grid.gridHeight - 1, yOffset)
        : Math.max(0, preferredY - yOffset)
      const key = `${x},${y}`
      if (!occupied.has(key)) {
        occupied.add(key)
        return { x, y }
      }
    }
    return { x: 0, y: 0 }
  }

  for (const m of template.monsters) {
    const count = Math.max(1, m.quantity)
    const groupId = count > 1 && m.group_initiative ? crypto.randomUUID() : null
    for (let i = 0; i < count; i++) {
      const pos = openCell(0)
      rows.push({
        encounter_id: grid.encounterId,
        user_id: null,
        name: count > 1 ? `${m.name} ${i + 1}` : m.name,
        initiative: null,
        initiative_bonus: m.initiative_bonus,
        max_hp: m.hp,
        current_hp: m.hp,
        temp_hp: 0,
        armor_class: m.ac,
        is_player: false,
        conditions: [],
        grid_x: pos.x,
        grid_y: pos.y,
        token_color: m.token_color,
        size: m.size,
        group_id: groupId,
      })
    }
  }

  if (includeParty) {
    party.forEach((character, i) => {
      const pos = openCell(grid.gridHeight - 1)
      rows.push({
        encounter_id: grid.encounterId,
        user_id: character.user_id,
        name: character.name,
        initiative: null,
        initiative_bonus: abilityModifier(character.dexterity) + (character.initiative_bonus ?? 0),
        max_hp: character.max_hp,
        current_hp: character.current_hp,
        temp_hp: 0,
        armor_class: character.armor_class,
        is_player: true,
        conditions: [],
        grid_x: pos.x,
        grid_y: pos.y,
        token_color: TOKEN_COLORS[i % TOKEN_COLORS.length],
        size: 'Medium',
        group_id: null,
      })
    })
  }

  return rows
}

export function formatCR(cr: number): string {
  if (cr === 0.125) return '1/8'
  if (cr === 0.25) return '1/4'
  if (cr === 0.5) return '1/2'
  return String(cr)
}
