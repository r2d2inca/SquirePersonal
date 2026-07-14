import { useState, useEffect, useRef, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ITEM_CATEGORIES } from '@/lib/constants'
import { Search, BookOpen, Loader2 } from 'lucide-react'
import {
  getAllMagicItems,
  getMagicItemDetail,
  mapMagicItemCategory,
  type SRDMagicItemSummary,
} from '@/lib/dnd5e'
import {
  getAllLocalEquipment,
  getWeapon,
  getArmor,
  formatWeaponProperties,
  type LocalEquipmentItem,
} from '@/lib/weaponData2024'

const CATEGORY_LABELS: Record<string, string> = {
  weapon: 'Weapons',
  armor: 'Armor & Shields',
  gear: 'Gear',
  consumable: 'Consumables',
  treasure: 'Treasure',
  magic_item: 'Magic Items',
}

const BROWSE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'weapon', label: 'Weapons' },
  { key: 'armor', label: 'Armor' },
  { key: 'gear', label: 'Gear' },
  { key: 'magic', label: 'Magic Items' },
] as const

type BrowseFilter = (typeof BROWSE_FILTERS)[number]['key']

/** Detect a flat AC bonus from a magic item description, e.g. Cloak of Protection
 *  ("+1 bonus to AC and saving throws"), Bracers of Defense ("+2 bonus to Armor Class"). */
function detectAcBonus(desc: string): string {
  const m = desc.match(/\+(\d+)\s+bonus to (?:your )?(?:Armor Class|AC)\b/i)
  return m ? m[1] : ''
}

/** Detect a magic-armor enhancement from a leading "+N" in the item name, e.g. "+2 Half Plate".
 *  Returned as a flat AC bonus so the enhancement stacks on top of the base armor AC (the base
 *  still comes from the armor table / armor_bonus at calc time). */
function detectArmorEnhancement(name: string): string {
  const m = name.trim().match(/^\+(\d+)\b/)
  return m ? m[1] : ''
}

/** How the item is used (action economy). Stored as a leading line in the description
 *  so it shows on the sheet AND is visible to the AI assistant (no separate DB column). */
const ACTIVATION_OPTIONS = [
  { value: '', label: '— None / unspecified' },
  { value: 'action', label: 'Action' },
  { value: 'bonus_action', label: 'Bonus Action' },
  { value: 'reaction', label: 'Reaction' },
  { value: 'passive', label: 'Passive' },
]

const ACTIVATION_LABELS: Record<string, string> = {
  action: 'Action',
  bonus_action: 'Bonus Action',
  reaction: 'Reaction',
  passive: 'Passive',
}

const ACTIVATION_LINE = /^Activation:[ \t]*(.+?)[ \t]*(?:\n+|$)/

/** Remove a leading "**Activation:** X" line from a description, returning the rest. */
function stripActivation(desc: string): string {
  return desc.replace(ACTIVATION_LINE, '')
}

/** Read the activation key back out of a description's leading line, if present. */
function detectActivation(desc: string): string {
  const m = desc.match(ACTIVATION_LINE)
  if (!m) return ''
  const label = m[1].trim().toLowerCase()
  const entry = Object.entries(ACTIVATION_LABELS).find(([, l]) => l.toLowerCase() === label)
  return entry ? entry[0] : ''
}

/** Prepend the activation as a clean leading line (idempotent — strips any prior one first). */
function applyActivation(desc: string, activation: string): string {
  const body = stripActivation(desc)
  if (!activation) return body
  const label = ACTIVATION_LABELS[activation] ?? activation
  return body ? `Activation: ${label}\n\n${body}` : `Activation: ${label}`
}

interface FormData {
  name: string
  category: string
  quantity: number
  weight: number
  damage: string
  weapon_properties: string
  armor_bonus: string
  ac_ability_score: string
  max_ability_modifier: string
  ac_bonus: string
  charges_max: string
  charges_remaining: string
  recharge_type: string
  description: string
}

interface InventoryFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: FormData) => void
  initialData?: Partial<FormData>
  title?: string
}

export function InventoryForm({ open, onClose, onSubmit, initialData, title }: InventoryFormProps) {
  const [mode, setMode] = useState<'search' | 'manual'>('search')
  const [magicItemList, setMagicItemList] = useState<SRDMagicItemSummary[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingMagic, setLoadingMagic] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [browseFilter, setBrowseFilter] = useState<BrowseFilter>('all')
  const [activation, setActivation] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Local equipment data (instant, no API call)
  const localEquipment = useMemo(() => getAllLocalEquipment(), [])

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      name: '',
      category: 'gear',
      quantity: 1,
      weight: 0,
      damage: '',
      weapon_properties: '',
      armor_bonus: '',
      ac_ability_score: '',
      max_ability_modifier: '',
      ac_bonus: '',
      charges_max: '',
      charges_remaining: '',
      recharge_type: '',
      description: '',
      ...initialData,
    },
  })

  // Load magic items from Open5e (only when needed)
  useEffect(() => {
    if (!open) return
    if (magicItemList.length > 0) return // already loaded
    setLoadingMagic(true)
    getAllMagicItems()
      .then(setMagicItemList)
      .catch(console.error)
      .finally(() => setLoadingMagic(false))
  }, [open, magicItemList.length])

  // Focus search input
  useEffect(() => {
    if (open && mode === 'search') {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [open, mode])

  // Reset form when modal closes, or populate when editing
  useEffect(() => {
    if (!open) {
      setSearchQuery('')
      setBrowseFilter('all')
      setMode('search')
      setActivation('')
      reset()
    } else if (initialData) {
      const initDesc = initialData.description ?? ''
      reset({ name: '', category: 'gear', quantity: 1, weight: 0, damage: '', weapon_properties: '', armor_bonus: '', ac_ability_score: '', max_ability_modifier: '', ac_bonus: '', charges_max: '', charges_remaining: '', recharge_type: '', ...initialData, description: stripActivation(initDesc) })
      setActivation(detectActivation(initDesc))
      setMode('manual')
    }
  }, [open, reset, initialData])

  // Combined + filtered list
  const filteredItems = useMemo(() => {
    let items: { name: string; type: 'weapon' | 'armor' | 'gear' | 'magic'; description: string }[] = []

    if (browseFilter === 'magic') {
      items = magicItemList.map(m => ({ name: m.name, type: 'magic' as const, description: '' }))
    } else if (browseFilter === 'weapon') {
      items = localEquipment.filter(e => e.type === 'weapon').map(e => ({ name: e.name, type: 'weapon' as const, description: e.description }))
    } else if (browseFilter === 'armor') {
      items = localEquipment.filter(e => e.type === 'armor').map(e => ({ name: e.name, type: 'armor' as const, description: e.description }))
    } else if (browseFilter === 'gear') {
      items = localEquipment.filter(e => e.type === 'gear').map(e => ({ name: e.name, type: 'gear' as const, description: e.description }))
    } else {
      // 'all'
      items = [
        ...localEquipment.map(e => ({ name: e.name, type: e.type, description: e.description })),
        ...magicItemList.map(m => ({ name: m.name, type: 'magic' as const, description: '' })),
      ]
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      items = items.filter(i => i.name.toLowerCase().includes(q))
    }

    return items
  }, [browseFilter, localEquipment, magicItemList, searchQuery])

  function selectLocalItem(item: { name: string; type: 'weapon' | 'armor' | 'gear' }) {
    const weapon = getWeapon(item.name)
    if (weapon) {
      setValue('name', weapon.name)
      setValue('category', 'weapon')
      setValue('weight', weapon.weight)
      setValue('damage', `${weapon.damage} ${weapon.damageType}`)
      setValue('weapon_properties', formatWeaponProperties(weapon))
      setValue('armor_bonus', '')
      setValue('ac_bonus', '')
      setValue('description', `${weapon.category} weapon. Cost: ${weapon.cost}`)
      setMode('manual')
      return
    }

    const armor = getArmor(item.name)
    if (armor) {
      let desc = `${armor.category} armor. Cost: ${armor.cost}`
      if (armor.strMinimum) desc += `. Requires STR ${armor.strMinimum}`
      if (armor.stealthDisadvantage) desc += '. Stealth Disadvantage'
      setValue('name', armor.name)
      setValue('category', 'armor')
      setValue('weight', armor.weight)
      setValue('damage', '')
      setValue('weapon_properties', '')
      setValue('armor_bonus', String(armor.ac))
      setValue('ac_bonus', '')
      setValue('description', desc)
      setMode('manual')
      return
    }

    // Gear item
    const local = localEquipment.find(e => e.name === item.name)
    if (local) {
      setValue('name', local.name)
      setValue('category', 'gear')
      setValue('weight', local.weight)
      setValue('damage', '')
      setValue('weapon_properties', '')
      setValue('armor_bonus', '')
      setValue('ac_bonus', '')
      setValue('description', local.description || `Cost: ${local.cost}`)
      setMode('manual')
    }
  }

  async function selectMagicItem(name: string) {
    setLoadingDetail(true)
    try {
      const item = magicItemList.find(m => m.name === name)
      if (!item) return
      const detail = await getMagicItemDetail(item.index)
      const category = mapMagicItemCategory(detail)
      const fullDesc = detail.desc.join('\n\n')
      setValue('name', detail.name)
      setValue('category', category)
      setValue('weight', 0)
      setValue('damage', '')
      setValue('weapon_properties', '')
      setValue('armor_bonus', '')
      // Auto-fill flat AC bonus from the description — Cloak/Ring of Protection, Bracers of
      // Defense, and also magically enhanced armor ("+2 bonus to AC while wearing this armor"),
      // whose enhancement stacks on top of the base armor AC.
      setValue('ac_bonus', detectAcBonus(fullDesc))
      setValue('description', fullDesc)
      setMode('manual')
    } catch (err) {
      console.error('Failed to load magic item details:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  function selectItem(item: { name: string; type: 'weapon' | 'armor' | 'gear' | 'magic' }) {
    setActivation('')
    if (item.type === 'magic') {
      selectMagicItem(item.name)
    } else {
      selectLocalItem({ name: item.name, type: item.type as 'weapon' | 'armor' | 'gear' })
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title || 'Add Item'} size="lg">
      {/* Mode toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode('search')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-display uppercase cursor-pointer transition-colors ${
            mode === 'search' ? 'bg-gold-400 text-ink-900' : 'bg-parchment-200 text-ink-500'
          }`}
        >
          <BookOpen size={14} /> Browse Equipment
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-display uppercase cursor-pointer transition-colors ${
            mode === 'manual' ? 'bg-gold-400 text-ink-900' : 'bg-parchment-200 text-ink-500'
          }`}
        >
          Custom Item
        </button>
      </div>

      {mode === 'search' ? (
        /* ─── Equipment Search ─── */
        <div className="space-y-3">
          {/* Search input */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search equipment..."
              className="w-full pl-9 pr-4 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400"
            />
          </div>

          {/* Category filter chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {BROWSE_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setBrowseFilter(browseFilter === f.key ? 'all' : f.key)}
                className={`px-2.5 py-1 rounded text-xs font-display uppercase cursor-pointer transition-colors ${
                  browseFilter === f.key ? 'bg-gold-400 text-ink-900' : 'bg-parchment-200 text-ink-500'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Item list */}
          <div className="max-h-[400px] overflow-y-auto border border-parchment-300 rounded-lg">
            {browseFilter === 'magic' && loadingMagic ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-gold-400" />
                <span className="ml-2 text-sm text-ink-500">Loading magic items...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-sm text-ink-500">
                No items found. Try a different search or filter.
              </div>
            ) : (
              filteredItems.map((item) => (
                <button
                  key={`${item.type}-${item.name}`}
                  type="button"
                  onClick={() => selectItem(item)}
                  disabled={loadingDetail}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gold-100/50 border-b border-parchment-200 last:border-b-0 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-body text-sm text-ink-900">{item.name}</span>
                    {item.description && (
                      <span className="block text-xs text-ink-400 truncate">{item.description}</span>
                    )}
                  </div>
                  <span className="text-xs font-display uppercase text-ink-400 ml-2 shrink-0">
                    {item.type === 'magic' ? 'Magic' : item.type}
                  </span>
                </button>
              ))
            )}
          </div>

          {loadingDetail && (
            <div className="flex items-center gap-2 text-sm text-arcane-500">
              <Loader2 size={14} className="animate-spin" />
              Loading item details...
            </div>
          )}

          <p className="text-xs text-ink-300 text-center">
            2024 PHB equipment data. Magic items from the SRD. Select an item to auto-fill details, or switch to Custom Item.
          </p>
        </div>
      ) : (
        /* ─── Manual/Edit Form ─── */
        <form onSubmit={handleSubmit((data) => {
          // A magic armor named like "+2 Half Plate" keeps its base AC from the table and
          // gets the +N as a stacking AC bonus, so the enhancement isn't silently lost.
          const withEnhancement = data.category === 'armor' && !data.ac_bonus && detectArmorEnhancement(data.name)
            ? { ...data, ac_bonus: detectArmorEnhancement(data.name) }
            : data
          onSubmit({ ...withEnhancement, description: applyActivation(withEnhancement.description, activation) })
        })} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name" {...register('name', { required: true })} />
            <Select
              label="Category"
              options={ITEM_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] || c }))}
              {...register('category')}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Quantity" type="number" min={1} {...register('quantity', { valueAsNumber: true })} />
            <Input label="Weight (lbs)" type="number" min={0} step={0.1} {...register('weight', { valueAsNumber: true })} />
            <Input label="Damage (opt.)" placeholder="1d8 slashing" {...register('damage')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {watch('category') === 'armor' ? (
              <Select
                label="Armor Type"
                options={[
                  { value: '', label: 'Select type...' },
                  { value: 'Light', label: 'Light' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'Heavy', label: 'Heavy' },
                  { value: 'Shield', label: 'Shield' },
                ]}
                {...register('weapon_properties')}
              />
            ) : (
              <Input label="Properties (opt.)" placeholder="Versatile, Finesse" {...register('weapon_properties')} />
            )}
            <Input label="Armor AC (opt.)" placeholder="e.g. 16" type="number" {...register('armor_bonus')} />
          </div>
          {watch('category') === 'armor' && (
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="AC Ability Score"
                options={[
                  { value: '', label: 'Default (Dexterity)' },
                  { value: 'strength', label: 'Strength' },
                  { value: 'dexterity', label: 'Dexterity' },
                  { value: 'constitution', label: 'Constitution' },
                  { value: 'intelligence', label: 'Intelligence' },
                  { value: 'wisdom', label: 'Wisdom' },
                  { value: 'charisma', label: 'Charisma' },
                ]}
                {...register('ac_ability_score')}
              />
              <Input label="Max Ability Mod (opt.)" placeholder="e.g. 2" type="number" min={0} {...register('max_ability_modifier')} />
            </div>
          )}
          {watch('category') !== 'weapon' && (
            <div>
              <Input
                label={watch('category') === 'armor' ? 'Magic AC Bonus (+X, opt.)' : 'AC Bonus (opt.)'}
                placeholder={watch('category') === 'armor' ? 'e.g. 2' : 'e.g. 1'}
                type="number"
                {...register('ac_bonus')}
              />
              <p className="text-xs text-ink-300 mt-1">
                {watch('category') === 'armor'
                  ? 'Enhancement bonus for magically enhanced armor (e.g. a +2 Half Plate or Dwarven Half Plate). The base armor AC comes from “Armor AC” above; this stacks on top of it.'
                  : 'Flat bonus added to AC, stacking with armor or Unarmored Defense. Use for magic items that boost AC without being armor (Cloak/Ring of Protection, Bracers of Defense, magic helms).'}
              </p>
            </div>
          )}
          {/* Charges / Uses tracking */}
          <div className="grid grid-cols-3 gap-4">
            <Input label="Max Charges (opt.)" placeholder="e.g. 5" type="number" min={0} {...register('charges_max')} />
            <Input label="Current Charges" placeholder="e.g. 5" type="number" min={0} {...register('charges_remaining')} />
            <Select
              label="Recharge"
              options={[
                { value: '', label: 'None' },
                { value: 'short_rest', label: 'Short Rest' },
                { value: 'long_rest', label: 'Long Rest' },
                { value: 'dawn', label: 'Dawn' },
                { value: 'manual', label: 'Manual' },
              ]}
              {...register('recharge_type')}
            />
          </div>
          <div>
            <Select
              label="Activation (opt.)"
              options={ACTIVATION_OPTIONS}
              value={activation}
              onChange={(e) => setActivation(e.target.value)}
            />
            <p className="text-xs text-ink-300 mt-1">
              How the item is used. Adds a line to the description so it shows on the sheet and the AI assistant knows whether it's an action, bonus action, or reaction.
            </p>
          </div>
          <Textarea label="Description" rows={4} {...register('description')} />
          <Button type="submit" className="w-full">{initialData ? 'Save Changes' : 'Add Item'}</Button>
        </form>
      )}
    </Modal>
  )
}
