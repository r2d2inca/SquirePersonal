import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { speedMap, type NpcDraft } from '@/lib/npcImport'
import type { Npc, NpcInsert, NpcUpdate, NpcAbilityAction } from '@/lib/types/database'

const SIZES = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']
const TYPES = ['Aberration', 'Beast', 'Celestial', 'Construct', 'Dragon', 'Elemental', 'Fey', 'Fiend', 'Giant', 'Humanoid', 'Monstrosity', 'Ooze', 'Plant', 'Undead']
const SAVES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const

function emptyAction(): NpcAbilityAction {
  return { name: '', desc: '' }
}

function formatSpeed(speed: Record<string, string> | undefined): string {
  if (!speed) return '30 ft.'
  return Object.entries(speed)
    .map(([k, v]) => (k === 'walk' ? v : `${k} ${v}`))
    .join(', ')
}

function formatSkills(skills: { name: string; value: number }[] | undefined): string {
  return (skills ?? []).map((s) => `${s.name} ${s.value >= 0 ? '+' : ''}${s.value}`).join(', ')
}

/** "Stealth +7, Perception 4, Athletics -1" → [{name, value}] */
function parseSkills(text: string): { name: string; value: number }[] {
  return text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const m = part.match(/^(.+?)\s*([+-]?\d+)$/)
      if (!m) return { name: part, value: 0 }
      return { name: m[1].trim(), value: parseInt(m[2]) || 0 }
    })
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
  /** Existing NPC to edit; null creates a new one. */
  npc: Npc | null
  /** Pre-fill for a new NPC (import / AI result). Ignored when editing. */
  initialValues?: NpcDraft | null
  userId: string
  campaignId: string | null
  onSubmit: (data: NpcInsert | NpcUpdate) => void
}

export function NpcFormModal({ open, onClose, npc, initialValues, userId, campaignId, onSubmit }: NpcFormModalProps) {
  // Whatever we are starting from: the row being edited, an imported draft, or nothing.
  const base: Partial<NpcDraft> = npc ?? initialValues ?? {}

  const [actions, setActions] = useState<NpcAbilityAction[]>(base.actions ?? [])
  const [specialAbilities, setSpecialAbilities] = useState<NpcAbilityAction[]>(base.special_abilities ?? [])
  const [reactions, setReactions] = useState<NpcAbilityAction[]>(base.reactions ?? [])
  const [legendaryActions, setLegendaryActions] = useState<NpcAbilityAction[]>(base.legendary_actions ?? [])

  const baseSaves: Record<string, number | ''> = {}
  for (const s of SAVES) baseSaves[s] = ''
  for (const s of base.saving_throws ?? []) baseSaves[s.name.toUpperCase().slice(0, 3)] = s.value

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    const saving_throws = SAVES
      .map((s) => ({ name: s, raw: (form.get(`save_${s}`) as string | null) ?? '' }))
      .filter((s) => s.raw.trim() !== '')
      .map((s) => ({ name: s.name, value: parseInt(s.raw) || 0 }))

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
      speed: speedMap(form.get('speed') as string || '30 ft.'),
      strength: parseInt(form.get('strength') as string) || 10,
      dexterity: parseInt(form.get('dexterity') as string) || 10,
      constitution: parseInt(form.get('constitution') as string) || 10,
      intelligence: parseInt(form.get('intelligence') as string) || 10,
      wisdom: parseInt(form.get('wisdom') as string) || 10,
      charisma: parseInt(form.get('charisma') as string) || 10,
      saving_throws,
      skills: parseSkills(form.get('skills') as string || ''),
      damage_vulnerabilities: (form.get('damage_vulnerabilities') as string || '').split(',').map(s => s.trim()).filter(Boolean),
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

  const typeOptions = TYPES.includes(base.type ?? '') || !base.type
    ? TYPES
    : [base.type, ...TYPES] // keep an imported subtype like "Humanoid (Goblinoid)" selectable

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={npc ? 'Edit NPC' : initialValues ? 'Review Imported NPC' : 'New NPC'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {initialValues && !npc && (
          <p className="text-xs text-ink-500 bg-parchment-200 border border-parchment-400 rounded-lg px-3 py-2">
            Check the numbers before saving. Parsing is good but not perfect, and anything you fix here is what gets stored.
          </p>
        )}

        {/* Identity */}
        <div>
          <SectionHeader>Identity</SectionHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2">
              <Input name="name" label="Name" required defaultValue={base.name ?? ''} placeholder="Goblin Chief" />
            </div>
            <Select name="size" label="Size" options={SIZES.map(s => ({ value: s, label: s }))} defaultValue={base.size ?? 'Medium'} />
            <Select name="type" label="Type" options={typeOptions.map(t => ({ value: t, label: t }))} defaultValue={base.type ?? 'Humanoid'} />
          </div>
          <div className="mt-3">
            <Input name="alignment" label="Alignment" defaultValue={base.alignment ?? ''} placeholder="Neutral Evil" />
          </div>
        </div>

        {/* Combat */}
        <div>
          <SectionHeader>Combat</SectionHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input name="armor_class" label="AC" type="number" defaultValue={base.armor_class ?? 10} />
            <Input name="armor_desc" label="AC Type" defaultValue={base.armor_desc ?? ''} placeholder="natural armor" />
            <Input name="hit_points" label="HP" type="number" defaultValue={base.hit_points ?? 10} />
            <Input name="hit_dice" label="Hit Dice" defaultValue={base.hit_dice ?? ''} placeholder="2d8+2" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Input name="speed" label="Speed" defaultValue={formatSpeed(base.speed)} placeholder="30 ft., fly 60 ft." />
            <Input name="challenge_rating" label="CR" type="number" step="0.125" min={0} defaultValue={base.challenge_rating ?? 0} />
          </div>
          <div className="mt-3">
            <Input name="proficiency_bonus" label="Proficiency Bonus" type="number" defaultValue={base.proficiency_bonus ?? 2} />
          </div>
        </div>

        {/* Ability Scores */}
        <div>
          <SectionHeader>Ability Scores</SectionHeader>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <Input name="strength" label="STR" type="number" min={1} max={30} defaultValue={base.strength ?? 10} />
            <Input name="dexterity" label="DEX" type="number" min={1} max={30} defaultValue={base.dexterity ?? 10} />
            <Input name="constitution" label="CON" type="number" min={1} max={30} defaultValue={base.constitution ?? 10} />
            <Input name="intelligence" label="INT" type="number" min={1} max={30} defaultValue={base.intelligence ?? 10} />
            <Input name="wisdom" label="WIS" type="number" min={1} max={30} defaultValue={base.wisdom ?? 10} />
            <Input name="charisma" label="CHA" type="number" min={1} max={30} defaultValue={base.charisma ?? 10} />
          </div>
        </div>

        {/* Saves & Skills */}
        <div>
          <SectionHeader>Saving Throws & Skills</SectionHeader>
          <p className="text-xs text-ink-400 mb-2">Total bonus for proficient saves; leave blank for non-proficient.</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {SAVES.map((s) => (
              <Input key={s} name={`save_${s}`} label={`${s} save`} type="number" defaultValue={baseSaves[s]} placeholder="—" />
            ))}
          </div>
          <div className="mt-3">
            <Input name="skills" label="Skills (comma-separated, with bonus)" defaultValue={formatSkills(base.skills)} placeholder="Stealth +7, Perception +4" />
          </div>
        </div>

        {/* Resistances & Immunities */}
        <div>
          <SectionHeader>Resistances & Immunities</SectionHeader>
          <div className="space-y-3">
            <Input name="damage_vulnerabilities" label="Damage Vulnerabilities (comma-separated)" defaultValue={base.damage_vulnerabilities?.join(', ') ?? ''} placeholder="radiant" />
            <Input name="damage_resistances" label="Damage Resistances (comma-separated)" defaultValue={base.damage_resistances?.join(', ') ?? ''} placeholder="fire, cold" />
            <Input name="damage_immunities" label="Damage Immunities (comma-separated)" defaultValue={base.damage_immunities?.join(', ') ?? ''} placeholder="poison" />
            <Input name="condition_immunities" label="Condition Immunities (comma-separated)" defaultValue={base.condition_immunities?.join(', ') ?? ''} placeholder="poisoned, frightened" />
          </div>
        </div>

        {/* Senses & Languages */}
        <div>
          <SectionHeader>Senses & Languages</SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input name="senses" label="Senses" defaultValue={base.senses ?? ''} placeholder="darkvision 60 ft., passive Perception 14" />
            <Input name="languages" label="Languages" defaultValue={base.languages ?? ''} placeholder="Common, Goblin" />
          </div>
        </div>

        {/* Dynamic Action Lists */}
        <ActionList label="Special Abilities" items={specialAbilities} setItems={setSpecialAbilities} />
        <ActionList label="Actions" items={actions} setItems={setActions} />
        <ActionList label="Reactions" items={reactions} setItems={setReactions} />
        <ActionList label="Legendary Actions" items={legendaryActions} setItems={setLegendaryActions} />

        {legendaryActions.length > 0 && (
          <Textarea name="legendary_desc" label="Legendary Actions Description" rows={2} defaultValue={base.legendary_desc ?? ''} placeholder="The creature can take 3 legendary actions..." />
        )}

        {/* Notes */}
        <Textarea name="notes" label="DM Notes" rows={3} defaultValue={base.notes ?? ''} placeholder="Private notes about this NPC..." />

        <Button type="submit" className="w-full">
          {npc ? 'Update NPC' : 'Create NPC'}
        </Button>
      </form>
    </Modal>
  )
}
