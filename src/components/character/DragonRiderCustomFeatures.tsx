import { useState } from 'react'
import { Sparkles, Sword, Pencil, Check, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { getDragonData } from '@/lib/dragonCompanion'
import type { Character, CharacterUpdate, Feature } from '@/lib/types/database'

interface DragonRiderCustomFeaturesProps {
  character: Character
  onUpdate: (updates: CharacterUpdate) => void
}

interface GiftSlot {
  featureKey: string
  label: string
  tier: string
  minLevel: number
}

const PATRON_GIFTS: GiftSlot[] = [
  { featureKey: "Patron's Gift (1st)", label: '1st Gift', tier: 'Anchored to Dragonstrike / Extra Attack', minLevel: 5 },
  { featureKey: "Patron's Gift (2nd)", label: '2nd Gift', tier: 'Anchored to Wing Shield / Indomitable Bond', minLevel: 10 },
  { featureKey: "Patron's Gift (3rd)", label: '3rd Gift', tier: 'Anchored to Soulstrike / Ascendant Synergy', minLevel: 15 },
  { featureKey: "Patron's Gift (4th — Capstone)", label: '4th Gift (Capstone)', tier: 'Anchored to Draconic Ascendance', minLevel: 20 },
]

const SIGNATURE_TIERS: GiftSlot[] = [
  { featureKey: 'Signature Weapon — 1st Tier', label: '1st Tier (Awakens)', tier: 'Uncommon rarity', minLevel: 5 },
  { featureKey: 'Signature Weapon — 2nd Tier', label: '2nd Tier (Deepens)', tier: 'Rare rarity', minLevel: 11 },
  { featureKey: 'Signature Weapon — 3rd Tier', label: '3rd Tier (Ascends)', tier: 'Very Rare rarity', minLevel: 17 },
]

function EditableSlot({
  slot,
  character,
  onUpdate,
  icon,
  source,
}: {
  slot: GiftSlot
  character: Character
  onUpdate: (updates: CharacterUpdate) => void
  icon: React.ReactNode
  source: string
}) {
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftDesc, setDraftDesc] = useState('')

  const feature = character.features.find(f => f.name === slot.featureKey)
  const isUnlocked = character.level >= slot.minLevel
  const hasContent = feature && feature.description && feature.description !== ''

  function startEdit() {
    setDraftName(feature?.name === slot.featureKey ? '' : (feature?.name ?? ''))
    setDraftDesc(feature?.description ?? '')
    setEditing(true)
  }

  function save() {
    const customName = draftName.trim()
    const exists = character.features.some(f => f.name === slot.featureKey || (feature && f.name === feature.name))

    const updatedFeatures = exists
      ? character.features.map(f => {
          if (f.name === slot.featureKey || (feature && f.name === feature.name)) {
            return {
              ...f,
              name: customName || slot.featureKey,
              description: draftDesc.trim(),
              source,
            }
          }
          return f
        })
      : [
          ...character.features,
          {
            name: customName || slot.featureKey,
            description: draftDesc.trim(),
            source,
          },
        ]

    onUpdate({ features: updatedFeatures })
    setEditing(false)
  }

  if (!isUnlocked) {
    return (
      <div className="border border-parchment-300 rounded-lg p-3 opacity-40">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <div className="font-body font-semibold text-ink-700 text-sm">{slot.label}</div>
            <div className="text-[10px] text-ink-400">Unlocks at level {slot.minLevel}</div>
          </div>
        </div>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="border border-gold-400 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="font-body font-semibold text-ink-700 text-sm">{slot.label}</span>
          <span className="text-[10px] text-ink-400">({slot.tier})</span>
        </div>
        <input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          className="w-full px-2 py-1.5 bg-parchment-50 border border-parchment-400 rounded text-sm font-body text-ink-900 focus:outline-none focus:ring-1 focus:ring-gold-400"
          placeholder="Name (e.g. Stormtouched Aim, Dawnbreaker Lance...)"
        />
        <textarea
          value={draftDesc}
          onChange={(e) => setDraftDesc(e.target.value)}
          rows={3}
          className="w-full px-2 py-1.5 bg-parchment-50 border border-parchment-400 rounded text-sm font-body text-ink-900 focus:outline-none focus:ring-1 focus:ring-gold-400"
          placeholder="Describe the mechanics (trigger, effect, frequency, limitations...)"
        />
        <div className="flex gap-1 justify-end">
          <button onClick={save} className="p-1 text-heal hover:text-heal/80 cursor-pointer"><Check size={14} /></button>
          <button onClick={() => setEditing(false)} className="p-1 text-danger hover:text-danger/80 cursor-pointer"><X size={14} /></button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-parchment-300 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <div className="font-body font-semibold text-ink-900 text-sm">
              {hasContent && feature.name !== slot.featureKey ? feature.name : slot.label}
            </div>
            <div className="text-[10px] text-ink-400">{slot.tier}</div>
          </div>
        </div>
        <button
          onClick={startEdit}
          className="text-ink-300 hover:text-gold-500 transition-colors cursor-pointer"
        >
          <Pencil size={12} />
        </button>
      </div>
      {hasContent ? (
        <p className="text-sm text-ink-700 mt-2 whitespace-pre-wrap">{feature.description}</p>
      ) : (
        <p className="text-sm text-ink-300 italic mt-2">Tap edit to describe this ability (designed with your DM)</p>
      )}
    </div>
  )
}

export function DragonRiderCustomFeatures({ character, onUpdate }: DragonRiderCustomFeaturesProps) {
  if (!character.class.toLowerCase().includes('dragon-rider')) return null

  const dragonData = getDragonData(character.appearance)

  return (
    <>
      {/* Signature Weapon */}
      <Card>
        <SectionHeader>Signature Weapon</SectionHeader>
        <p className="text-xs text-ink-400 mb-3">
          Your Signature Weapon grows with you. Each tier's property is designed by you and your DM.
        </p>
        <div className="space-y-2">
          {SIGNATURE_TIERS.map(slot => (
            <EditableSlot
              key={slot.featureKey}
              slot={slot}
              character={character}
              onUpdate={onUpdate}
              icon={<Sword size={14} className="text-ink-500" />}
              source="Signature Weapon"
            />
          ))}
        </div>
      </Card>

      {/* Patron's Gifts */}
      <Card>
        <SectionHeader>Patron's Gifts</SectionHeader>
        <p className="text-xs text-ink-400 mb-3">
          Unique abilities reflecting your character's story, bond, or destiny — designed with your DM.
          {dragonData && ` Your dragon's element: ${dragonData.dragonElement}.`}
        </p>
        <div className="space-y-2">
          {PATRON_GIFTS.map(slot => (
            <EditableSlot
              key={slot.featureKey}
              slot={slot}
              character={character}
              onUpdate={onUpdate}
              icon={<Sparkles size={14} className="text-gold-500" />}
              source="Patron's Gift"
            />
          ))}
        </div>
      </Card>
    </>
  )
}
