import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { concentrationSaveDC } from '@/lib/conditions'

interface ConcentrationPromptProps {
  open: boolean
  damage: number
  spellName: string
  onSaved: () => void
  onBroken: () => void
  onClose: () => void
}

export function ConcentrationPrompt({ open, damage, spellName, onSaved, onBroken, onClose }: ConcentrationPromptProps) {
  const dc = concentrationSaveDC(damage)

  return (
    <Modal open={open} onClose={onClose} title="Concentration Check" size="sm">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle size={20} className="text-arcane-600 mt-0.5 shrink-0" />
        <p className="text-sm text-ink-700">
          You took <span className="font-mono font-semibold text-ink-900">{damage}</span> damage while
          concentrating on <span className="font-semibold text-ink-900">{spellName}</span>. Make a
          {' '}<span className="font-semibold text-ink-900">DC {dc} Constitution</span> saving throw or lose concentration.
        </p>
      </div>
      <div className="flex items-center justify-end gap-3">
        <Button variant="secondary" size="sm" onClick={() => { onSaved(); onClose() }}>
          Made the Save
        </Button>
        <Button variant="danger" size="sm" onClick={() => { onBroken(); onClose() }}>
          Lost Concentration
        </Button>
      </div>
    </Modal>
  )
}
