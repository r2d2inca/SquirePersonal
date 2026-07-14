import { create } from 'zustand'

export const STATUS_CONDITIONS = [
  'Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled',
  'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned',
  'Prone', 'Restrained', 'Stunned', 'Unconscious', 'Exhaustion',
] as const

export type StatusCondition = (typeof STATUS_CONDITIONS)[number]

export interface Combatant {
  id: string
  name: string
  initiative: number
  maxHp: number
  currentHp: number
  armorClass: number
  isPlayer: boolean
  conditions: StatusCondition[]
}

export interface EncounterMonster {
  index: string
  name: string
  cr: string
  hp: number
  ac: number
  quantity: number
}

type CombatPhase = 'setup' | 'running'

interface CombatState {
  phase: CombatPhase
  combatants: Combatant[]
  currentTurnIndex: number
  round: number
  encounterMonsters: EncounterMonster[]

  setPhase: (phase: CombatPhase) => void
  addCombatant: (c: Combatant) => void
  removeCombatant: (id: string) => void
  updateCombatant: (id: string, updates: Partial<Combatant>) => void
  sortByInitiative: () => void
  nextTurn: () => void
  prevTurn: () => void
  startCombat: () => void
  endCombat: () => void
  toggleCondition: (id: string, condition: StatusCondition) => void

  addEncounterMonster: (m: EncounterMonster) => void
  removeEncounterMonster: (index: string) => void
  updateMonsterQuantity: (index: string, qty: number) => void
  clearEncounter: () => void
}

export const useCombatStore = create<CombatState>((set) => ({
  phase: 'setup',
  combatants: [],
  currentTurnIndex: 0,
  round: 1,
  encounterMonsters: [],

  setPhase: (phase) => set({ phase }),
  addCombatant: (c) => set((s) => ({ combatants: [...s.combatants, c] })),
  removeCombatant: (id) =>
    set((s) => ({
      combatants: s.combatants.filter((c) => c.id !== id),
      currentTurnIndex: Math.min(s.currentTurnIndex, Math.max(0, s.combatants.length - 2)),
    })),
  updateCombatant: (id, updates) =>
    set((s) => ({
      combatants: s.combatants.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  sortByInitiative: () =>
    set((s) => ({
      combatants: [...s.combatants].sort((a, b) => b.initiative - a.initiative),
    })),
  nextTurn: () =>
    set((s) => {
      const next = s.currentTurnIndex + 1
      if (next >= s.combatants.length) {
        return { currentTurnIndex: 0, round: s.round + 1 }
      }
      return { currentTurnIndex: next }
    }),
  prevTurn: () =>
    set((s) => {
      if (s.currentTurnIndex === 0 && s.round > 1) {
        return { currentTurnIndex: s.combatants.length - 1, round: s.round - 1 }
      }
      return { currentTurnIndex: Math.max(0, s.currentTurnIndex - 1) }
    }),
  startCombat: () =>
    set((s) => ({
      phase: 'running',
      combatants: [...s.combatants].sort((a, b) => b.initiative - a.initiative),
      currentTurnIndex: 0,
      round: 1,
    })),
  endCombat: () => set({ phase: 'setup', combatants: [], currentTurnIndex: 0, round: 1 }),
  toggleCondition: (id, condition) =>
    set((s) => ({
      combatants: s.combatants.map((c) => {
        if (c.id !== id) return c
        const has = c.conditions.includes(condition)
        return {
          ...c,
          conditions: has ? c.conditions.filter((co) => co !== condition) : [...c.conditions, condition],
        }
      }),
    })),

  addEncounterMonster: (m) =>
    set((s) => {
      const existing = s.encounterMonsters.find((e) => e.index === m.index)
      if (existing) {
        return {
          encounterMonsters: s.encounterMonsters.map((e) =>
            e.index === m.index ? { ...e, quantity: e.quantity + 1 } : e
          ),
        }
      }
      return { encounterMonsters: [...s.encounterMonsters, m] }
    }),
  removeEncounterMonster: (index) =>
    set((s) => ({ encounterMonsters: s.encounterMonsters.filter((e) => e.index !== index) })),
  updateMonsterQuantity: (index, qty) =>
    set((s) => ({
      encounterMonsters: s.encounterMonsters.map((e) =>
        e.index === index ? { ...e, quantity: Math.max(1, qty) } : e
      ),
    })),
  clearEncounter: () => set({ encounterMonsters: [] }),
}))
