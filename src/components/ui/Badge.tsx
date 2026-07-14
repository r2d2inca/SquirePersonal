import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'gold' | 'arcane' | 'danger' | 'success'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-parchment-300 text-ink-700',
  gold: 'bg-gold-200 text-gold-700',
  arcane: 'bg-arcane-400/20 text-arcane-600',
  danger: 'bg-danger/10 text-danger',
  success: 'bg-heal/10 text-heal',
}

export function Badge({ variant = 'default', className = '', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-display uppercase tracking-wider ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
