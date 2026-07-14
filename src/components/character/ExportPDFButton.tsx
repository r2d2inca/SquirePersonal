import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { generateCharacterPDF } from '@/lib/pdfExport'
import type { Character, Spell, SpellSlot, InventoryItem } from '@/lib/types/database'

interface ExportPDFButtonProps {
  character: Character
  spells: Spell[]
  spellSlots: SpellSlot[]
  items: InventoryItem[]
}

export function ExportPDFButton({ character, spells, spellSlots, items }: ExportPDFButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      await generateCharacterPDF(character, spells, spellSlots, items)
    } catch (err) {
      console.error('Failed to generate PDF:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={loading}
      onClick={handleExport}
    >
      {loading ? <Loader2 size={14} className="mr-1 animate-spin" /> : <FileDown size={14} className="mr-1" />}
      {loading ? 'Generating...' : 'Export PDF'}
    </Button>
  )
}
