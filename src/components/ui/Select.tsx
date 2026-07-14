import { forwardRef, type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="font-display text-sm uppercase tracking-wider text-ink-700">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={`px-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg text-ink-900 font-body focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400 transition-colors ${error ? 'border-danger' : ''} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    )
  }
)

Select.displayName = 'Select'
