import { useState } from 'react'
import { ArrowLeft, Plus, Minus, Trash2, Search, Loader2, Play, Save, Eye, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { MonsterStatBlock } from './MonsterStatBlock'
import { EncounterDifficultyCard } from './EncounterDifficultyCard'
import { useMonsters, useMonsterDetail } from '@/hooks/useMonsters'
import { getMonsterDetail } from '@/lib/dnd5e'
import {
  monsterFromSrd,
  monsterFromNpc,
  monsterCustom,
  formatCR,
  TOKEN_COLORS,
} from '@/lib/encounterPlanning'
import { crToXP } from '@/lib/dnd5e'
import type { EncounterTemplate, EncounterTemplateMonster, EncounterTemplateUpdate, Npc, CreatureSize } from '@/lib/types/database'

const SIZES: CreatureSize[] = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']

interface EncounterTemplateEditorProps {
  template: EncounterTemplate
  npcs: Npc[]
  partyLevels: number[]
  partySize: number
  isLaunching: boolean
  onBack: () => void
  onSave: (updates: EncounterTemplateUpdate) => Promise<unknown>
  onLaunch: (template: EncounterTemplate) => void
}

type AddMode = 'srd' | 'npc' | 'custom'

export function EncounterTemplateEditor({
  template,
  npcs,
  partyLevels,
  partySize,
  isLaunching,
  onBack,
  onSave,
  onLaunch,
}: EncounterTemplateEditorProps) {
  // Local draft: the DM edits freely and saves explicitly, so a half-built
  // encounter never hits the DB (and never launches) by accident.
  const [name, setName] = useState(template.name)
  const [description, setDescription] = useState(template.description)
  const [monsters, setMonsters] = useState<EncounterTemplateMonster[]>(template.monsters)
  const [tactics, setTactics] = useState(template.tactics)
  const [loot, setLoot] = useState(template.loot)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const [addMode, setAddMode] = useState<AddMode>('srd')
  const [search, setSearch] = useState('')
  const [addingIndex, setAddingIndex] = useState<string | null>(null)
  const { monsters: srdMonsters, isLoading: srdLoading } = useMonsters()

  const [customName, setCustomName] = useState('')
  const [customCr, setCustomCr] = useState('1')
  const [customHp, setCustomHp] = useState('')
  const [customAc, setCustomAc] = useState('')
  const [customSize, setCustomSize] = useState<CreatureSize>('Medium')

  const [viewing, setViewing] = useState<EncounterTemplateMonster | null>(null)
  const viewingSrdIndex = viewing?.source === 'srd' ? viewing.ref : null
  const { monster: viewingSrd, isLoading: viewingLoading } = useMonsterDetail(viewingSrdIndex)
  const viewingNpc = viewing?.source === 'npc' ? npcs.find((n) => n.id === viewing.ref) ?? null : null

  const isDirty =
    name !== template.name ||
    description !== template.description ||
    tactics !== template.tactics ||
    loot !== template.loot ||
    JSON.stringify(monsters) !== JSON.stringify(template.monsters)

  const draft: EncounterTemplate = { ...template, name, description, monsters, tactics, loot }

  const filteredSrd = search.trim()
    ? srdMonsters.filter((m) => m.name.toLowerCase().includes(search.toLowerCase())).slice(0, 25)
    : []
  const filteredNpcs = search.trim()
    ? npcs.filter((n) => n.name.toLowerCase().includes(search.toLowerCase()))
    : npcs

  function nextColor(): string {
    return TOKEN_COLORS[(monsters.length + 3) % TOKEN_COLORS.length]
  }

  function addMonster(m: EncounterTemplateMonster) {
    // Same creature again bumps quantity rather than adding a duplicate row.
    const existing = monsters.find((x) => x.source === m.source && x.ref != null && x.ref === m.ref)
    if (existing) {
      updateMonster(existing.id, { quantity: existing.quantity + 1 })
      return
    }
    setMonsters((prev) => [...prev, m])
  }

  function updateMonster(id: string, updates: Partial<EncounterTemplateMonster>) {
    setMonsters((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)))
  }

  function removeMonster(id: string) {
    setMonsters((prev) => prev.filter((m) => m.id !== id))
  }

  async function handleAddSrd(index: string) {
    setAddingIndex(index)
    try {
      const detail = await getMonsterDetail(index)
      addMonster(monsterFromSrd(detail, nextColor()))
    } finally {
      setAddingIndex(null)
    }
  }

  function handleAddCustom() {
    if (!customName.trim()) return
    addMonster(monsterCustom({
      name: customName.trim(),
      cr: parseFloat(customCr) || 0,
      hp: parseInt(customHp) || 10,
      ac: parseInt(customAc) || 10,
      size: customSize,
      color: nextColor(),
    }))
    setCustomName('')
    setCustomHp('')
    setCustomAc('')
  }

  async function handleSave(): Promise<boolean> {
    setSaving(true)
    try {
      await onSave({ name: name.trim() || 'Untitled Encounter', description, monsters, tactics, loot })
      setSavedAt(Date.now())
      return true
    } catch {
      return false
    } finally {
      setSaving(false)
    }
  }

  async function handleLaunch() {
    if (isDirty) {
      const ok = await handleSave()
      if (!ok) return
    }
    onLaunch(draft)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="p-1 text-ink-400 hover:text-ink-900 cursor-pointer" title="Back to encounters">
            <ArrowLeft size={20} />
          </button>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Encounter name"
            className="font-display text-2xl text-ink-900 bg-transparent border-b border-transparent hover:border-parchment-400 focus:border-gold-400 focus:outline-none min-w-0 flex-1"
          />
        </div>
        <div className="flex items-center gap-2">
          {isDirty ? (
            <span className="text-xs text-warning">Unsaved changes</span>
          ) : savedAt ? (
            <span className="text-xs text-ink-400">Saved</span>
          ) : null}
          <Button size="sm" variant="secondary" onClick={handleSave} disabled={saving || !isDirty}>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Save size={14} className="mr-1" />} Save
          </Button>
          <Button size="sm" onClick={handleLaunch} disabled={isLaunching || saving || monsters.length === 0}>
            {isLaunching ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Play size={14} className="mr-1" />} Launch
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: roster + notes */}
        <div className="lg:col-span-2 space-y-4">
          <Card hover={false}>
            <Textarea
              label="Description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Where this happens and why. Goblin raiders hit the caravan at dusk..."
              className="min-h-[60px]"
            />
          </Card>

          {/* Roster */}
          <Card hover={false}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm uppercase tracking-wider text-ink-500">Creatures</h3>
              <span className="text-xs text-ink-400">{monsters.reduce((s, m) => s + m.quantity, 0)} total</span>
            </div>

            {monsters.length === 0 ? (
              <p className="text-sm text-ink-400 py-4 text-center">No creatures yet. Add some below.</p>
            ) : (
              <div className="space-y-2">
                {monsters.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-2 bg-parchment-50 border border-parchment-300 rounded-lg">
                    <label className="relative shrink-0 cursor-pointer" title="Token color">
                      <span className="block w-5 h-5 rounded-full border border-ink-700/30" style={{ backgroundColor: m.token_color }} />
                      <select
                        value={m.token_color}
                        onChange={(e) => updateMonster(m.id, { token_color: e.target.value })}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        aria-label="Token color"
                      >
                        {TOKEN_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </label>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-ink-900 truncate">{m.name}</span>
                        {m.source !== 'custom' && (
                          <button onClick={() => setViewing(m)} className="p-0.5 text-ink-300 hover:text-gold-500 cursor-pointer" title="View stat block">
                            <Eye size={13} />
                          </button>
                        )}
                      </div>
                      <div className="text-[11px] text-ink-400">
                        CR {formatCR(m.cr)} · {crToXP(m.cr).toLocaleString()} XP each · HP {m.hp} · AC {m.ac} · {m.size}
                      </div>
                    </div>
                    {m.quantity > 1 && (
                      <label className="hidden sm:flex items-center gap-1 text-[10px] text-ink-500 cursor-pointer" title="One initiative roll for the group">
                        <input
                          type="checkbox"
                          checked={m.group_initiative}
                          onChange={(e) => updateMonster(m.id, { group_initiative: e.target.checked })}
                          className="accent-gold-500"
                        />
                        Group
                      </label>
                    )}
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateMonster(m.id, { quantity: Math.max(1, m.quantity - 1) })} className="p-0.5 text-ink-300 hover:text-ink-700 cursor-pointer" disabled={m.quantity <= 1}>
                        <Minus size={14} />
                      </button>
                      <span className="font-mono text-sm w-6 text-center text-ink-900">{m.quantity}</span>
                      <button onClick={() => updateMonster(m.id, { quantity: m.quantity + 1 })} className="p-0.5 text-ink-300 hover:text-ink-700 cursor-pointer">
                        <Plus size={14} />
                      </button>
                    </div>
                    <button onClick={() => removeMonster(m.id)} className="p-1 text-ink-300 hover:text-danger cursor-pointer" title="Remove">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Add creatures */}
          <Card hover={false}>
            <div className="flex items-center gap-1 mb-3 border-b border-parchment-300">
              {([['srd', 'Monster Manual'], ['npc', `Your NPCs (${npcs.length})`], ['custom', 'Quick Add']] as [AddMode, string][]).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => { setAddMode(mode); setSearch('') }}
                  className={`px-3 py-2 text-xs font-display uppercase tracking-wider border-b-2 -mb-px cursor-pointer transition-colors ${
                    addMode === mode ? 'border-gold-400 text-gold-600' : 'border-transparent text-ink-300 hover:text-ink-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {addMode !== 'custom' && (
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                  placeholder={addMode === 'srd' ? 'Search the SRD...' : 'Filter your NPCs...'}
                  className="w-full pl-9 pr-4 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm text-ink-900 focus:outline-none focus:border-gold-400"
                />
                {addMode === 'srd' && srdLoading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-ink-400" />}
              </div>
            )}

            {addMode === 'srd' && (
              <div className="max-h-56 overflow-y-auto space-y-0.5">
                {filteredSrd.map((m) => (
                  <div key={m.index} className="flex items-center justify-between px-2 py-1.5 hover:bg-parchment-200/50 rounded">
                    <span className="text-sm text-ink-900">{m.name}</span>
                    <button onClick={() => handleAddSrd(m.index)} disabled={addingIndex === m.index} className="p-1 text-ink-300 hover:text-gold-500 cursor-pointer">
                      {addingIndex === m.index ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    </button>
                  </div>
                ))}
                {search.trim() && filteredSrd.length === 0 && !srdLoading && (
                  <p className="text-xs text-ink-400 px-2 py-2">No SRD creature matches "{search}".</p>
                )}
                {!search.trim() && <p className="text-xs text-ink-400 px-2 py-2">Type to search the 2024 SRD bestiary.</p>}
              </div>
            )}

            {addMode === 'npc' && (
              <div className="max-h-56 overflow-y-auto space-y-0.5">
                {filteredNpcs.map((n) => (
                  <div key={n.id} className="flex items-center justify-between px-2 py-1.5 hover:bg-parchment-200/50 rounded">
                    <div>
                      <span className="text-sm text-ink-900">{n.name}</span>
                      <span className="text-[10px] text-ink-400 ml-2">CR {formatCR(Number(n.challenge_rating))} · HP {n.hit_points} · AC {n.armor_class}</span>
                    </div>
                    <button onClick={() => addMonster(monsterFromNpc(n, nextColor()))} className="p-1 text-ink-300 hover:text-gold-500 cursor-pointer">
                      <Plus size={14} />
                    </button>
                  </div>
                ))}
                {npcs.length === 0 && <p className="text-xs text-ink-400 px-2 py-2">No custom NPCs yet. Build or import them under Custom NPCs.</p>}
              </div>
            )}

            {addMode === 'custom' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Name" className="col-span-2 px-2 py-1.5 bg-parchment-50 border border-parchment-400 rounded text-sm text-ink-900 focus:outline-none focus:border-gold-400" />
                  <input value={customCr} onChange={(e) => setCustomCr(e.target.value)} placeholder="CR" type="number" step="0.125" min="0" className="px-2 py-1.5 bg-parchment-50 border border-parchment-400 rounded font-mono text-sm text-ink-900 focus:outline-none focus:border-gold-400" />
                  <input value={customHp} onChange={(e) => setCustomHp(e.target.value)} placeholder="HP" type="number" className="px-2 py-1.5 bg-parchment-50 border border-parchment-400 rounded font-mono text-sm text-ink-900 focus:outline-none focus:border-gold-400" />
                  <input value={customAc} onChange={(e) => setCustomAc(e.target.value)} placeholder="AC" type="number" className="px-2 py-1.5 bg-parchment-50 border border-parchment-400 rounded font-mono text-sm text-ink-900 focus:outline-none focus:border-gold-400" />
                </div>
                <div className="flex items-center gap-2">
                  <select value={customSize} onChange={(e) => setCustomSize(e.target.value as CreatureSize)} className="px-2 py-1.5 bg-parchment-50 border border-parchment-400 rounded text-sm text-ink-900 focus:outline-none focus:border-gold-400">
                    {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <Button size="sm" onClick={handleAddCustom} disabled={!customName.trim()}>Add</Button>
                  <span className="text-[11px] text-ink-400">For one-offs that don't need a full stat block.</span>
                </div>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card hover={false}>
              <Textarea label="Tactics" rows={5} value={tactics} onChange={(e) => setTactics(e.target.value)} placeholder="Who acts first, who they target, when they flee..." />
            </Card>
            <Card hover={false}>
              <Textarea label="Loot & Rewards" rows={5} value={loot} onChange={(e) => setLoot(e.target.value)} placeholder="Treasure, clues, XP notes..." />
            </Card>
          </div>
        </div>

        {/* Right: difficulty */}
        <div className="space-y-4">
          <Card hover={false}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm uppercase tracking-wider text-ink-500">Difficulty</h3>
              <span className="flex items-center gap-1 text-xs text-ink-400"><Users size={12} /> {partySize} PC{partySize === 1 ? '' : 's'}</span>
            </div>
            <EncounterDifficultyCard monsters={monsters} partyLevels={partyLevels} />
          </Card>
          <Card hover={false}>
            <h3 className="font-display text-sm uppercase tracking-wider text-ink-500 mb-2">Launching</h3>
            <p className="text-xs text-ink-500 leading-relaxed">
              Launch creates the live encounter in the Combat tab with every creature here plus the party already placed on the grid. Initiative is rolled there. The saved encounter is untouched, so you can run it again later.
            </p>
          </Card>
        </div>
      </div>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Stat Block" size="lg">
        {viewingLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin text-ink-400" /></div>
        ) : viewingSrd ? (
          <MonsterStatBlock monster={viewingSrd} />
        ) : viewingNpc ? (
          <MonsterStatBlock monster={viewingNpc} />
        ) : (
          <p className="text-sm text-ink-500">This NPC no longer exists; the encounter still launches with its snapshotted stats.</p>
        )}
      </Modal>
    </div>
  )
}
