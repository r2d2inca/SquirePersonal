import { create } from 'zustand'

export type RollMode = 'normal' | 'advantage' | 'disadvantage'

export interface DiceRoll {
  id: string
  die: string
  count: number
  modifier: number
  rolls: number[]
  total: number
  timestamp: number
  /** Human label for rolls fired from the sheet, e.g. "Stealth (adv)". */
  label?: string
  mode?: RollMode
}

interface DiceState {
  isOpen: boolean
  history: DiceRoll[]
  lastRoll: DiceRoll | null
  toggleOpen: () => void
  open: () => void
  addRoll: (roll: DiceRoll) => void
  clearHistory: () => void
}

export const useDiceStore = create<DiceState>((set) => ({
  isOpen: false,
  history: [],
  lastRoll: null,
  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  addRoll: (roll) =>
    set((s) => ({ history: [roll, ...s.history].slice(0, 20), lastRoll: roll })),
  clearHistory: () => set({ history: [] }),
}))

/** Label shown in the roller for a roll, falling back to dice notation. */
export function describeRoll(roll: DiceRoll): string {
  return roll.label ?? `${roll.count}${roll.die}`
}
