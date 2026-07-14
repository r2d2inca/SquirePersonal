import { forwardRef, type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="font-display text-sm uppercase tracking-wider text-ink-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={`px-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg text-ink-900 font-body placeholder:text-ink-300 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400 transition-colors resize-y min-h-[80px] ${error ? 'border-danger' : ''} ${className}`}
          {...props}
        />
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
