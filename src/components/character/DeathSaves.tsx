import { SectionHeader } from '@/components/ui/SectionHeader'
import { Skull, Heart } from 'lucide-react'

interface DeathSavesProps {
  successes: number
  failures: number
  onUpdate: (updates: { death_save_successes?: number; death_save_failures?: number }) => void
}

export function DeathSaves({ successes, failures, onUpdate }: DeathSavesProps) {
  return (
    <div className="bg-ink-900/5 border border-danger/30 rounded-lg p-4">
      <SectionHeader>Death Saves</SectionHeader>
      <div className="flex items-center gap-8 justify-center">
        {/* Successes */}
        <div className="flex items-center gap-2">
          <Heart size={16} className="text-heal" />
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <button
                key={`s-${i}`}
                onClick={() => onUpdate({ death_save_successes: i <= successes ? i - 1 : i })}
                className={`w-5 h-5 rounded-full border-2 transition-colors cursor-pointer ${
                  i <= successes
                    ? 'bg-heal border-heal'
                    : 'bg-transparent border-parchment-400 hover:border-heal/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Failures */}
        <div className="flex items-center gap-2">
          <Skull size={16} className="text-danger" />
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <button
                key={`f-${i}`}
                onClick={() => onUpdate({ death_save_failures: i <= failures ? i - 1 : i })}
                className={`w-5 h-5 rounded-full border-2 transition-colors cursor-pointer ${
                  i <= failures
                    ? 'bg-danger border-danger'
                    : 'bg-transparent border-parchment-400 hover:border-danger/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
