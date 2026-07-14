import type { ReactNode } from 'react'

interface SectionHeaderProps {
  children: ReactNode
  className?: string
  action?: ReactNode
}

export function SectionHeader({ children, className = '', action }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-3 flex-1">
        <div className="h-px flex-1 max-w-8 bg-gradient-to-r from-transparent to-gold-400" />
        <h3 className="font-display text-lg uppercase tracking-[0.16em] text-ink-700 whitespace-nowrap">
          {children}
        </h3>
        <div className="h-px flex-1 bg-gradient-to-r from-gold-400 to-transparent" />
      </div>
      {action && <div className="ml-3">{action}</div>}
    </div>
  )
}
