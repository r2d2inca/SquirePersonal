import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  if (!open) return null

  // Portal to <body>: any ancestor with a transform (e.g. a Card's hover lift) would
  // otherwise become the containing block for this fixed overlay, pinning the modal to
  // that element and making it jump as the mouse moves — the "screen glitching out" bug.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full ${sizeClasses[size]} bg-parchment-100 border border-parchment-400 rounded-2xl shadow-[var(--shadow-lg)] max-h-[90vh] flex flex-col`}
      >
        <div className="absolute inset-0 rounded-2xl shadow-[var(--shadow-inner-parchment)] pointer-events-none" />
        <div className="relative flex items-center justify-between p-5 border-b border-parchment-300">
          <h2 className="font-display text-xl text-ink-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-ink-500 hover:text-ink-900 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        <div className="relative p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
