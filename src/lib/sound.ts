/**
 * Synthesized UI sound effects — no audio files, no dependencies.
 *
 * Every sound is built from two primitives (`tone` and `noise`) so the whole set
 * shares an envelope shape and stays tonally coherent. Pitches are drawn from a
 * G-minor-ish set and all noise is band-limited, which is what keeps thirteen
 * separate effects sounding like one instrument rather than a soundboard.
 *
 * Call `playSound(name)` from anywhere, including outside React.
 */

import { useSoundStore } from '@/stores/soundStore'

export type SoundName =
  | 'click'
  | 'damage'
  | 'heal'
  | 'tempHp'
  | 'diceRoll'
  | 'critSuccess'
  | 'critFail'
  | 'levelUp'
  | 'rest'
  | 'spellSlot'
  | 'deathSaveSuccess'
  | 'deathSaveFail'
  | 'conditionApplied'

interface FilterSpec {
  type: BiquadFilterType
  f0: number
  f1?: number
  q?: number
}

interface ToneSpec {
  type: OscillatorType
  f0: number
  f1?: number
  dur: number
  gain: number
  attack?: number
  delay?: number
  detune?: number
  filter?: FilterSpec
}

interface NoiseSpec {
  dur: number
  gain: number
  filter: FilterSpec
  attack?: number
  delay?: number
}

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noiseBuffer: AudioBuffer | null = null
let unavailable = false
let voices = 0
const lastPlayedAt: Partial<Record<SoundName, number>> = {}

const MAX_VOICES = 12
const RETRIGGER_GUARD = 0.04

function getCtx(): AudioContext | null {
  if (unavailable) return null
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  }
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) {
      unavailable = true
      return null
    }
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)

    // One second of white noise, reused by every noise-based effect.
    const frames = ctx.sampleRate
    noiseBuffer = ctx.createBuffer(1, frames, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1
    return ctx
  } catch {
    unavailable = true
    return null
  }
}

/** Exponential ramps cannot target zero, so decays land just above silence. */
const FLOOR = 0.0001

function envelope(g: GainNode, at: number, spec: { dur: number; gain: number; attack?: number }) {
  const attack = spec.attack ?? 0.005
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(spec.gain, at + attack)
  g.gain.exponentialRampToValueAtTime(FLOOR, at + spec.dur)
}

function buildFilter(audio: AudioContext, spec: FilterSpec, at: number, dur: number): BiquadFilterNode {
  const filter = audio.createBiquadFilter()
  filter.type = spec.type
  filter.frequency.setValueAtTime(spec.f0, at)
  if (spec.f1 !== undefined) filter.frequency.exponentialRampToValueAtTime(spec.f1, at + dur)
  if (spec.q !== undefined) filter.Q.value = spec.q
  return filter
}

function claimVoice(node: AudioScheduledSourceNode): boolean {
  if (voices >= MAX_VOICES) return false
  voices++
  node.onended = () => {
    voices--
  }
  return true
}

function tone(spec: ToneSpec) {
  const audio = getCtx()
  if (!audio || !master) return
  const at = audio.currentTime + (spec.delay ?? 0)

  const osc = audio.createOscillator()
  if (!claimVoice(osc)) return
  osc.type = spec.type
  if (spec.detune) osc.detune.value = spec.detune
  osc.frequency.setValueAtTime(spec.f0, at)
  if (spec.f1 !== undefined) osc.frequency.exponentialRampToValueAtTime(spec.f1, at + spec.dur)

  const gain = audio.createGain()
  envelope(gain, at, spec)

  const tail: AudioNode = spec.filter ? buildFilter(audio, spec.filter, at, spec.dur) : gain
  if (spec.filter) {
    osc.connect(tail)
    tail.connect(gain)
  } else {
    osc.connect(gain)
  }
  gain.connect(master)

  osc.start(at)
  osc.stop(at + spec.dur + 0.02)
}

function noise(spec: NoiseSpec) {
  const audio = getCtx()
  if (!audio || !master || !noiseBuffer) return
  const at = audio.currentTime + (spec.delay ?? 0)

  const src = audio.createBufferSource()
  if (!claimVoice(src)) return
  src.buffer = noiseBuffer

  const filter = buildFilter(audio, spec.filter, at, spec.dur)
  const gain = audio.createGain()
  envelope(gain, at, spec)

  src.connect(filter)
  filter.connect(gain)
  gain.connect(master)

  src.start(at)
  src.stop(at + spec.dur + 0.02)
}

const RECIPES: Record<SoundName, () => void> = {
  // A tick, not a beep — this one fires constantly, so it has to disappear.
  click: () => {
    tone({ type: 'triangle', f0: 880, f1: 660, dur: 0.035, gain: 0.05, filter: { type: 'lowpass', f0: 2500 } })
  },

  // Muffled body blow: low sine drop with a filtered thump under it.
  damage: () => {
    tone({ type: 'sine', f0: 140, f1: 55, dur: 0.28, gain: 0.35, attack: 0.002, filter: { type: 'lowpass', f0: 900 } })
    noise({ dur: 0.12, gain: 0.12, filter: { type: 'bandpass', f0: 900, f1: 300, q: 1 } })
  },

  // Warm rising fifth, G4 -> D5.
  heal: () => {
    tone({ type: 'sine', f0: 392, dur: 0.4, gain: 0.12, attack: 0.02, filter: { type: 'lowpass', f0: 3000 } })
    tone({ type: 'sine', f0: 587.33, dur: 0.35, gain: 0.09, attack: 0.02, delay: 0.06 })
  },

  // Icy ward.
  tempHp: () => {
    tone({ type: 'triangle', f0: 330, f1: 494, dur: 0.3, gain: 0.1, attack: 0.01 })
    noise({ dur: 0.25, gain: 0.03, filter: { type: 'highpass', f0: 4000 } })
  },

  // Three jittered ticks (the tumble) then a settle tone.
  diceRoll: () => {
    for (let i = 0; i < 3; i++) {
      const jitter = (Math.random() - 0.5) * 0.02
      noise({
        dur: 0.03,
        gain: 0.08,
        delay: Math.max(0, i * 0.048 + jitter),
        filter: { type: 'bandpass', f0: 1800, q: 3 },
      })
    }
    tone({ type: 'triangle', f0: 520, f1: 400, dur: 0.06, gain: 0.05, delay: 0.13 })
  },

  // Bright arpeggio. Delayed so it lands after the dice settle.
  critSuccess: () => {
    const notes = [523.25, 659.25, 880]
    notes.forEach((f, i) => {
      tone({
        type: 'triangle',
        f0: f,
        dur: 0.18,
        gain: 0.1,
        delay: 0.18 + i * 0.07,
        filter: { type: 'lowpass', f0: 5000 },
      })
    })
  },

  // Descending groan.
  critFail: () => {
    tone({
      type: 'sawtooth',
      f0: 220,
      f1: 82,
      dur: 0.5,
      gain: 0.14,
      delay: 0.18,
      filter: { type: 'lowpass', f0: 1200, f1: 300 },
    })
  },

  // The one flourish: a rising four-note figure with octave doubling and a swell.
  levelUp: () => {
    const notes = [392, 523.25, 659.25, 783.99]
    notes.forEach((f, i) => {
      const delay = i * 0.09
      tone({ type: 'triangle', f0: f, dur: 0.35, gain: 0.09, delay })
      tone({ type: 'sine', f0: f * 2, dur: 0.3, gain: 0.045, delay })
    })
    noise({ dur: 0.6, gain: 0.03, attack: 0.4, filter: { type: 'highpass', f0: 3000 } })
  },

  // An exhale.
  rest: () => {
    tone({ type: 'sine', f0: 196, dur: 0.9, gain: 0.07, attack: 0.15, filter: { type: 'lowpass', f0: 900 } })
    tone({ type: 'sine', f0: 294, dur: 0.8, gain: 0.05, attack: 0.18 })
    noise({ dur: 0.8, gain: 0.02, attack: 0.25, filter: { type: 'lowpass', f0: 500 } })
  },

  // Arcane shimmer — two detuned voices beating against each other.
  spellSlot: () => {
    tone({ type: 'sine', f0: 660, f1: 990, dur: 0.18, gain: 0.07, filter: { type: 'highpass', f0: 400 } })
    tone({ type: 'sine', f0: 660, f1: 990, dur: 0.18, gain: 0.07, detune: 8, filter: { type: 'highpass', f0: 400 } })
  },

  deathSaveSuccess: () => {
    tone({ type: 'sine', f0: 440, f1: 659.25, dur: 0.25, gain: 0.1, attack: 0.02, filter: { type: 'lowpass', f0: 2000 } })
  },

  deathSaveFail: () => {
    tone({ type: 'sine', f0: 165, f1: 110, dur: 0.45, gain: 0.12 })
    noise({ dur: 0.4, gain: 0.05, filter: { type: 'lowpass', f0: 200 } })
  },

  conditionApplied: () => {
    tone({ type: 'triangle', f0: 233, dur: 0.25, gain: 0.06 })
    noise({ dur: 0.2, gain: 0.06, filter: { type: 'bandpass', f0: 400, f1: 2000, q: 2 } })
  },
}

export function playSound(name: SoundName) {
  const { enabled, volume } = useSoundStore.getState()
  if (!enabled || volume <= 0) return

  const audio = getCtx()
  if (!audio || !master) return

  // Rapid pip-clicking would otherwise machine-gun the same effect.
  const now = audio.currentTime
  if (now - (lastPlayedAt[name] ?? -Infinity) < RETRIGGER_GUARD) return
  lastPlayedAt[name] = now

  master.gain.value = volume
  RECIPES[name]()
}

// Browsers refuse to start an AudioContext until the user has interacted with the
// page, so the first gesture of the session creates it. Imported for side effect
// in App.tsx, which registers this before any UI exists.
function unlock() {
  getCtx()
}
window.addEventListener('pointerdown', unlock, { once: true, capture: true })
window.addEventListener('keydown', unlock, { once: true, capture: true })
