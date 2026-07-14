/**
 * Squire brand mark — a heraldic sword & quill saltire crest (adventure + record-keeping).
 * SINGLE SOURCE for the logo: when the final designed logo asset arrives, swap the SVG in
 * `Crest` (or replace it with an <img>) and every placement updates. The gold linework uses
 * `currentColor`, so callers set the tone via text color (e.g. text-gold-400 on dark surfaces,
 * text-gold-700 on parchment).
 */

interface CrestProps {
  className?: string
  title?: string
}

export function Crest({ className = '', title = 'Squire crest' }: CrestProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={title}>
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      {/* sword */}
      <g transform="rotate(32 50 50)" fill="currentColor">
        <path d="M50 18 L52.5 26 L52.5 54 L47.5 54 L47.5 26 Z" />
        <rect x="41.5" y="54" width="17" height="3.4" rx="1" />
        <rect x="48" y="57.4" width="4" height="13" rx="1" />
        <circle cx="50" cy="72.5" r="3" />
      </g>
      {/* quill */}
      <g transform="rotate(-32 50 50)">
        <path d="M50 17 C58 29 58 45 51 55 L50 54 L49 55 C42 45 42 29 50 17 Z" fill="currentColor" opacity="0.85" />
        <path d="M48 67 L52 67 L50 73 Z" fill="currentColor" />
      </g>
      {/* arcane gem where they cross */}
      <path d="M50 44 L54 50 L50 56 L46 50 Z" fill="#6a5acd" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  )
}

interface WordmarkProps {
  className?: string
  /** classes for the crest (set its size + color here, e.g. "w-9 h-9 text-gold-400") */
  crestClassName?: string
  /** classes for the "SQUIRE" text (set its size + color here) */
  textClassName?: string
}

export function Wordmark({
  className = '',
  crestClassName = 'w-9 h-9 text-gold-400',
  textClassName = 'text-2xl text-parchment-50',
}: WordmarkProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Crest className={crestClassName} />
      <span className={`font-display tracking-[0.14em] ${textClassName}`}>SQUIRE</span>
    </span>
  )
}
