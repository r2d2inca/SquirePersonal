import { useState, useEffect, useRef } from 'react'
import { Search, BookOpen, Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { getClassChoiceData, type LocalSubclass, type LocalFeatureOption } from '@/lib/phbData'
import { getSubclassLabel } from '@/lib/classChoices'
import type { Feature } from '@/lib/types/database'

interface ClassChoicesFormProps {
  open: boolean
  onClose: () => void
  characterClass: string
  type: 'subclass' | 'feature'
  featureIndex?: string
  featureLabel?: string
  onSelectSubclass: (name: string, description: string) => void
  onAddFeature: (feature: Feature) => void
}

export function ClassChoicesForm({
  open,
  onClose,
  characterClass,
  type,
  featureIndex,
  featureLabel,
  onSelectSubclass,
  onAddFeature,
}: ClassChoicesFormProps) {
  const [mode, setMode] = useState<'search' | 'manual'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Selected detail state
  const [selectedSubclass, setSelectedSubclass] = useState<LocalSubclass | null>(null)
  const [selectedFeature, setSelectedFeature] = useState<LocalFeatureOption | null>(null)

  // Manual form state
  const [manualName, setManualName] = useState('')
  const [manualDescription, setManualDescription] = useState('')

  const subclassLabel = getSubclassLabel(characterClass)
  const title = type === 'subclass' ? `Select ${subclassLabel}` : (featureLabel || 'Select Class Feature')

  // Get data from local PHB data
  const classData = getClassChoiceData(characterClass)
  const subclasses = classData?.subclasses ?? []
  const featureChoice = classData?.featureChoices.find((fc) => fc.featureIndex === featureIndex)
  const featureOptions = featureChoice?.options ?? []

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) return
    setSelectedSubclass(null)
    setSelectedFeature(null)
    setSearchQuery('')
    setMode('search')
    setManualName('')
    setManualDescription('')
  }, [open])

  // Focus search input
  useEffect(() => {
    if (open && mode === 'search') {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [open, mode])

  function handleSelectSubclass(sub: LocalSubclass) {
    setSelectedSubclass(sub)
  }

  function handleSelectFeatureOption(option: LocalFeatureOption) {
    setSelectedFeature(option)
  }

  function confirmSubclass() {
    if (!selectedSubclass) return
    onSelectSubclass(selectedSubclass.name, selectedSubclass.description)
    onClose()
  }

  function confirmFeature() {
    if (!selectedFeature) return
    onAddFeature({
      name: selectedFeature.name,
      description: selectedFeature.description,
      source: `${characterClass} Choice`,
    })
    onClose()
  }

  function submitManual() {
    if (!manualName.trim()) return
    if (type === 'subclass') {
      onSelectSubclass(manualName.trim(), manualDescription.trim())
    } else {
      onAddFeature({
        name: manualName.trim(),
        description: manualDescription.trim(),
        source: `${characterClass} Choice`,
      })
    }
    onClose()
  }

  // Filter items by search
  const filteredSubclasses = subclasses.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredOptions = featureOptions.filter((o) =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Check if we have options to show at all (some feature choices like Expertise have no predefined list)
  const hasNoOptions = type === 'feature' && featureOptions.length === 0

  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      {/* Mode toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode('search')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-display uppercase cursor-pointer transition-colors ${
            mode === 'search' ? 'bg-gold-400 text-ink-900' : 'bg-parchment-200 text-ink-500'
          }`}
        >
          <BookOpen size={14} /> 5E Options
        </button>
        <button
          type="button"
          onClick={() => { setMode('manual'); setSelectedSubclass(null); setSelectedFeature(null) }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-display uppercase cursor-pointer transition-colors ${
            mode === 'manual' ? 'bg-gold-400 text-ink-900' : 'bg-parchment-200 text-ink-500'
          }`}
        >
          Custom Entry
        </button>
      </div>

      {mode === 'search' ? (
        <div className="space-y-3">
          {/* Automatically switch to manual if no options */}
          {hasNoOptions ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm text-ink-500">
                This choice doesn't have a predefined list of options.
                Use Custom Entry to log your selection.
              </p>
              <Button variant="secondary" onClick={() => setMode('manual')}>
                Switch to Custom Entry
              </Button>
            </div>
          ) : (
            <>
              {/* Search input */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={type === 'subclass' ? `Search ${subclassLabel}s...` : `Search options...`}
                  className="w-full pl-9 pr-4 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400"
                />
              </div>

              {/* Detail view (when something is selected) */}
              {selectedSubclass && (
                <div className="border border-gold-400 bg-gold-100/30 rounded-lg p-4 space-y-3">
                  <h4 className="font-display text-lg text-ink-900">{selectedSubclass.name}</h4>
                  <p className="text-sm text-ink-700 whitespace-pre-wrap">
                    {selectedSubclass.description}
                  </p>
                  <Button onClick={confirmSubclass} className="w-full">
                    <Check size={14} className="mr-1" /> Select {selectedSubclass.name}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setSelectedSubclass(null)}
                    className="w-full text-center text-xs text-ink-500 hover:text-ink-700 cursor-pointer"
                  >
                    Back to list
                  </button>
                </div>
              )}

              {selectedFeature && (
                <div className="border border-gold-400 bg-gold-100/30 rounded-lg p-4 space-y-3">
                  <h4 className="font-display text-lg text-ink-900">{selectedFeature.name}</h4>
                  <p className="text-sm text-ink-700 whitespace-pre-wrap">
                    {selectedFeature.description}
                  </p>
                  <Button onClick={confirmFeature} className="w-full">
                    <Check size={14} className="mr-1" /> Select {selectedFeature.name}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setSelectedFeature(null)}
                    className="w-full text-center text-xs text-ink-500 hover:text-ink-700 cursor-pointer"
                  >
                    Back to list
                  </button>
                </div>
              )}

              {/* List view (when nothing is selected) */}
              {!selectedSubclass && !selectedFeature && (
                <div className="max-h-[400px] overflow-y-auto border border-parchment-300 rounded-lg">
                  {type === 'subclass' ? (
                    filteredSubclasses.length === 0 ? (
                      <div className="text-center py-8 text-sm text-ink-500">
                        No matching subclasses found.
                      </div>
                    ) : (
                      filteredSubclasses.map((sub) => (
                        <button
                          key={sub.index}
                          type="button"
                          onClick={() => handleSelectSubclass(sub)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gold-100/50 border-b border-parchment-200 last:border-b-0 transition-colors cursor-pointer"
                        >
                          <span className="font-body text-sm text-ink-900">{sub.name}</span>
                          <span className="text-xs font-display uppercase text-ink-400">
                            {subclassLabel}
                          </span>
                        </button>
                      ))
                    )
                  ) : (
                    filteredOptions.length === 0 ? (
                      <div className="text-center py-8 text-sm text-ink-500">
                        No matching options found.
                      </div>
                    ) : (
                      filteredOptions.map((option) => (
                        <button
                          key={option.index}
                          type="button"
                          onClick={() => handleSelectFeatureOption(option)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gold-100/50 border-b border-parchment-200 last:border-b-0 transition-colors cursor-pointer"
                        >
                          <span className="font-body text-sm text-ink-900">{option.name}</span>
                        </button>
                      ))
                    )
                  )}
                </div>
              )}

              <p className="text-xs text-ink-300 text-center">
                Base 5th Edition options. Switch to Custom Entry for homebrew or expanded content.
              </p>
            </>
          )}
        </div>
      ) : (
        /* ─── Manual Entry Form ─── */
        <div className="space-y-4">
          <Input
            label="Name"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder={type === 'subclass' ? 'e.g. Horizon Walker' : 'e.g. Fighting Style: Blind Fighting'}
          />
          <Textarea
            label="Description"
            rows={4}
            value={manualDescription}
            onChange={(e) => setManualDescription(e.target.value)}
            placeholder="Describe this class choice..."
          />
          <Button onClick={submitManual} className="w-full" disabled={!manualName.trim()}>
            {type === 'subclass' ? 'Set Subclass' : 'Add Feature'}
          </Button>
        </div>
      )}
    </Modal>
  )
}
