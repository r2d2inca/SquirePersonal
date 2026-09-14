import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { downloadCharacterJSON } from '@/lib/characterExport'
import { pushToast } from '@/stores/toastStore'

export function ExportJSONButton({ characterId }: { characterId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const warnings = await downloadCharacterJSON(characterId)
      for (const message of warnings) pushToast({ message, tone: 'danger' })
    } catch (err) {
      console.error('Failed to export character:', err)
      pushToast({ message: err instanceof Error ? err.message : 'Export failed', tone: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="secondary" size="sm" disabled={loading} onClick={handleExport}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      <span className="hidden md:inline ml-1">{loading ? 'Exporting...' : 'Export JSON'}</span>
    </Button>
  )
}
