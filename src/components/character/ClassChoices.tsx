import { useState } from 'react'
import { Plus, Shield, Sparkles, ChevronDown, ChevronUp, ChevronRight, Trash2 } from 'lucide-react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ClassChoicesForm } from './ClassChoicesForm'
import { getSubclassLabel, getSubclassLevel, getAvailableFeatureChoices, type FeatureChoiceMeta } from '@/lib/classChoices'
import { getClassChoiceData } from '@/lib/phbData'
import type { Character, CharacterUpdate, Feature } from '@/lib/types/database'

interface ClassChoicesProps {
  character: Character
  onUpdate: (updates: CharacterUpdate) => void
  onSubclassChange?: (classIndex: string, subclassIndex: string) => void
  onSubclassRemove?: () => void
}

export function ClassChoices({ character, onUpdate, onSubclassChange, onSubclassRemove }: ClassChoicesProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [showMenu, setShowMenu] = useState(false)

  // Form modal state
  const [formOpen, setFormOpen] = useState(false)
  const [formType, setFormType] = useState<'subclass' | 'feature'>('subclass')
  const [formFeatureIndex, setFormFeatureIndex] = useState<string | undefined>()
  const [formFeatureLabel, setFormFeatureLabel] = useState<string | undefined>()

  const classIndex = character.class.toLowerCase()
  const subclassLabel = getSubclassLabel(classIndex)
  const subclassLevel = getSubclassLevel(classIndex)
  const canPickSubclass = character.level >= subclassLevel
  const availableChoices = getAvailableFeatureChoices(classIndex, character.level)

  // Filter features that are class choices
  const classChoiceFeatures = character.features.filter(
    (f) => f.source.endsWith('Choice') || f.source === 'Subclass'
  )

  function openSubclassForm() {
    setFormType('subclass')
    setFormFeatureIndex(undefined)
    setFormFeatureLabel(undefined)
    setFormOpen(true)
    setShowMenu(false)
  }

  function openFeatureForm(choice: FeatureChoiceMeta) {
    setFormType('feature')
    setFormFeatureIndex(choice.featureIndex)
    setFormFeatureLabel(choice.label)
    setFormOpen(true)
    setShowMenu(false)
  }

  function openCustomForm() {
    setFormType('feature')
    setFormFeatureIndex(undefined)
    setFormFeatureLabel('Add Custom Class Choice')
    setFormOpen(true)
    setShowMenu(false)
  }

  function handleSelectSubclass(name: string, description: string) {
    const updates: CharacterUpdate = { subclass: name }
    // Add subclass description as a feature
    const existingWithoutSubclass = character.features.filter((f) => f.source !== 'Subclass')
    updates.features = [
      ...existingWithoutSubclass,
      { name: `${subclassLabel}: ${name}`, description, source: 'Subclass' },
    ]
    onUpdate(updates)

    // Look up the subclass index from phbData and trigger spell auto-add
    if (onSubclassChange) {
      const classData = getClassChoiceData(classIndex)
      const subclass = classData?.subclasses.find((s) => s.name === name)
      if (subclass) {
        onSubclassChange(classIndex, subclass.index)
      }
    }
  }

  function handleAddFeature(feature: Feature) {
    onUpdate({ features: [...character.features, feature] })
  }

  function handleRemoveChoice(index: number) {
    // Find the actual index in the full features array
    const choiceFeature = classChoiceFeatures[index]
    const fullIndex = character.features.findIndex(
      (f) => f.name === choiceFeature.name && f.source === choiceFeature.source
    )
    if (fullIndex === -1) return

    const updated = [...character.features]
    updated.splice(fullIndex, 1)

    const updates: CharacterUpdate = { features: updated }
    // If removing the subclass feature, also clear the subclass field
    if (choiceFeature.source === 'Subclass') {
      updates.subclass = null
      onSubclassRemove?.()
    }
    onUpdate(updates)
  }

  function toggleExpand(index: number) {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <SectionHeader>Subclass</SectionHeader>
        <div className="relative">
          <Button size="sm" variant="ghost" onClick={() => setShowMenu(!showMenu)}>
            <Plus size={14} className="mr-1" /> Add
          </Button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 w-56 bg-parchment-100 border border-parchment-400 rounded-lg shadow-lg py-1">
                {canPickSubclass && (
                  <button
                    type="button"
                    onClick={openSubclassForm}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gold-100/50 transition-colors cursor-pointer"
                  >
                    <Shield size={14} className="inline mr-2 text-gold-500" />
                    {character.subclass ? `Change ${subclassLabel}` : `Select ${subclassLabel}`}
                  </button>
                )}
                {availableChoices.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => openFeatureForm(choice)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gold-100/50 transition-colors cursor-pointer"
                  >
                    <Sparkles size={14} className="inline mr-2 text-arcane-500" />
                    Add {choice.label}
                  </button>
                ))}
                <div className="border-t border-parchment-300 my-1" />
                <button
                  type="button"
                  onClick={openCustomForm}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gold-100/50 transition-colors cursor-pointer"
                >
                  <Plus size={14} className="inline mr-2 text-ink-400" />
                  Add Custom Choice
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Subclass display with expandable description */}
      {character.subclass && (() => {
        const subclassFeature = character.features.find(f => f.source === 'Subclass')
        return (
          <div className="mb-3 border border-gold-300/50 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedIndex(expandedIndex === -1 ? null : -1)}
              className="w-full flex items-center gap-2 p-3 bg-gold-100/30 hover:bg-gold-100/50 transition-colors cursor-pointer"
            >
              <Shield size={16} className="text-gold-500" />
              <span className="font-display text-sm uppercase text-ink-500">{subclassLabel}</span>
              <Badge variant="gold">{character.subclass}</Badge>
              <span className="ml-auto">
                {expandedIndex === -1 ? <ChevronDown size={14} className="text-ink-400" /> : <ChevronRight size={14} className="text-ink-400" />}
              </span>
            </button>
            {expandedIndex === -1 && subclassFeature && (
              <div className="px-3 pb-3 border-t border-gold-200">
                <p className="text-sm text-ink-700 whitespace-pre-wrap mt-2">{subclassFeature.description}</p>
              </div>
            )}
          </div>
        )
      })()}

      {!character.subclass && canPickSubclass && (
        <button
          type="button"
          onClick={openSubclassForm}
          className="w-full mb-3 p-3 border-2 border-dashed border-parchment-400 rounded-lg text-center text-sm text-ink-500 hover:border-gold-400 hover:text-gold-600 transition-colors cursor-pointer"
        >
          <Shield size={16} className="inline mr-2" />
          Select your {subclassLabel}
        </button>
      )}

      {/* Class choice features */}
      {classChoiceFeatures.length > 0 ? (
        <div className="space-y-2">
          {classChoiceFeatures.map((feature, i) => {
            // Skip the subclass feature since we display it above
            if (feature.source === 'Subclass') return null
            const isExpanded = expandedIndex === i

            return (
              <div
                key={`${feature.name}-${i}`}
                className="border border-parchment-300 rounded-lg overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(i)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-parchment-200/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-arcane-500" />
                    <span className="font-body text-sm text-ink-900">{feature.name}</span>
                    <Badge variant="default">{feature.source}</Badge>
                  </div>
                  {isExpanded ? <ChevronUp size={14} className="text-ink-400" /> : <ChevronDown size={14} className="text-ink-400" />}
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-parchment-200">
                    <p className="text-sm text-ink-700 whitespace-pre-wrap mt-2">{feature.description}</p>
                    <button
                      type="button"
                      onClick={() => handleRemoveChoice(i)}
                      className="flex items-center gap-1 text-xs text-danger mt-3 hover:text-danger/80 cursor-pointer"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        !character.subclass && !canPickSubclass && (
          <p className="text-sm text-ink-500 text-center py-2">
            Class choices will appear as you level up.
          </p>
        )
      )}

      {/* No non-subclass choices yet */}
      {classChoiceFeatures.filter((f) => f.source !== 'Subclass').length === 0 && (character.subclass || canPickSubclass) && (
        <p className="text-xs text-ink-400 text-center mt-2">
          Use the + Add button to log fighting styles, invocations, and other class choices.
        </p>
      )}

      {/* Form Modal */}
      <ClassChoicesForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        characterClass={character.class}
        type={formType}
        featureIndex={formFeatureIndex}
        featureLabel={formFeatureLabel}
        onSelectSubclass={handleSelectSubclass}
        onAddFeature={handleAddFeature}
      />
    </div>
  )
}
