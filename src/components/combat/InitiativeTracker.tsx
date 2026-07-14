import { useState } from 'react'
import { Heart, Shield, ChevronRight, ChevronDown, Bird, Users } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { EncounterCombatant } from '@/lib/types/database'

interface InitiativeTrackerProps {
  combatants: EncounterCombatant[]
  currentTurnId: string | null
  round: number
  isDM: boolean
  userId: string
  selectedId: string | null
  onSelect: (id: string | null) => void
}

function hpDescriptor(current: number, max: number): { label: string; color: string } {
  const pct = max > 0 ? (current / max) * 100 : 100
  if (current <= 0) return { label: 'Down', color: 'text-danger' }
  if (pct <= 25) return { label: 'Critical', color: 'text-danger' }
  if (pct <= 50) return { label: 'Bloodied', color: 'text-gold-500' }
  return { label: 'Healthy', color: 'text-heal' }
}

type InitEntry =
  | { type: 'solo'; combatant: EncounterCombatant }
  | { type: 'group'; groupId: string; combatants: EncounterCombatant[]; initiative: number | null }

export function InitiativeTracker({
  combatants,
  currentTurnId,
  round,
  isDM,
  userId,
  selectedId,
  onSelect,
}: InitiativeTrackerProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // Build initiative entries: group combatants by group_id, keep ungrouped as solo
  const entries: InitEntry[] = []
  const groupMap = new Map<string, EncounterCombatant[]>()
  const solos: EncounterCombatant[] = []

  for (const c of combatants) {
    if (c.group_id) {
      const group = groupMap.get(c.group_id) ?? []
      group.push(c)
      groupMap.set(c.group_id, group)
    } else {
      solos.push(c)
    }
  }

  for (const c of solos) {
    entries.push({ type: 'solo', combatant: c })
  }
  for (const [groupId, members] of groupMap) {
    entries.push({
      type: 'group',
      groupId,
      combatants: members,
      initiative: members[0]?.initiative ?? null,
    })
  }

  // Sort by initiative (highest first)
  entries.sort((a, b) => {
    const initA = a.type === 'solo' ? (a.combatant.initiative ?? 0) : (a.initiative ?? 0)
    const initB = b.type === 'solo' ? (b.combatant.initiative ?? 0) : (b.initiative ?? 0)
    return initB - initA
  })

  function toggleGroupCollapse(groupId: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase text-ink-500">Initiative Order</h3>
        <span className="text-xs font-mono text-ink-400">Round {round}</span>
      </div>

      <div className="space-y-1">
        {entries.map((entry) => {
          if (entry.type === 'solo') {
            return (
              <CombatantRow
                key={entry.combatant.id}
                c={entry.combatant}
                currentTurnId={currentTurnId}
                selectedId={selectedId}
                isDM={isDM}
                onSelect={onSelect}
              />
            )
          }

          // Group entry
          const { groupId, combatants: members } = entry
          const isCollapsed = collapsedGroups.has(groupId)
          const groupActive = members.some(m => m.id === currentTurnId)
          const groupName = getGroupName(members)
          const aliveCount = members.filter(m => m.current_hp > 0).length

          return (
            <div key={`group-${groupId}`} className="space-y-0.5">
              <button
                onClick={() => toggleGroupCollapse(groupId)}
                className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded transition-colors cursor-pointer ${
                  groupActive
                    ? 'bg-gold-200 border border-gold-400'
                    : 'hover:bg-parchment-200 border border-transparent'
                }`}
              >
                <span className="w-6 text-center font-mono text-xs font-bold text-ink-700">
                  {entry.initiative ?? '\u2014'}
                </span>
                {isCollapsed ? <ChevronRight size={12} className="text-ink-400" /> : <ChevronDown size={12} className="text-ink-400" />}
                <Users size={12} className="text-red-500 shrink-0" />
                <span className="text-xs font-display text-ink-700 flex-1 truncate">
                  {groupName}
                </span>
                <Badge variant="default">{aliveCount}/{members.length}</Badge>
              </button>
              {!isCollapsed && (
                <div className="ml-8 space-y-0.5">
                  {members.map(m => (
                    <CombatantRow
                      key={m.id}
                      c={m}
                      currentTurnId={currentTurnId}
                      selectedId={selectedId}
                      isDM={isDM}
                      onSelect={onSelect}
                      compact
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Derive a group display name from members (e.g. "Goblins (3)") */
function getGroupName(members: EncounterCombatant[]): string {
  // Try to find a common base name by stripping trailing numbers
  const baseName = members[0]?.name.replace(/\s*\d+$/, '') ?? 'Group'
  return `${baseName}s (${members.length})`
}

function CombatantRow({
  c,
  currentTurnId,
  selectedId,
  isDM,
  onSelect,
  compact,
}: {
  c: EncounterCombatant
  currentTurnId: string | null
  selectedId: string | null
  isDM: boolean
  onSelect: (id: string | null) => void
  compact?: boolean
}) {
  const isActive = c.id === currentTurnId
  const isSelected = c.id === selectedId
  const canSeeHp = isDM || c.is_player
  const isFlying = c.conditions.includes('Flying')
  const hpPct = c.max_hp > 0 ? Math.max(0, (c.current_hp / c.max_hp) * 100) : 100
  const hpColor = hpPct > 50 ? 'bg-heal' : hpPct > 25 ? 'bg-gold-400' : 'bg-danger'
  const desc = hpDescriptor(c.current_hp, c.max_hp)

  return (
    <button
      onClick={() => onSelect(isSelected ? null : c.id)}
      className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded transition-colors cursor-pointer ${
        isActive
          ? 'bg-gold-200 border border-gold-400'
          : isSelected
            ? 'bg-parchment-200 border border-gold-300'
            : 'hover:bg-parchment-200 border border-transparent'
      } ${c.current_hp <= 0 ? 'opacity-50' : ''}`}
    >
      {/* Initiative */}
      {!compact && (
        <span className="w-6 text-center font-mono text-xs font-bold text-ink-700">
          {c.initiative ?? '\u2014'}
        </span>
      )}

      {/* Turn indicator */}
      {isActive && <ChevronRight size={12} className="text-gold-500 shrink-0" />}

      {/* Name + badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span
            className="w-3 h-3 rounded-full shrink-0 border"
            style={{
              backgroundColor: c.token_color,
              borderColor: c.is_player ? 'var(--color-gold-400)' : '#ef4444',
            }}
          />
          <span className={`text-xs font-display truncate ${c.is_player ? 'text-ink-900' : 'text-ink-700'}`}>
            {c.name}
          </span>
          {c.is_player && <Badge variant="gold">PC</Badge>}
          {isFlying && <Bird size={10} className="text-arcane-500" />}
        </div>
        {c.conditions.length > 0 && (
          <div className="flex gap-0.5 mt-0.5 flex-wrap">
            {c.conditions.map((cond) => (
              <span key={cond} className="text-[9px] px-1 py-px bg-arcane-400/20 text-arcane-500 rounded">
                {cond}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* HP */}
      <div className="flex items-center gap-1.5 shrink-0">
        {(isDM || c.is_player) && (
          <>
            <Shield size={10} className="text-ink-400" />
            <span className="font-mono text-[10px] text-ink-500">{c.armor_class}</span>
          </>
        )}
        <Heart size={10} className="text-health" />
        {canSeeHp ? (
          <div className="w-16">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-ink-700">{c.current_hp}/{c.max_hp}</span>
            </div>
            <div className="h-1 bg-parchment-300 rounded-full overflow-hidden mt-0.5">
              <div className={`h-full ${hpColor} rounded-full transition-all`} style={{ width: `${Math.max(0, hpPct)}%` }} />
            </div>
          </div>
        ) : (
          <span className={`text-[10px] font-display ${desc.color}`}>{desc.label}</span>
        )}
      </div>
    </button>
  )
}
