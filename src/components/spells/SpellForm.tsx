import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SPELL_SCHOOLS } from '@/lib/constants'
import { Search, BookOpen, Loader2 } from 'lucide-react'
import {
  getAllSpells,
  getSpellsByClass,
  getSpellDetail,
  formatSpellComponents,
  formatSpellDescription,
  type SRDSpellSummary,
} from '@/lib/dnd5e'

interface FormData {
  name: string
  level: number
  school: string
  casting_time: string
  range: string
  components: string
  duration: string
  is_concentration: boolean
  is_ritual: boolean
  is_prepared: boolean
  description: string
  higher_levels: string
  source: string
}

interface SpellFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: FormData) => void
  characterClass?: string
  maxSpellLevel?: number
  existingSpellNames?: string[]
  initialData?: Partial<FormData>
}

export function SpellForm({ open, onClose, onSubmit, characterClass, maxSpellLevel, existingSpellNames = [], initialData }: SpellFormProps) {
  const [mode, setMode] = useState<'search' | 'manual'>('search')
  const [spellList, setSpellList] = useState<SRDSpellSummary[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingSpells, setLoadingSpells] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [filterLevel, setFilterLevel] = useState<number | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: '',
      school: '',
      casting_time: '1 action',
      range: '',
      components: '',
      duration: '',
      is_concentration: false,
      is_ritual: false,
      is_prepared: false,
      description: '',
      higher_levels: '',
      source: 'SRD',
      ...initialData,
      // Native <select> only reflects a value that string-matches an option value,
      // so the level must be a string here (coerced back to a number on submit).
      level: String(initialData?.level ?? 0) as unknown as number,
    },
  })

  // Load spell list when modal opens
  useEffect(() => {
    if (!open) return
    setLoadingSpells(true)
    const fetcher = characterClass
      ? getSpellsByClass(characterClass)
      : getAllSpells()
    fetcher
      .then(setSpellList)
      .catch(console.error)
      .finally(() => setLoadingSpells(false))
  }, [open, characterClass])

  // Focus search input when opening in search mode
  useEffect(() => {
    if (open && mode === 'search') {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [open, mode])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('')
      setFilterLevel(null)
      setMode('search')
      reset()
    }
  }, [open, reset])

  async function selectSpell(spell: SRDSpellSummary) {
    setLoadingDetail(true)
    try {
      const detail = await getSpellDetail(spell.index)
      setValue('name', detail.name)
      // String so the native <select> reflects it (option values are strings); submit coerces to number.
      setValue('level', String(detail.level) as unknown as number)
      setValue('school', detail.school.name)
      setValue('casting_time', detail.casting_time)
      setValue('range', detail.range)
      setValue('components', formatSpellComponents(detail.components, detail.material))
      setValue('duration', detail.duration)
      setValue('is_concentration', detail.concentration)
      setValue('is_ritual', detail.ritual)
      setValue('description', formatSpellDescription(detail.desc))
      setValue('higher_levels', detail.higher_level ? formatSpellDescription(detail.higher_level) : '')
      setValue('source', 'SRD')
      setMode('manual') // Switch to form view to review/edit before submitting
    } catch (err) {
      console.error('Failed to load spell details:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  const filtered = spellList
    .filter((s) => {
      if (maxSpellLevel != null && s.level > maxSpellLevel && s.level > 0) return false
      if (filterLevel !== null && s.level !== filterLevel) return false
      if (searchQuery) {
        return s.name.toLowerCase().includes(searchQuery.toLowerCase())
      }
      return true
    })
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))

  return (
    <Modal open={open} onClose={onClose} title="Add Spell" size="lg">
      {/* Mode toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode('search')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-display uppercase cursor-pointer transition-colors ${
            mode === 'search' ? 'bg-gold-400 text-ink-900' : 'bg-parchment-200 text-ink-500'
          }`}
        >
          <BookOpen size={14} /> SRD Spells
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-display uppercase cursor-pointer transition-colors ${
            mode === 'manual' ? 'bg-gold-400 text-ink-900' : 'bg-parchment-200 text-ink-500'
          }`}
        >
          Custom Spell
        </button>
      </div>

      {mode === 'search' ? (
        /* ─── Spell Search ─── */
        <div className="space-y-3">
          {/* Search input */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={characterClass ? `Search ${characterClass} spells...` : 'Search all SRD spells...'}
              className="w-full pl-9 pr-4 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400"
            />
          </div>

          {/* Level filter chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterLevel(null)}
              className={`px-2.5 py-1 rounded text-xs font-display uppercase cursor-pointer transition-colors ${
                filterLevel === null ? 'bg-gold-400 text-ink-900' : 'bg-parchment-200 text-ink-500'
              }`}
            >
              All
            </button>
            {Array.from({ length: 10 }, (_, i) => i)
              .filter((level) => maxSpellLevel == null || level === 0 || level <= maxSpellLevel)
              .map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setFilterLevel(filterLevel === level ? null : level)}
                className={`px-2.5 py-1 rounded text-xs font-display uppercase cursor-pointer transition-colors ${
                  filterLevel === level ? 'bg-gold-400 text-ink-900' : 'bg-parchment-200 text-ink-500'
                }`}
              >
                {level === 0 ? 'Cantrip' : `Lvl ${level}`}
              </button>
            ))}
          </div>

          {/* Spell list */}
          <div className="max-h-[400px] overflow-y-auto border border-parchment-300 rounded-lg">
            {loadingSpells ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-gold-400" />
                <span className="ml-2 text-sm text-ink-500">Loading spells...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-sm text-ink-500">
                No spells found. Try a different search or level filter.
              </div>
            ) : (
              filtered.map((spell) => {
                const alreadyKnown = existingSpellNames.includes(spell.name.toLowerCase())
                return (
                <button
                  key={spell.index}
                  type="button"
                  onClick={() => !alreadyKnown && selectSpell(spell)}
                  disabled={loadingDetail || alreadyKnown}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left border-b border-parchment-200 last:border-b-0 transition-colors ${
                    alreadyKnown ? 'opacity-40 cursor-default' : 'hover:bg-gold-100/50 cursor-pointer disabled:opacity-50'
                  }`}
                >
                  <span className="font-body text-sm text-ink-900">
                    {spell.name}
                    {alreadyKnown && <span className="text-xs text-ink-400 ml-2">(known)</span>}
                  </span>
                  <span className="text-xs font-mono text-ink-400">
                    {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                  </span>
                </button>
                )
              })
            )}
          </div>

          {loadingDetail && (
            <div className="flex items-center gap-2 text-sm text-arcane-500">
              <Loader2 size={14} className="animate-spin" />
              Loading spell details...
            </div>
          )}

          <p className="text-xs text-ink-300 text-center">
            Data from the D&D 5e SRD. Select a spell to auto-fill all details, or switch to Custom Spell.
          </p>
        </div>
      ) : (
        /* ─── Manual/Edit Form ─── */
        <form onSubmit={handleSubmit((data) => onSubmit({ ...data, level: Number(data.level) }))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name" error={errors.name?.message} {...register('name')} />
            <Select
              label="Level"
              options={[
                { value: '0', label: 'Cantrip' },
                ...Array.from({ length: 9 }, (_, i) => ({ value: `${i + 1}`, label: `Level ${i + 1}` })),
              ]}
              {...register('level')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="School"
              options={SPELL_SCHOOLS.map((s) => ({ value: s, label: s }))}
              placeholder="Select school"
              {...register('school')}
            />
            <Input label="Casting Time" {...register('casting_time')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Range" placeholder="e.g. 60 feet, Self, Touch" {...register('range')} />
            <Input label="Duration" placeholder="e.g. 1 minute, Instantaneous" {...register('duration')} />
          </div>

          <Input label="Components" placeholder="V, S, M (a tiny ball of bat guano)" {...register('components')} />

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('is_concentration')} className="accent-arcane-500" />
              Concentration
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('is_ritual')} className="accent-gold-500" />
              Ritual
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('is_prepared')} className="accent-gold-500" />
              Prepared
            </label>
          </div>

          <Textarea
            label="Description"
            rows={4}
            error={errors.description?.message}
            {...register('description')}
          />

          <Textarea
            label="At Higher Levels (optional)"
            rows={2}
            {...register('higher_levels')}
          />

          <Input label="Source (optional)" placeholder="PHB, XGE, etc." {...register('source')} />

          <Button type="submit" className="w-full">Add Spell</Button>
        </form>
      )}
    </Modal>
  )
}
