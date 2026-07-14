import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="font-display text-sm uppercase tracking-wider text-ink-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`px-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg text-ink-900 font-body placeholder:text-ink-300 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400 transition-colors ${error ? 'border-danger' : ''} ${className}`}
          {...props}
        />
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
