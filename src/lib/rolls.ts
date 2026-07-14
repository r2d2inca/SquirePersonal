/**
 * d20 checks fired from the character sheet — skills, saves, ability checks,
 * initiative. Results land in the shared dice roller so the sheet and the roller
 * panel show one history.
 */

import { useDiceStore, type DiceRoll, type RollMode } from '@/stores/diceStore'
import { playSound } from '@/lib/sound'

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1
}

const MODE_SUFFIX: Record<RollMode, string> = {
  normal: '',
  advantage: ' (adv)',
  disadvantage: ' (dis)',
}

export function rollCheck(label: string, modifier: number, mode: RollMode = 'normal'): DiceRoll {
  const rolls = mode === 'normal' ? [rollD20()] : [rollD20(), rollD20()]
  const kept =
    mode === 'advantage' ? Math.max(...rolls) : mode === 'disadvantage' ? Math.min(...rolls) : rolls[0]

  const roll: DiceRoll = {
    id: crypto.randomUUID(),
    die: 'd20',
    count: rolls.length,
    modifier,
    rolls,
    total: kept + modifier,
    timestamp: Date.now(),
    label: `${label}${MODE_SUFFIX[mode]}`,
    mode,
  }

  const { addRoll, open } = useDiceStore.getState()
  addRoll(roll)
  open()

  playSound('diceRoll')
  // The crit recipes carry their own delay, so they land after the dice settle.
  if (kept === 20) playSound('critSuccess')
  else if (kept === 1) playSound('critFail')

  return roll
}
