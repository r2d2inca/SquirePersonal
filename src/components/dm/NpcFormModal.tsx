import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/SectionHeader'
import type { Npc, NpcInsert, NpcUpdate, NpcAbilityAction } from '@/lib/types/database'

const SIZES = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']
const TYPES = ['Aberration', 'Beast', 'Celestial', 'Construct', 'Dragon', 'Elemental', 'Fey', 'Fiend', 'Giant', 'Humanoid', 'Monstrosity', 'Ooze', 'Plant', 'Undead']

function emptyAction(): NpcAbilityAction {
  return { name: '', desc: '' }
}

// Extracted outside NpcFormModal to maintain stable identity across renders
function ActionList({
  label,
  items,
  setItems,
}: {
  label: string
  items: NpcAbilityAction[]
  setItems: (items: NpcAbilityAction[]) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-display uppercase tracking-wider text-ink-500">{label}</label>
        <button
          type="button"
          onClick={() => setItems([...items, emptyAction()])}
          className="text-xs text-gold-600 hover:text-gold-700 cursor-pointer flex items-center gap-1"
        >
          <Plus size={12} /> Add
        </button>
      </div>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2">
            <div className="flex-1 space-y-2">
              <input
                value={item.name}
                onChange={(e) => {
                  const updated = [...items]
                  updated[idx] = { ...item, name: e.target.value }
                  setItems(updated)
                }}
                placeholder="Name"
                className="w-full px-3 py-1.5 bg-parchment-50 border border-parchment-400 rounded font-body text-sm focus:outline-none focus:border-gold-400"
              />
              <textarea
                value={item.desc}
                onChange={(e) => {
                  const updated = [...items]
                  updated[idx] = { ...item, desc: e.target.value }
                  setItems(updated)
                }}
                placeholder="Description"
                rows={2}
                className="w-full px-3 py-1.5 bg-parchment-50 border border-parchment-400 rounded font-body text-sm focus:outline-none focus:border-gold-400 resize-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setItems(items.filter((_, i) => i !== idx))}
              className="p-1 text-ink-300 hover:text-danger cursor-pointer self-start mt-1"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

interface NpcFormModalProps {
  open: boolean
  onClose: () => void
  npc: Npc | null
  userId: string
  campaignId: string | null
  onSubmit: (data: NpcInsert | NpcUpdate) => void
}

export function NpcFormModal({ open, onClose, npc, userId, campaignId, onSubmit }: NpcFormModalProps) {
  const [actions, setActions] = useState<NpcAbilityAction[]>(npc?.actions ?? [])
  const [specialAbilities, setSpecialAbilities] = useState<NpcAbilityAction[]>(npc?.special_abilities ?? [])
  const [reactions, setReactions] = useState<NpcAbilityAction[]>(npc?.reactions ?? [])
  const [legendaryActions, setLegendaryActions] = useState<NpcAbilityAction[]>(npc?.legendary_actions ?? [])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    const data: NpcInsert = {
      user_id: userId,
      campaign_id: campaignId,
      name: form.get('name') as string,
      size: form.get('size') as string || 'Medium',
      type: form.get('type') as string || 'Humanoid',
      alignment: form.get('alignment') as string || '',
      armor_class: parseInt(form.get('armor_class') as string) || 10,
      armor_desc: form.get('armor_desc') as string || '',
      hit_points: parseInt(form.get('hit_points') as string) || 10,
      hit_dice: form.get('hit_dice') as string || '',
      speed: { walk: form.get('speed') as string || '30 ft.' },
      strength: parseInt(form.get('strength') as string) || 10,
      dexterity: parseInt(form.get('dexterity') as string) || 10,
      constitution: parseInt(form.get('constitution') as string) || 10,
      intelligence: parseInt(form.get('intelligence') as string) || 10,
      wisdom: parseInt(form.get('wisdom') as string) || 10,
      charisma: parseInt(form.get('charisma') as string) || 10,
      saving_throws: [],
      skills: [],
      damage_vulnerabilities: [],
      damage_resistances: (form.get('damage_resistances') as string || '').split(',').map(s => s.trim()).filter(Boolean),
      damage_immunities: (form.get('damage_immunities') as string || '').split(',').map(s => s.trim()).filter(Boolean),
      condition_immunities: (form.get('condition_immunities') as string || '').split(',').map(s => s.trim()).filter(Boolean),
      senses: form.get('senses') as string || '',
      languages: form.get('languages') as string || '',
      challenge_rating: parseFloat(form.get('challenge_rating') as string) || 0,
      proficiency_bonus: parseInt(form.get('proficiency_bonus') as string) || 2,
      special_abilities: specialAbilities.filter(a => a.name),
      actions: actions.filter(a => a.name),
      reactions: reactions.filter(a => a.name),
      legendary_actions: legendaryActions.filter(a => a.name),
      legendary_desc: form.get('legendary_desc') as string || '',
      source: npc?.source ?? 'custom',
      srd_index: npc?.srd_index ?? null,
      notes: form.get('notes') as string || '',
    }

    onSubmit(npc ? (data as NpcUpdate) : data)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={npc ? 'Edit NPC' : 'New NPC'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Identity */}
        <div>
          <SectionHeader>Identity</SectionHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2">
              <Input name="name" label="Name" required defaultValue={npc?.name ?? ''} placeholder="Goblin Chief" />
            </div>
            <Select name="size" label="Size" options={SIZES.map(s => ({ value: s, label: s }))} defaultValue={npc?.size ?? 'Medium'} />
            <Select name="type" label="Type" options={TYPES.map(t => ({ value: t, label: t }))} defaultValue={npc?.type ?? 'Humanoid'} />
          </div>
          <div className="mt-3">
            <Input name="alignment" label="Alignment" defaultValue={npc?.alignment ?? ''} placeholder="Neutral Evil" />
          </div>
        </div>

        {/* Combat */}
        <div>
          <SectionHeader>Combat</SectionHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input name="armor_class" label="AC" type="number" defaultValue={npc?.armor_class ?? 10} />
            <Input name="armor_desc" label="AC Type" defaultValue={npc?.armor_desc ?? ''} placeholder="natural armor" />
            <Input name="hit_points" label="HP" type="number" defaultValue={npc?.hit_points ?? 10} />
            <Input name="hit_dice" label="Hit Dice" defaultValue={npc?.hit_dice ?? ''} placeholder="2d8+2" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Input name="speed" label="Speed" defaultValue={npc?.speed?.walk ?? '30 ft.'} placeholder="30 ft." />
            <Input name="challenge_rating" label="CR" type="number" step="0.125" min={0} defaultValue={npc?.challenge_rating ?? 0} />
          </div>
          <div className="mt-3">
            <Input name="proficiency_bonus" label="Proficiency Bonus" type="number" defaultValue={npc?.proficiency_bonus ?? 2} />
          </div>
        </div>

        {/* Ability Scores */}
        <div>
          <SectionHeader>Ability Scores</SectionHeader>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <Input name="strength" label="STR" type="number" min={1} max={30} defaultValue={npc?.strength ?? 10} />
            <Input name="dexterity" label="DEX" type="number" min={1} max={30} defaultValue={npc?.dexterity ?? 10} />
            <Input name="constitution" label="CON" type="number" min={1} max={30} defaultValue={npc?.constitution ?? 10} />
            <Input name="intelligence" label="INT" type="number" min={1} max={30} defaultValue={npc?.intelligence ?? 10} />
            <Input name="wisdom" label="WIS" type="number" min={1} max={30} defaultValue={npc?.wisdom ?? 10} />
            <Input name="charisma" label="CHA" type="number" min={1} max={30} defaultValue={npc?.charisma ?? 10} />
          </div>
        </div>

        {/* Resistances & Immunities */}
        <div>
          <SectionHeader>Resistances & Immunities</SectionHeader>
          <div className="space-y-3">
            <Input name="damage_resistances" label="Damage Resistances (comma-separated)" defaultValue={npc?.damage_resistances?.join(', ') ?? ''} placeholder="fire, cold" />
            <Input name="damage_immunities" label="Damage Immunities (comma-separated)" defaultValue={npc?.damage_immunities?.join(', ') ?? ''} placeholder="poison" />
            <Input name="condition_immunities" label="Condition Immunities (comma-separated)" defaultValue={npc?.condition_immunities?.join(', ') ?? ''} placeholder="poisoned, frightened" />
          </div>
        </div>

        {/* Senses & Languages */}
        <div>
          <SectionHeader>Senses & Languages</SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input name="senses" label="Senses" defaultValue={npc?.senses ?? ''} placeholder="darkvision 60 ft., passive Perception 14" />
            <Input name="languages" label="Languages" defaultValue={npc?.languages ?? ''} placeholder="Common, Goblin" />
          </div>
        </div>

        {/* Dynamic Action Lists */}
        <ActionList label="Special Abilities" items={specialAbilities} setItems={setSpecialAbilities} />
        <ActionList label="Actions" items={actions} setItems={setActions} />
        <ActionList label="Reactions" items={reactions} setItems={setReactions} />
        <ActionList label="Legendary Actions" items={legendaryActions} setItems={setLegendaryActions} />

        {legendaryActions.length > 0 && (
          <Textarea name="legendary_desc" label="Legendary Actions Description" rows={2} defaultValue={npc?.legendary_desc ?? ''} placeholder="The creature can take 3 legendary actions..." />
        )}

        {/* Notes */}
        <Textarea name="notes" label="DM Notes" rows={3} defaultValue={npc?.notes ?? ''} placeholder="Private notes about this NPC..." />

        <Button type="submit" className="w-full">
          {npc ? 'Update NPC' : 'Create NPC'}
        </Button>
      </form>
    </Modal>
  )
}
