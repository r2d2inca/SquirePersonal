import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-gold-400 to-gold-500 text-ink-900 border border-gold-600 shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] hover:from-gold-300 hover:to-gold-400 hover:shadow-[0_3px_6px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.3)]',
  secondary:
    'bg-parchment-200 text-ink-700 border border-parchment-400 hover:bg-parchment-100 hover:border-parchment-300',
  danger:
    'bg-gradient-to-b from-[#9b2c2c] to-[#7b2020] text-parchment-100 border border-[#6b1a1a] hover:from-[#a83232] hover:to-[#8b2424]',
  ghost:
    'bg-transparent text-ink-500 hover:text-ink-700 hover:bg-parchment-200/50 border border-transparent',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`font-display uppercase tracking-wider rounded-full transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
