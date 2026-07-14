export function Divider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 my-4 ${className}`}>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-parchment-400 to-transparent" />
      <svg width="12" height="12" viewBox="0 0 12 12" className="text-gold-400">
        <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="currentColor" />
      </svg>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-parchment-400 to-transparent" />
    </div>
  )
}
