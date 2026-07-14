import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Check } from 'lucide-react'

interface FeatureOption {
  index: string
  name: string
  description: string
}

interface FeatureChoice {
  id: string
  label: string
  minLevel: number
  options: FeatureOption[]
}

interface FeatureChoicesStepProps {
  choices: FeatureChoice[]
  selections: Record<string, string[]>
  onSelectionsChange: (selections: Record<string, string[]>) => void
}

export function FeatureChoicesStep({
  choices,
  selections,
  onSelectionsChange,
}: FeatureChoicesStepProps) {
  function toggleOption(choiceId: string, optionIndex: string) {
    const current = selections[choiceId] ?? []
    if (current.includes(optionIndex)) {
      onSelectionsChange({ ...selections, [choiceId]: current.filter(s => s !== optionIndex) })
    } else {
      // Single-select by default: replace selection
      onSelectionsChange({ ...selections, [choiceId]: [optionIndex] })
    }
  }

  return (
    <div className="space-y-4">
      {choices.map(choice => {
        if (choice.options.length === 0) {
          return (
            <Card key={choice.id}>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="gold">Lvl {choice.minLevel}</Badge>
                <span className="font-display text-sm text-ink-900">{choice.label}</span>
              </div>
              <p className="text-xs text-ink-500">You'll configure this from the character sheet.</p>
            </Card>
          )
        }

        const selected = selections[choice.id] ?? []

        return (
          <Card key={choice.id}>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="gold">Lvl {choice.minLevel}</Badge>
              <span className="font-display text-sm text-ink-900">{choice.label}</span>
              <Badge variant={selected.length > 0 ? 'gold' : 'default'}>
                {selected.length} selected
              </Badge>
            </div>
            <div className="space-y-2">
              {choice.options.map(option => {
                const isSelected = selected.includes(option.index)
                return (
                  <button
                    key={option.index}
                    onClick={() => toggleOption(choice.id, option.index)}
                    className={`w-full p-3 rounded-lg border-2 text-left cursor-pointer transition-all ${
                      isSelected ? 'border-gold-400 bg-gold-100/50' : 'border-parchment-300 hover:border-parchment-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm text-ink-900">{option.name}</span>
                      {isSelected && <Check size={14} className="text-gold-500" />}
                    </div>
                    <p className="text-xs text-ink-600 mt-1">{option.description}</p>
                  </button>
                )
              })}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
