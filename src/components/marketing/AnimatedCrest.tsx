/**
 * Intro-animation variant of the Squire crest: the sword and quill sweep in from opposite
 * swings and cross into the saltire, the roundel draws itself, and the arcane gem pops.
 * Rendered only during the first-visit intro (see LandingPage); the static `Crest` in
 * `@/components/brand/Logo` is used everywhere else. Reduced motion → final state, no animation.
 */
export function AnimatedCrest({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Squire crest">
      <style>{`
        .ac-sword,.ac-quill,.ac-roundel,.ac-gem{transform-box:view-box;transform-origin:50px 50px}
        .ac-sword{animation:acSword 1.1s cubic-bezier(.2,.75,.2,1) both}
        .ac-quill{animation:acQuill 1.1s cubic-bezier(.2,.75,.2,1) both}
        @keyframes acSword{0%{opacity:0;transform:rotate(-70deg) scale(.6)}60%{opacity:1}100%{opacity:1;transform:rotate(32deg) scale(1)}}
        @keyframes acQuill{0%{opacity:0;transform:rotate(70deg) scale(.6)}60%{opacity:1}100%{opacity:1;transform:rotate(-32deg) scale(1)}}
        .ac-roundel{stroke-dasharray:290;stroke-dashoffset:290;animation:acDraw .9s .9s ease-out forwards}
        .ac-roundel.ac-inner{stroke-dasharray:252;stroke-dashoffset:252}
        @keyframes acDraw{to{stroke-dashoffset:0}}
        .ac-gem{opacity:0;animation:acGem .5s 1.35s cubic-bezier(.2,1.4,.4,1) forwards}
        @keyframes acGem{from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}
        @media (prefers-reduced-motion: reduce){
          .ac-sword,.ac-quill,.ac-roundel,.ac-gem{animation:none!important;opacity:1!important;transform:none!important;stroke-dashoffset:0!important}
        }
      `}</style>
      <circle className="ac-roundel" cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle className="ac-roundel ac-inner" cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      <g className="ac-sword" fill="currentColor">
        <path d="M50 18 L52.5 26 L52.5 54 L47.5 54 L47.5 26 Z" />
        <rect x="41.5" y="54" width="17" height="3.4" rx="1" />
        <rect x="48" y="57.4" width="4" height="13" rx="1" />
        <circle cx="50" cy="72.5" r="3" />
      </g>
      <g className="ac-quill">
        <path d="M50 17 C58 29 58 45 51 55 L50 54 L49 55 C42 45 42 29 50 17 Z" fill="currentColor" opacity="0.85" />
        <path d="M48 67 L52 67 L50 73 Z" fill="currentColor" />
      </g>
      <path className="ac-gem" d="M50 44 L54 50 L50 56 L46 50 Z" fill="#6a5acd" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  )
}
