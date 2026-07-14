import { useState, useRef } from 'react'
import { Plus, Upload, Trash2, UserPlus, Search, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useMonsters } from '@/hooks/useMonsters'
import { getMonsterDetail } from '@/lib/dnd5e'
import { abilityModifier } from '@/lib/calculations'
import type { EncounterCombatantInsert, EncounterCombatant, CampaignEncounter, Npc } from '@/lib/types/database'
import type { Character } from '@/lib/types/database'

const TOKEN_COLORS = [
  '#c9981e', '#4a9e65', '#3b82f6', '#ef4444', '#a855f7',
  '#ec4899', '#f97316', '#14b8a6', '#6366f1', '#78716c',
]

interface EncounterSetupProps {
  encounter: CampaignEncounter
  partyCharacters: { character: Character; userId: string }[]
  npcs: Npc[]
  existingCombatants: EncounterCombatant[]
  onAddCombatants: (combatants: EncounterCombatantInsert[]) => void
  onRemoveCombatant: (id: string) => void
  onUploadMap: (file: File) => Promise<unknown>
  onUpdateEncounter: (updates: { grid_width?: number; grid_height?: number }) => void
  onStartInitiative: () => void
  onDeleteEncounter: () => void
}

export function EncounterSetup({
  encounter,
  partyCharacters,
  npcs,
  existingCombatants,
  onAddCombatants,
  onRemoveCombatant,
  onUploadMap,
  onUpdateEncounter,
  onStartInitiative,
  onDeleteEncounter,
}: EncounterSetupProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [monsterName, setMonsterName] = useState('')
  const [monsterHp, setMonsterHp] = useState('')
  const [monsterAc, setMonsterAc] = useState('')
  const [monsterCount, setMonsterCount] = useState('1')
  const [monsterColor, setMonsterColor] = useState(TOKEN_COLORS[3])
  const [groupEnemies, setGroupEnemies] = useState(true)

  // SRD monster search
  const [monsterSearch, setMonsterSearch] = useState('')
  const { monsters: allMonsters } = useMonsters()
  const filteredMonsters = monsterSearch.trim()
    ? allMonsters.filter((m) => m.name.toLowerCase().includes(monsterSearch.toLowerCase())).slice(0, 20)
    : []

  // NPC list
  const [showNpcs, setShowNpcs] = useState(false)
  const [npcSearch, setNpcSearch] = useState('')
  const filteredNpcs = npcSearch.trim()
    ? npcs.filter((n) => n.name.toLowerCase().includes(npcSearch.toLowerCase()))
    : npcs

  // Build occupied set from existing combatants
  const occupied = new Set<string>()
  for (const c of existingCombatants) {
    if (c.grid_x != null && c.grid_y != null) occupied.add(`${c.grid_x},${c.grid_y}`)
  }

  function findOpenCell(preferredY: number, startIdx: number = 0): { x: number; y: number } {
    // Try preferred row first, then spread out
    for (let attempt = 0; attempt < encounter.grid_width * encounter.grid_height; attempt++) {
      const x = (startIdx + attempt) % encounter.grid_width
      const yOffset = Math.floor((startIdx + attempt) / encounter.grid_width)
      const y = preferredY + yOffset < encounter.grid_height
        ? preferredY + yOffset
        : (preferredY - yOffset + encounter.grid_height) % encounter.grid_height
      const key = `${x},${y}`
      if (!occupied.has(key)) {
        occupied.add(key) // Mark as taken for subsequent calls in the same batch
        return { x, y }
      }
    }
    return { x: 0, y: 0 } // Fallback
  }

  function handleAddParty() {
    const combatants: EncounterCombatantInsert[] = partyCharacters.map(({ character, userId }, i) => {
      const pos = findOpenCell(encounter.grid_height - 1, i)
      return {
        encounter_id: encounter.id,
        user_id: userId,
        name: character.name,
        initiative: null,
        initiative_bonus: abilityModifier(character.dexterity) + (character.initiative_bonus ?? 0),
        max_hp: character.max_hp,
        current_hp: character.current_hp,
        temp_hp: 0,
        armor_class: character.armor_class,
        is_player: true,
        conditions: [],
        grid_x: pos.x,
        grid_y: pos.y,
        token_color: TOKEN_COLORS[i % TOKEN_COLORS.length],
        size: 'Medium',
        group_id: null,
      }
    })
    onAddCombatants(combatants)
  }

  function handleAddManualMonster() {
    if (!monsterName.trim()) return
    const hp = parseInt(monsterHp) || 10
    const ac = parseInt(monsterAc) || 10
    const count = Math.max(1, parseInt(monsterCount) || 1)
    const gid = (count > 1 && groupEnemies) ? crypto.randomUUID() : null

    const combatants: EncounterCombatantInsert[] = Array.from({ length: count }).map((_, i) => {
      const pos = findOpenCell(0, i)
      return {
        encounter_id: encounter.id,
        user_id: null,
        name: count > 1 ? `${monsterName.trim()} ${i + 1}` : monsterName.trim(),
        initiative: null,
        initiative_bonus: 0,
        max_hp: hp,
        current_hp: hp,
        temp_hp: 0,
        armor_class: ac,
        is_player: false,
        conditions: [],
        grid_x: pos.x,
        grid_y: pos.y,
        token_color: monsterColor,
        size: 'Medium',
        group_id: gid,
      }
    })

    onAddCombatants(combatants)
    setMonsterName('')
    setMonsterHp('')
    setMonsterAc('')
    setMonsterCount('1')
    setShowAddForm(false)
  }

  async function handleAddSrdMonster(monsterIndex: string) {
    try {
      const detail = await getMonsterDetail(monsterIndex)
      const pos = findOpenCell(0)
      const combatant: EncounterCombatantInsert = {
        encounter_id: encounter.id,
        user_id: null,
        name: detail.name,
        initiative: null,
        initiative_bonus: abilityModifier(detail.dexterity),
        max_hp: detail.hit_points,
        current_hp: detail.hit_points,
        temp_hp: 0,
        armor_class: detail.armor_class[0]?.value ?? 10,
        is_player: false,
        conditions: [],
        grid_x: pos.x,
        grid_y: pos.y,
        token_color: TOKEN_COLORS[3],
        size: (detail.size as EncounterCombatantInsert['size']) || 'Medium',
        group_id: null,
      }
      onAddCombatants([combatant])
    } catch {
      // Silently fail if fetch fails
    }
  }

  function handleAddNpc(npc: Npc) {
    const pos = findOpenCell(0)
    const combatant: EncounterCombatantInsert = {
      encounter_id: encounter.id,
      user_id: null,
      name: npc.name,
      initiative: null,
      initiative_bonus: abilityModifier(npc.dexterity),
      max_hp: npc.hit_points,
      current_hp: npc.hit_points,
      temp_hp: 0,
      armor_class: npc.armor_class,
      is_player: false,
      conditions: [],
      grid_x: pos.x,
      grid_y: pos.y,
      token_color: TOKEN_COLORS[5],
      size: (npc.size as EncounterCombatantInsert['size']) || 'Medium',
      group_id: null,
    }
    onAddCombatants([combatant])
  }

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      await onUploadMap(file)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Check that the battle-maps storage bucket exists and has public access.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase text-ink-500">Encounter Setup</h3>
        <Button size="sm" variant="danger" onClick={onDeleteEncounter}>
          <Trash2 size={14} className="mr-1" /> Delete
        </Button>
      </div>

      {/* Grid & Map Settings */}
      <Card>
        <div className="space-y-3">
          <h4 className="text-xs font-display uppercase text-ink-500">Grid Settings</h4>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-ink-500">Width</label>
              <input
                type="number"
                min="5"
                max="50"
                value={encounter.grid_width}
                onChange={(e) => onUpdateEncounter({ grid_width: parseInt(e.target.value) || 20 })}
                className="w-16 px-2 py-1 bg-parchment-50 border border-parchment-400 rounded font-mono text-sm text-center text-ink-900 focus:outline-none focus:border-gold-400"
              />
            </div>
            <span className="text-ink-400">&times;</span>
            <div className="flex items-center gap-2">
              <label className="text-xs text-ink-500">Height</label>
              <input
                type="number"
                min="5"
                max="50"
                value={encounter.grid_height}
                onChange={(e) => onUpdateEncounter({ grid_height: parseInt(e.target.value) || 15 })}
                className="w-16 px-2 py-1 bg-parchment-50 border border-parchment-400 rounded font-mono text-sm text-center text-ink-900 focus:outline-none focus:border-gold-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Upload size={14} className="mr-1" />}
                {uploading ? 'Uploading...' : encounter.map_image_url ? 'Replace Map' : 'Upload Map'}
              </Button>
              {encounter.map_image_url && (
                <span className="text-xs text-heal">Map uploaded</span>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            {uploadError && (
              <p className="text-xs text-danger">{uploadError}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Add Combatants */}
      <Card>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-display uppercase text-ink-500">Combatants</h4>
            <div className="flex gap-2">
              {partyCharacters.length > 0 && (
                <Button size="sm" variant="secondary" onClick={handleAddParty}>
                  <UserPlus size={14} className="mr-1" /> Add Party
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => setShowAddForm(!showAddForm)}>
                <Plus size={14} className="mr-1" /> Manual
              </Button>
            </div>
          </div>

          {/* Manual add form */}
          {showAddForm && (
            <div className="p-3 bg-parchment-50 border border-parchment-300 rounded space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input
                  value={monsterName}
                  onChange={(e) => setMonsterName(e.target.value)}
                  placeholder="Name"
                  className="col-span-2 sm:col-span-1 px-2 py-1.5 bg-parchment-50 border border-parchment-400 rounded text-sm text-ink-900 focus:outline-none focus:border-gold-400"
                />
                <input
                  value={monsterHp}
                  onChange={(e) => setMonsterHp(e.target.value)}
                  placeholder="HP"
                  type="number"
                  className="px-2 py-1.5 bg-parchment-50 border border-parchment-400 rounded font-mono text-sm text-ink-900 focus:outline-none focus:border-gold-400"
                />
                <input
                  value={monsterAc}
                  onChange={(e) => setMonsterAc(e.target.value)}
                  placeholder="AC"
                  type="number"
                  className="px-2 py-1.5 bg-parchment-50 border border-parchment-400 rounded font-mono text-sm text-ink-900 focus:outline-none focus:border-gold-400"
                />
                <input
                  value={monsterCount}
                  onChange={(e) => setMonsterCount(e.target.value)}
                  placeholder="Count"
                  type="number"
                  min="1"
                  className="px-2 py-1.5 bg-parchment-50 border border-parchment-400 rounded font-mono text-sm text-ink-900 focus:outline-none focus:border-gold-400"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-ink-500">Color:</span>
                {TOKEN_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setMonsterColor(color)}
                    className={`w-5 h-5 rounded-full cursor-pointer border-2 ${
                      monsterColor === color ? 'border-ink-700 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <label className="flex items-center gap-1.5 ml-auto text-xs text-ink-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={groupEnemies}
                    onChange={(e) => setGroupEnemies(e.target.checked)}
                    className="accent-gold-500"
                  />
                  Group Initiative
                </label>
              </div>
              <Button size="sm" onClick={handleAddManualMonster}>
                Add
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* SRD Monster Search */}
      <Card>
        <div className="space-y-2">
          <h4 className="text-xs font-display uppercase text-ink-500">Search Monsters (SRD)</h4>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              value={monsterSearch}
              onChange={(e) => setMonsterSearch(e.target.value)}
              placeholder="Search monsters..."
              className="w-full pl-8 pr-3 py-1.5 bg-parchment-50 border border-parchment-400 rounded text-sm text-ink-900 focus:outline-none focus:border-gold-400"
            />
          </div>
          {filteredMonsters.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-0.5">
              {filteredMonsters.map((m) => (
                <div
                  key={m.index}
                  className="flex items-center justify-between px-2 py-1 hover:bg-parchment-200/50 rounded"
                >
                  <span className="text-sm text-ink-900">{m.name}</span>
                  <button
                    onClick={() => handleAddSrdMonster(m.index)}
                    className="p-0.5 text-ink-300 hover:text-gold-500 cursor-pointer"
                    title="Add to encounter"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Custom NPCs */}
      {npcs.length > 0 && (
        <Card>
          <div className="space-y-2">
            <button
              onClick={() => setShowNpcs(!showNpcs)}
              className="flex items-center gap-1 w-full cursor-pointer"
            >
              {showNpcs ? <ChevronDown size={14} className="text-ink-400" /> : <ChevronRight size={14} className="text-ink-400" />}
              <h4 className="text-xs font-display uppercase text-ink-500">
                Your NPCs ({npcs.length})
              </h4>
            </button>

            {showNpcs && (
              <>
                {npcs.length > 5 && (
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-300" />
                    <input
                      value={npcSearch}
                      onChange={(e) => setNpcSearch(e.target.value)}
                      placeholder="Filter NPCs..."
                      className="w-full pl-8 pr-3 py-1.5 bg-parchment-50 border border-parchment-400 rounded text-sm text-ink-900 focus:outline-none focus:border-gold-400"
                    />
                  </div>
                )}
                <div className="max-h-40 overflow-y-auto space-y-0.5">
                  {filteredNpcs.map((npc) => (
                    <div
                      key={npc.id}
                      className="flex items-center justify-between px-2 py-1 hover:bg-parchment-200/50 rounded"
                    >
                      <div>
                        <span className="text-sm text-ink-900">{npc.name}</span>
                        <span className="text-[10px] text-ink-400 ml-2">
                          CR {npc.challenge_rating} · HP {npc.hit_points} · AC {npc.armor_class}
                        </span>
                      </div>
                      <button
                        onClick={() => handleAddNpc(npc)}
                        className="p-0.5 text-ink-300 hover:text-gold-500 cursor-pointer shrink-0"
                        title="Add to encounter"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Current Combatants */}
      {existingCombatants.length > 0 && (
        <Card>
          <div className="space-y-2">
            <h4 className="text-xs font-display uppercase text-ink-500">
              Current Combatants ({existingCombatants.length})
            </h4>
            <div className="space-y-1">
              {existingCombatants.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between px-2 py-1.5 rounded bg-parchment-50 border border-parchment-200"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 border"
                      style={{
                        backgroundColor: c.token_color,
                        borderColor: c.is_player ? 'var(--color-gold-400)' : '#ef4444',
                      }}
                    />
                    <span className="text-sm text-ink-900">{c.name}</span>
                    <span className="text-[10px] text-ink-400">
                      HP {c.current_hp}/{c.max_hp} · AC {c.armor_class}
                    </span>
                    {c.is_player && (
                      <span className="text-[10px] px-1 py-px bg-gold-200 text-gold-700 rounded">PC</span>
                    )}
                  </div>
                  <button
                    onClick={() => onRemoveCombatant(c.id)}
                    className="p-1 text-ink-300 hover:text-danger cursor-pointer transition-colors"
                    title="Remove from encounter"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Start Button */}
      <Button onClick={onStartInitiative} className="w-full" disabled={existingCombatants.length < 2}>
        Roll Initiative
      </Button>
    </div>
  )
}
