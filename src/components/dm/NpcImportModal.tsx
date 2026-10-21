import { useRef, useState } from 'react'
import { Upload, ClipboardPaste, FileJson, Sparkles, Loader2, Wand2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { requestStatBlock, parseNpcJson, type NpcDraft } from '@/lib/npcImport'

type ImportTab = 'paste' | 'upload' | 'json' | 'generate'

const TABS: { id: ImportTab; label: string; icon: typeof Upload }[] = [
  { id: 'paste', label: 'Paste Text', icon: ClipboardPaste },
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'json', label: 'JSON', icon: FileJson },
  { id: 'generate', label: 'AI Generate', icon: Sparkles },
]

interface NpcImportModalProps {
  open: boolean
  onClose: () => void
  /** Short party description so generated creatures are tuned sensibly. */
  partyContext?: string
  /** Receives the parsed draft; the caller opens the review form with it. */
  onDraft: (draft: NpcDraft) => void
}

/**
 * Four ways in: paste a stat block, upload a PDF/image of one, drop in JSON
 * (ours or any stat-block-shaped object), or describe a creature and let
 * Claude design it. Every path ends in the same review form, so nothing is
 * saved without the DM looking at it first.
 */
export function NpcImportModal({ open, onClose, partyContext, onDraft }: NpcImportModalProps) {
  const [tab, setTab] = useState<ImportTab>('paste')
  const [text, setText] = useState('')
  const [jsonText, setJsonText] = useState('')
  const [brief, setBrief] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setText('')
    setJsonText('')
    setBrief('')
    setFile(null)
    setError(null)
    setBusy(false)
  }

  function finish(draft: NpcDraft) {
    reset()
    onDraft(draft)
  }

  async function run(fn: () => Promise<NpcDraft>) {
    setBusy(true)
    setError(null)
    try {
      finish(await fn())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setBusy(false)
    }
  }

  function handleJsonFile(f: File) {
    f.text().then(setJsonText).catch(() => setError('Could not read that file'))
  }

  const canSubmit =
    (tab === 'paste' && text.trim().length > 20) ||
    (tab === 'upload' && !!file) ||
    (tab === 'json' && jsonText.trim().length > 2) ||
    (tab === 'generate' && brief.trim().length > 5)

  function handleSubmit() {
    if (tab === 'paste') return run(() => requestStatBlock({ mode: 'parse', text }))
    if (tab === 'upload') return run(() => requestStatBlock({ mode: 'parse', file: file! }))
    if (tab === 'json') return run(async () => parseNpcJson(jsonText))
    return run(() => requestStatBlock({ mode: 'generate', text: brief, context: partyContext }))
  }

  const inputClass = 'w-full px-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm text-ink-900 focus:outline-none focus:border-gold-400 resize-y'

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title="Import or Generate NPC" size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-1 border-b border-parchment-300 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setError(null) }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-display uppercase tracking-wider border-b-2 -mb-px whitespace-nowrap cursor-pointer transition-colors ${
                tab === id ? 'border-gold-400 text-gold-600' : 'border-transparent text-ink-300 hover:text-ink-700'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {tab === 'paste' && (
          <div className="space-y-2">
            <p className="text-xs text-ink-500">Copy a stat block from a PDF, a homebrew doc, or a website and paste it here. Formatting doesn't matter.</p>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} placeholder={'Goblin Boss\nSmall humanoid (goblinoid), neutral evil\nArmor Class 17 (chain shirt, shield)\nHit Points 21 (6d6)\nSpeed 30 ft.\nSTR 10 (+0) DEX 14 (+2) ...'} className={`${inputClass} font-mono text-xs`} />
          </div>
        )}

        {tab === 'upload' && (
          <div className="space-y-3">
            <p className="text-xs text-ink-500">A photo or screenshot of a stat block, or a PDF page. One creature per upload works best.</p>
            <input ref={fileInputRef} type="file" accept="application/pdf,image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-parchment-400 hover:border-gold-400 rounded-xl p-8 text-center cursor-pointer transition-colors"
            >
              <Upload size={24} className="mx-auto text-ink-300 mb-2" />
              {file ? (
                <p className="text-sm text-ink-900">{file.name} <span className="text-ink-400">({Math.round(file.size / 1024)} KB)</span></p>
              ) : (
                <p className="text-sm text-ink-500">Click to choose a PDF or image</p>
              )}
            </button>
            {file && file.size > 8 * 1024 * 1024 && <p className="text-xs text-warning">Large file; parsing may take a while or fail. A single-page crop works better.</p>}
          </div>
        )}

        {tab === 'json' && (
          <div className="space-y-2">
            <p className="text-xs text-ink-500">A Squire NPC export, or any JSON with the usual stat block fields (name, armor_class, hit_points, actions...).</p>
            <input type="file" accept="application/json,.json" className="text-xs text-ink-500" onChange={(e) => e.target.files?.[0] && handleJsonFile(e.target.files[0])} />
            <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} rows={10} placeholder='{ "name": "...", "armor_class": 15, ... }' className={`${inputClass} font-mono text-xs`} />
          </div>
        )}

        {tab === 'generate' && (
          <div className="space-y-2">
            <p className="text-xs text-ink-500">Describe what you need and Claude drafts a full stat block tuned to the CR you ask for. You review it before it saves.</p>
            <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={5} placeholder="CR 5 goblin shaman who hurls fire and commands a swarm of rats. Cowardly, flees at half HP." className={inputClass} />
            {partyContext && <p className="text-[11px] text-ink-400">Tuned against: {partyContext}</p>}
          </div>
        )}

        {error && <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">{error}</p>}

        <Button onClick={handleSubmit} disabled={!canSubmit || busy} className="w-full">
          {busy ? (
            <><Loader2 size={14} className="mr-1 animate-spin" /> {tab === 'generate' ? 'Designing...' : 'Parsing...'}</>
          ) : tab === 'generate' ? (
            <><Wand2 size={14} className="mr-1" /> Generate & Review</>
          ) : (
            <>Parse & Review</>
          )}
        </Button>
      </div>
    </Modal>
  )
}
