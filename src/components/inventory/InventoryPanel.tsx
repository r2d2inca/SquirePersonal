import { useState, useEffect, useRef } from 'react'
import { Plus, Minus, Backpack, Sword, Shield, Package, Gem, Sparkles, ChevronDown, Pencil, RotateCcw } from 'lucide-react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { InventoryForm } from './InventoryForm'
import { ITEM_CATEGORIES } from '@/lib/constants'
import type { InventoryItem, InventoryItemInsert, InventoryItemUpdate } from '@/lib/types/database'

const CATEGORY_ICONS: Record<string, typeof Sword> = {
  weapon: Sword,
  armor: Shield,
  gear: Package,
  consumable: Sparkles,
  treasure: Gem,
  magic_item: Sparkles,
}

const CATEGORY_LABELS: Record<string, string> = {
  weapon: 'Weapons',
  armor: 'Armor & Shields',
  gear: 'Gear',
  consumable: 'Consumables',
  treasure: 'Treasure',
  magic_item: 'Magic Items',
}

interface Currency {
  copper: number
  silver: number
  electrum: number
  gold: number
  platinum: number
}

interface InventoryPanelProps {
  items: InventoryItem[]
  characterId: string
  currency: Currency
  onAddItem: (item: InventoryItemInsert) => void
  onUpdateItem: (id: string, updates: InventoryItemUpdate) => void
  onDeleteItem: (id: string) => void
  onUpdateCurrency: (currency: Partial<Currency>) => void
}

export function InventoryPanel({
  items,
  characterId,
  currency,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onUpdateCurrency,
}: InventoryPanelProps) {
  const [showForm, setShowForm] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const coins = ['copper', 'silver', 'electrum', 'gold', 'platinum'] as const
  const toStrings = (c: Currency) =>
    Object.fromEntries(coins.map((k) => [k, c[k] ? String(c[k]) : ''])) as Record<keyof Currency, string>

  const [localCurrency, setLocalCurrency] = useState<Record<keyof Currency, string>>(toStrings(currency))
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Sync local state when server value changes (but not while user is typing)
  useEffect(() => {
    setLocalCurrency((prev) => {
      const next = { ...prev }
      for (const coin of coins) {
        if (!debounceTimers.current[coin]) next[coin] = currency[coin] ? String(currency[coin]) : ''
      }
      return next
    })
  }, [currency])

  function handleCurrencyChange(coin: keyof Currency, value: string) {
    setLocalCurrency((prev) => ({ ...prev, [coin]: value }))
    const parsed = parseInt(value) || 0
    if (debounceTimers.current[coin]) clearTimeout(debounceTimers.current[coin])
    debounceTimers.current[coin] = setTimeout(() => {
      delete debounceTimers.current[coin]
      onUpdateCurrency({ [coin]: parsed })
    }, 500)
  }

  const filtered = filterCategory ? items.filter((i) => i.category === filterCategory) : items

  const grouped = filtered.reduce<Record<string, InventoryItem[]>>((acc, item) => {
    const cat = item.category || 'gear'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  const totalWeight = items.reduce((sum, i) => sum + (i.weight || 0) * i.quantity, 0)

  function handleAddItem(data: {
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
  }) {
    onAddItem({
      character_id: characterId,
      name: data.name,
      category: data.category || 'gear',
      quantity: data.quantity || 1,
      weight: data.weight || 0,
      description: data.description || '',
      is_equipped: false,
      is_attuned: false,
      damage: data.damage || null,
      weapon_properties: data.weapon_properties || null,
      armor_bonus: data.armor_bonus ? parseInt(data.armor_bonus) : null,
      ac_ability_score: data.ac_ability_score || null,
      max_ability_modifier: data.max_ability_modifier ? parseInt(data.max_ability_modifier) : null,
      ac_bonus: data.ac_bonus ? parseInt(data.ac_bonus) : null,
      charges_max: data.charges_max ? parseInt(data.charges_max) : null,
      charges_remaining: data.charges_remaining ? parseInt(data.charges_remaining) : null,
      recharge_type: data.recharge_type || null,
      sort_order: 0,
    })
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink-900">Inventory</h2>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus size={14} className="mr-1" /> Add Item
        </Button>
      </div>

      {/* Currency */}
      <Card>
        <SectionHeader>Currency</SectionHeader>
        <div className="flex items-center gap-3 flex-wrap">
          {(['copper', 'silver', 'electrum', 'gold', 'platinum'] as const).map((coin) => (
            <div key={coin} className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                value={localCurrency[coin]}
                onChange={(e) => handleCurrencyChange(coin, e.target.value)}
                placeholder="0"
                className="w-16 text-center font-mono text-sm border border-parchment-400 rounded py-1 bg-parchment-50"
              />
              <span className="text-xs font-display uppercase text-ink-500">
                {coin.slice(0, 2).toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Weight */}
      <div className="text-sm text-ink-500">
        Total Weight: <span className="font-mono text-ink-900">{totalWeight.toFixed(1)} lbs</span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilterCategory(null)}
          className={`px-3 py-1 rounded text-xs font-display uppercase cursor-pointer transition-colors ${
            filterCategory === null ? 'bg-gold-400 text-ink-900' : 'bg-parchment-200 text-ink-500'
          }`}
        >
          All ({items.length})
        </button>
        {ITEM_CATEGORIES.map((cat) => {
          const count = items.filter((i) => i.category === cat).length
          if (count === 0) return null
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
              className={`px-3 py-1 rounded text-xs font-display uppercase cursor-pointer transition-colors ${
                filterCategory === cat ? 'bg-gold-400 text-ink-900' : 'bg-parchment-200 text-ink-500'
              }`}
            >
              {CATEGORY_LABELS[cat]} ({count})
            </button>
          )
        })}
      </div>

      {/* Item List */}
      {items.length === 0 ? (
        <EmptyState
          icon={<Backpack size={48} />}
          title="Empty Inventory"
          description="Add items to track your equipment and gear."
          action={{ label: 'Add Item', onClick: () => setShowForm(true) }}
        />
      ) : (
        Object.entries(grouped).map(([category, categoryItems]) => (
          <div key={category}>
            <SectionHeader>{CATEGORY_LABELS[category] || category}</SectionHeader>
            <div className="space-y-2">
              {categoryItems.map((item) => {
                const Icon = CATEGORY_ICONS[item.category] || Package
                const isExpanded = expandedItems.has(item.id)
                const toggleExpand = () =>
                  setExpandedItems((prev) => {
                    const next = new Set(prev)
                    if (next.has(item.id)) next.delete(item.id)
                    else next.add(item.id)
                    return next
                  })
                return (
                  <div
                    key={item.id}
                    className="border border-parchment-300 rounded-lg overflow-hidden transition-colors"
                  >
                    {/* Collapsed header — always visible */}
                    <button
                      type="button"
                      onClick={toggleExpand}
                      className="w-full flex items-center gap-3 p-3 hover:bg-parchment-200/30 transition-colors cursor-pointer"
                    >
                      <Icon size={18} className="text-ink-500 shrink-0" />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-body font-semibold text-ink-900 truncate">{item.name}</span>
                        {item.quantity > 1 && (
                          <span className="font-mono text-xs text-ink-500">x{item.quantity}</span>
                        )}
                        {item.is_equipped && <Badge variant="gold">Equipped</Badge>}
                        {item.is_attuned && <Badge variant="arcane">Attuned</Badge>}
                        {item.charges_max != null && item.charges_max > 0 && (
                          <span className="font-mono text-xs text-ink-400">{item.charges_remaining ?? 0}/{item.charges_max}</span>
                        )}
                      </div>
                      {item.weight > 0 && (
                        <span className="text-xs text-ink-400 shrink-0">{item.weight} lb</span>
                      )}
                      <ChevronDown
                        size={16}
                        className={`text-ink-400 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0 border-t border-parchment-200 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap pt-2">
                          {item.damage && (
                            <span className="text-xs font-mono text-ink-500">{item.damage}</span>
                          )}
                          {item.weapon_properties && (
                            <span className="text-xs text-ink-400">{item.weapon_properties}</span>
                          )}
                          {item.armor_bonus != null && (
                            <span className="text-xs font-mono text-ink-500">
                              AC {item.armor_bonus}
                              {item.ac_ability_score
                                ? ` + ${item.ac_ability_score.slice(0, 3).toUpperCase()}${item.max_ability_modifier != null ? ` (max ${item.max_ability_modifier})` : ''}`
                                : ''}
                            </span>
                          )}
                          {item.ac_bonus != null && (
                            <span className="text-xs font-mono text-arcane-600">AC +{item.ac_bonus}</span>
                          )}
                        </div>
                        {/* Charges tracker */}
                        {item.charges_max != null && item.charges_max > 0 && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-xs font-display uppercase text-ink-400">Charges:</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => onUpdateItem(item.id, { charges_remaining: Math.max((item.charges_remaining ?? 0) - 1, 0) })}
                                disabled={(item.charges_remaining ?? 0) <= 0}
                                className="w-5 h-5 flex items-center justify-center rounded bg-parchment-200 text-ink-500 hover:bg-danger/20 hover:text-danger cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="font-mono text-sm text-ink-900 min-w-[3ch] text-center">
                                {item.charges_remaining ?? 0}
                              </span>
                              <span className="text-xs text-ink-400">/</span>
                              <span className="font-mono text-sm text-ink-500 min-w-[3ch] text-center">
                                {item.charges_max}
                              </span>
                              <button
                                onClick={() => onUpdateItem(item.id, { charges_remaining: Math.min((item.charges_remaining ?? 0) + 1, item.charges_max!) })}
                                disabled={(item.charges_remaining ?? 0) >= item.charges_max}
                                className="w-5 h-5 flex items-center justify-center rounded bg-parchment-200 text-ink-500 hover:bg-gold-200 hover:text-gold-700 cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Plus size={10} />
                              </button>
                              <button
                                onClick={() => onUpdateItem(item.id, { charges_remaining: item.charges_max! })}
                                title="Restore all charges"
                                className="w-5 h-5 flex items-center justify-center rounded bg-parchment-200 text-ink-500 hover:bg-arcane-200 hover:text-arcane-700 cursor-pointer transition-colors ml-1"
                              >
                                <RotateCcw size={10} />
                              </button>
                            </div>
                            {item.recharge_type && (
                              <span className="text-xs text-ink-300 capitalize">
                                ({item.recharge_type.replace('_', ' ')})
                              </span>
                            )}
                          </div>
                        )}
                        {item.description && (
                          <p className="text-xs text-ink-500 whitespace-pre-wrap">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => onUpdateItem(item.id, { is_equipped: !item.is_equipped })}
                            className={`px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                              item.is_equipped ? 'bg-gold-200 text-gold-700' : 'bg-parchment-200 text-ink-500'
                            }`}
                          >
                            {item.is_equipped ? 'Unequip' : 'Equip'}
                          </button>
                          <button
                            onClick={() => onUpdateItem(item.id, { is_attuned: !item.is_attuned })}
                            className={`px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                              item.is_attuned ? 'bg-arcane-200 text-arcane-700' : 'bg-parchment-200 text-ink-500'
                            }`}
                          >
                            {item.is_attuned ? 'Unattuned' : 'Attune'}
                          </button>
                          <button
                            onClick={() => setEditingItem(item)}
                            className="px-2 py-1 rounded text-xs text-ink-500 hover:text-ink-900 hover:bg-parchment-300 cursor-pointer transition-colors flex items-center gap-1"
                          >
                            <Pencil size={10} /> Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item.id)}
                            className="ml-auto px-2 py-1 rounded text-xs text-ink-300 hover:text-danger hover:bg-danger/10 cursor-pointer transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && onDeleteItem(deleteTarget)}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
      />

      {/* Add Item Form */}
      <InventoryForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleAddItem}
      />

      {/* Edit Item Form */}
      {editingItem && (
        <InventoryForm
          open={!!editingItem}
          onClose={() => setEditingItem(null)}
          title="Edit Item"
          initialData={{
            name: editingItem.name,
            category: editingItem.category,
            quantity: editingItem.quantity,
            weight: editingItem.weight,
            damage: editingItem.damage || '',
            weapon_properties: editingItem.weapon_properties || '',
            armor_bonus: editingItem.armor_bonus != null ? String(editingItem.armor_bonus) : '',
            ac_ability_score: editingItem.ac_ability_score || '',
            max_ability_modifier: editingItem.max_ability_modifier != null ? String(editingItem.max_ability_modifier) : '',
            ac_bonus: editingItem.ac_bonus != null ? String(editingItem.ac_bonus) : '',
            charges_max: editingItem.charges_max != null ? String(editingItem.charges_max) : '',
            charges_remaining: editingItem.charges_remaining != null ? String(editingItem.charges_remaining) : '',
            recharge_type: editingItem.recharge_type || '',
            description: editingItem.description || '',
          }}
          onSubmit={(data) => {
            onUpdateItem(editingItem.id, {
              name: data.name,
              category: data.category || 'gear',
              quantity: data.quantity || 1,
              weight: data.weight || 0,
              description: data.description || '',
              damage: data.damage || null,
              weapon_properties: data.weapon_properties || null,
              armor_bonus: data.armor_bonus ? parseInt(data.armor_bonus) : null,
              ac_ability_score: data.ac_ability_score || null,
              max_ability_modifier: data.max_ability_modifier ? parseInt(data.max_ability_modifier) : null,
              ac_bonus: data.ac_bonus ? parseInt(data.ac_bonus) : null,
              charges_max: data.charges_max ? parseInt(data.charges_max) : null,
              charges_remaining: data.charges_remaining ? parseInt(data.charges_remaining) : null,
              recharge_type: data.recharge_type || null,
            })
            setEditingItem(null)
          }}
        />
      )}
    </div>
  )
}
