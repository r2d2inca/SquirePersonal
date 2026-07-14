import { create } from 'zustand'

interface SoundState {
  enabled: boolean
  volume: number
  toggleEnabled: () => void
  setVolume: (v: number) => void
}

function clampVolume(v: number): number {
  if (!Number.isFinite(v)) return 0.5
  return Math.min(1, Math.max(0, v))
}

function readEnabled(): boolean {
  return localStorage.getItem('echo-sound-enabled') !== 'false'
}

function readVolume(): number {
  return clampVolume(parseFloat(localStorage.getItem('echo-sound-volume') ?? '0.5'))
}

export const useSoundStore = create<SoundState>((set) => ({
  enabled: readEnabled(),
  volume: readVolume(),
  toggleEnabled: () =>
    set((state) => {
      const next = !state.enabled
      localStorage.setItem('echo-sound-enabled', String(next))
      return { enabled: next }
    }),
  setVolume: (v) => {
    const next = clampVolume(v)
    localStorage.setItem('echo-sound-volume', String(next))
    set({ volume: next })
  },
}))
