export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        className="animate-spin text-gold-400"
        style={{ animationDuration: '2s' }}
      >
        <polygon
          points="20,2 24,14 36,14 26,22 30,34 20,26 10,34 14,22 4,14 16,14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    </div>
  )
}
