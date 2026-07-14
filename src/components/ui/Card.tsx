import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'parchment' | 'dark'
  /** Cards lift on hover by default; set false for dense panels where it distracts. */
  hover?: boolean
  children: ReactNode
}

export function Card({
  variant = 'parchment',
  hover = true,
  className = '',
  children,
  ...props
}: CardProps) {
  const base =
    variant === 'parchment'
      ? 'bg-parchment-100 border border-parchment-400 shadow-[var(--shadow-md)] relative'
      : 'bg-leather-800 border border-leather-600 text-parchment-100 shadow-[var(--shadow-md)]'

  const lift = hover
    ? 'transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)] motion-reduce:transition-none motion-reduce:hover:translate-y-0'
    : ''

  return (
    <div className={`rounded-2xl p-5 ${base} ${lift} ${className}`} {...props}>
      {variant === 'parchment' && (
        <div className="absolute inset-0 rounded-2xl shadow-[var(--shadow-inner-parchment)] pointer-events-none" />
      )}
      <div className="relative">{children}</div>
    </div>
  )
}
