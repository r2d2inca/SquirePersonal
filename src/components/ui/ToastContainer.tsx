import { X } from 'lucide-react'
import { useToastStore, type ToastTone } from '@/stores/toastStore'

const TONE_BORDER: Record<ToastTone, string> = {
  default: 'border-l-parchment-400',
  danger: 'border-l-danger',
  heal: 'border-l-heal',
}

/**
 * Bottom-left so it clears the dice roller (bottom-right) and the mobile nav.
 * Sits above Modal and DiceRoller, both of which are z-50.
 */
export function ToastContainer() {
  const { toasts, dismiss } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: none; }
        }
        .toast-item { animation: toast-in 180ms ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .toast-item { animation: none; }
        }
      `}</style>
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-20 left-4 md:bottom-4 z-[60] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-item flex items-center gap-3 rounded-lg border border-parchment-400 border-l-2 ${
              TONE_BORDER[toast.tone ?? 'default']
            } bg-parchment-100 px-3 py-2 shadow-[var(--shadow-lg)]`}
          >
            <span className="flex-1 text-sm text-ink-900">{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick()
                  dismiss(toast.id)
                }}
                className="font-display text-xs uppercase tracking-wider text-gold-600 hover:text-gold-500 cursor-pointer"
              >
                {toast.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
              className="p-1 text-ink-300 hover:text-ink-700 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
