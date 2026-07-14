import { useState } from 'react'
import { ChevronDown, ChevronRight, Trash2, Eye, EyeOff, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { Spell } from '@/lib/types/database'

interface SpellCardProps {
  spell: Spell
  prepareDisabled?: boolean
  onTogglePrepared: () => void
  onDelete: () => void
}

export function SpellCard({ spell, prepareDisabled, onTogglePrepared, onDelete }: SpellCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-parchment-300 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 p-3 text-left hover:bg-parchment-200/50 transition-colors cursor-pointer"
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="font-body font-semibold text-ink-900 flex-1">{spell.name}</span>
        {spell.is_concentration && (
          <Badge variant="arcane">
            <Sparkles size={10} className="mr-1" /> Conc.
          </Badge>
        )}
        {spell.is_ritual && <Badge variant="default">Ritual</Badge>}
        {spell.source && <Badge variant="default">{spell.source}</Badge>}
        <Badge variant={spell.level === 0 ? 'default' : 'gold'}>
          {spell.level === 0 ? 'Cantrip' : `Lvl ${spell.level}`}
        </Badge>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-parchment-200 space-y-2">
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-ink-500">
            <span><strong>Casting Time:</strong> {spell.casting_time}</span>
            <span><strong>Range:</strong> {spell.range}</span>
            <span><strong>Components:</strong> {spell.components}</span>
            <span><strong>Duration:</strong> {spell.duration}{spell.is_concentration && ' (Concentration)'}</span>
            {spell.school && <span><strong>School:</strong> {spell.school}</span>}
          </div>
          <p className="text-sm text-ink-700 mt-2 whitespace-pre-wrap">{spell.description}</p>
          {spell.higher_levels && (
            <p className="text-sm text-arcane-600 italic mt-1">
              <strong>At Higher Levels:</strong> {spell.higher_levels}
            </p>
          )}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={onTogglePrepared}
              disabled={prepareDisabled}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                prepareDisabled ? 'opacity-40 cursor-default' :
                spell.is_prepared ? 'bg-gold-200 text-gold-700 cursor-pointer' : 'bg-parchment-200 text-ink-500 cursor-pointer'
              }`}
            >
              {spell.is_prepared ? <Eye size={12} /> : <EyeOff size={12} />}
              {spell.is_prepared ? 'Prepared' : 'Not Prepared'}
            </button>
            <button
              onClick={onDelete}
              className="ml-auto p-1 text-ink-300 hover:text-danger transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
