import { useState, useRef } from 'react'
import { Upload, FileText, Loader2, AlertTriangle, Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { validateImportData, validatePdfImportData, importCharacter } from '@/lib/characterImport'
import type { CharacterExportEnvelope } from '@/lib/characterExport'

interface ImportCharacterModalProps {
  open: boolean
  onClose: () => void
  userId: string
  existingCharacterId?: string
  onImportComplete: () => void
}

type Tab = 'json' | 'pdf'

export function ImportCharacterModal({ open, onClose, userId, existingCharacterId, onImportComplete }: ImportCharacterModalProps) {
  const [tab, setTab] = useState<Tab>('pdf')
  const [preview, setPreview] = useState<CharacterExportEnvelope | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setPreview(null)
    setErrors([])
    setImportError(null)
    setParsing(false)
    setImporting(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleTabChange(t: Tab) {
    setTab(t)
    reset()
  }

  async function handleJsonFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    reset()

    try {
      const text = await file.text()
      const raw = JSON.parse(text)
      const result = validateImportData(raw)
      if (result.success) {
        setPreview(result.data)
      } else {
        setErrors(result.errors)
      }
    } catch {
      setErrors(['Invalid JSON file. Please select a valid Squire export file.'])
    }
  }

  async function handlePdfFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    reset()

    if (file.size > 4 * 1024 * 1024) {
      setErrors(['PDF must be under 4MB.'])
      return
    }

    setParsing(true)
    try {
      const buffer = await file.arrayBuffer()
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      )

      const res = await fetch('/api/parse-character-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf: base64 }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Server error' }))
        throw new Error(err.error || 'Failed to parse PDF')
      }

      const parsed = await res.json()
      const result = validatePdfImportData(parsed)
      if (result.success) {
        setPreview(result.data)
      } else {
        setErrors(result.errors)
      }
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to parse PDF'])
    } finally {
      setParsing(false)
    }
  }

  async function handleImport() {
    if (!preview) return
    setImporting(true)
    setImportError(null)
    try {
      await importCharacter(userId, preview, existingCharacterId)
      onImportComplete()
      onClose()
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Import Character" size="md">
      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-parchment-300">
        <button
          onClick={() => handleTabChange('pdf')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-display uppercase transition-colors cursor-pointer border-b-2 -mb-px ${
            tab === 'pdf' ? 'border-gold-400 text-gold-600' : 'border-transparent text-ink-500 hover:text-ink-700'
          }`}
        >
          <FileText size={14} />
          PDF Upload
        </button>
        <button
          onClick={() => handleTabChange('json')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-display uppercase transition-colors cursor-pointer border-b-2 -mb-px ${
            tab === 'json' ? 'border-gold-400 text-gold-600' : 'border-transparent text-ink-500 hover:text-ink-700'
          }`}
        >
          <Upload size={14} />
          Squire JSON
        </button>
      </div>

      {/* File upload */}
      {!preview && !parsing && (
        <div className="space-y-4">
          <label
            className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-parchment-400 rounded-lg hover:border-gold-400 transition-colors cursor-pointer"
          >
            {tab === 'pdf' ? <FileText size={32} className="text-ink-300" /> : <Upload size={32} className="text-ink-300" />}
            <span className="text-ink-500 text-sm text-center">
              {tab === 'pdf'
                ? 'Upload a D&D 5e character sheet PDF'
                : 'Upload a Squire export (.json) file'}
            </span>
            <span className="text-xs text-ink-300">Click to browse</span>
            <input
              ref={fileInputRef}
              type="file"
              accept={tab === 'pdf' ? '.pdf' : '.json'}
              className="hidden"
              onChange={tab === 'pdf' ? handlePdfFile : handleJsonFile}
            />
          </label>
        </div>
      )}

      {/* Parsing state */}
      {parsing && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 size={32} className="animate-spin text-gold-500" />
          <p className="text-ink-700 font-body">Analyzing character sheet...</p>
          <p className="text-ink-400 text-sm">This may take a few seconds</p>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-3">
          <div className="bg-danger/10 border border-danger/30 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-danger mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-danger">Import validation failed</p>
                <ul className="mt-2 text-xs text-ink-700 space-y-1 list-disc list-inside">
                  {errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                  {errors.length > 5 && <li>...and {errors.length - 5} more errors</li>}
                </ul>
              </div>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={reset}>Try another file</Button>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Check size={16} className="text-success" />
              <span className="text-sm font-semibold text-success">Character parsed successfully</span>
            </div>
            <div className="space-y-2">
              <div className="font-display text-xl text-ink-900">{preview.character.name}</div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-0.5 bg-gold-200 text-gold-700 rounded">Level {preview.character.level}</span>
                <span className="px-2 py-0.5 bg-parchment-300 text-ink-700 rounded">{preview.character.race}</span>
                <span className="px-2 py-0.5 bg-parchment-300 text-ink-700 rounded">
                  {preview.character.class}
                  {preview.character.subclass ? ` (${preview.character.subclass})` : ''}
                </span>
                {preview.character.background && (
                  <span className="px-2 py-0.5 bg-parchment-300 text-ink-700 rounded">{preview.character.background}</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-ink-500">
                <div>HP: {preview.character.max_hp}</div>
                <div>AC: {preview.character.armor_class}</div>
                <div>Speed: {preview.character.speed} ft</div>
              </div>
              <div className="grid grid-cols-6 gap-1 mt-2 text-center text-xs">
                {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map(ab => (
                  <div key={ab} className="bg-parchment-200 rounded p-1">
                    <div className="font-display uppercase text-[10px] text-ink-400">{ab.slice(0, 3)}</div>
                    <div className="font-mono text-ink-900">{preview.character[ab]}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-ink-500">
                {preview.spells.length > 0 && <span>{preview.spells.length} spells</span>}
                {preview.inventoryItems.length > 0 && <span>{preview.inventoryItems.length} items</span>}
                {preview.character.features.length > 0 && <span>{preview.character.features.length} features</span>}
              </div>
            </div>
          </Card>

          {existingCharacterId && (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle size={14} className="text-warning mt-0.5 flex-shrink-0" />
              <p className="text-xs text-ink-700">
                This will archive your current character. You can re-import it later from an export file.
              </p>
            </div>
          )}

          {importError && (
            <div className="bg-danger/10 border border-danger/30 rounded-lg p-3">
              <p className="text-sm text-danger">{importError}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleImport} disabled={importing}>
              {importing ? <><Loader2 size={14} className="mr-1 animate-spin" /> Importing...</> : 'Import Character'}
            </Button>
            <Button variant="secondary" onClick={reset}>Cancel</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
