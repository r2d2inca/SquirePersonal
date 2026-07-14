/**
 * Classifies an HP write as damage / heal / temp HP.
 *
 * HP is stored as an absolute value, so "took 12 damage" has to be recovered by
 * diffing the incoming update against the character's current state. Shared by
 * both the sound and the toast so the two can never disagree about what happened.
 */

export type HpChangeKind = 'damage' | 'heal' | 'temp' | 'none'

export interface HpChange {
  kind: HpChangeKind
  amount: number
}

interface HpState {
  current_hp: number
  temp_hp: number
}

interface HpUpdate {
  current_hp?: number | null
  temp_hp?: number | null
}

export function classifyHpChange(prev: HpState, updates: HpUpdate): HpChange {
  const hpDelta = updates.current_hp != null ? updates.current_hp - prev.current_hp : 0
  const tempDelta = updates.temp_hp != null ? updates.temp_hp - prev.temp_hp : 0

  // Temp HP burned off by a hit counts as damage taken. Without this term, a hit
  // fully absorbed by temp HP leaves current_hp untouched and reads as "nothing
  // happened" — no sound, no undo.
  const lost = -(hpDelta + Math.min(0, tempDelta))
  if (lost > 0) return { kind: 'damage', amount: lost }

  if (tempDelta > 0) return { kind: 'temp', amount: tempDelta }
  if (hpDelta > 0) return { kind: 'heal', amount: hpDelta }

  return { kind: 'none', amount: 0 }
}

/** "Took 12 damage" / "Healed 8 HP" / "Gained 5 temp HP" */
export function describeHpChange(change: HpChange): string {
  switch (change.kind) {
    case 'damage':
      return `Took ${change.amount} damage`
    case 'heal':
      return `Healed ${change.amount} HP`
    case 'temp':
      return `Gained ${change.amount} temp HP`
    case 'none':
      return ''
  }
}
