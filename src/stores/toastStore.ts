import { create } from 'zustand'

export type ToastTone = 'default' | 'danger' | 'heal'

export interface Toast {
  id: string
  message: string
  tone?: ToastTone
  /** Toasts sharing a tag replace one another, so Undos never stack up. */
  tag?: string
  action?: { label: string; onClick: () => void }
  duration?: number
}

interface ToastState {
  toasts: Toast[]
  push: (toast: Omit<Toast, 'id'>) => string
  dismiss: (id: string) => void
}

const DEFAULT_DURATION = 6000
const MAX_TOASTS = 3

const timers = new Map<string, ReturnType<typeof setTimeout>>()

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  push: (toast) => {
    const id = crypto.randomUUID()
    const next: Toast = { ...toast, id }

    set((s) => {
      const kept = toast.tag ? s.toasts.filter((t) => t.tag !== toast.tag) : s.toasts
      // Clear timers for the toasts we just dropped so they can't fire later.
      for (const t of s.toasts) {
        if (!kept.includes(t)) {
          const timer = timers.get(t.id)
          if (timer) clearTimeout(timer)
          timers.delete(t.id)
        }
      }
      return { toasts: [...kept, next].slice(-MAX_TOASTS) }
    })

    timers.set(
      id,
      setTimeout(() => get().dismiss(id), toast.duration ?? DEFAULT_DURATION),
    )
    return id
  },

  dismiss: (id) => {
    const timer = timers.get(id)
    if (timer) clearTimeout(timer)
    timers.delete(id)
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))

/** Push a toast from outside React (stores, event handlers). */
export function pushToast(toast: Omit<Toast, 'id'>): string {
  return useToastStore.getState().push(toast)
}
