// 2024 PHB conditions. Used by the character sheet conditions banner and stored
// as active_effects rows (effect_type: 'condition'). Concentration is tracked
// separately as an active_effect with is_concentration: true.

export const CONDITION_NAMES = [
  'Blinded',
  'Charmed',
  'Deafened',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious',
  'Exhaustion',
] as const

export type ConditionName = (typeof CONDITION_NAMES)[number]

// Short, play-reference summaries (2024 PHB). Shown as tooltips on the banner.
export const CONDITION_INFO: Record<ConditionName, string> = {
  Blinded: "Can't see and auto-fail sight checks. Attacks against you have Advantage; your attacks have Disadvantage.",
  Charmed: "Can't attack the charmer; the charmer has Advantage on social checks against you.",
  Deafened: "Can't hear and auto-fail hearing checks.",
  Frightened: "Disadvantage on checks and attacks while the source is in sight; can't willingly move closer to it.",
  Grappled: "Speed 0. Ends if the grappler is Incapacitated or you're moved away.",
  Incapacitated: "No actions, bonus actions, or reactions; can't concentrate or speak.",
  Invisible: "Heavily obscured to others. Attacks against you have Disadvantage; your attacks have Advantage.",
  Paralyzed: "Incapacitated, can't move or speak, auto-fail STR/DEX saves. Attacks against you have Advantage; hits within 5 ft are crits.",
  Petrified: "Turned to solid substance. Incapacitated, Resistance to all damage, immune to poison/disease.",
  Poisoned: 'Disadvantage on attack rolls and ability checks.',
  Prone: "Can only crawl. Disadvantage on attacks; attackers within 5 ft have Advantage, others Disadvantage.",
  Restrained: 'Speed 0; Disadvantage on attacks and DEX saves; attacks against you have Advantage.',
  Stunned: 'Incapacitated, can\'t move, auto-fail STR/DEX saves. Attacks against you have Advantage.',
  Unconscious: 'Incapacitated, Prone, drop everything, auto-fail STR/DEX saves. Attacks have Advantage; hits within 5 ft are crits.',
  Exhaustion: 'Levels 1–6: each level gives −2 to d20 tests and −5 ft Speed (cumulative). Level 6 is death.',
}

/** Concentration save DC from damage taken: DC 10 or half the damage, whichever is higher. */
export function concentrationSaveDC(damage: number): number {
  return Math.max(10, Math.floor(damage / 2))
}
