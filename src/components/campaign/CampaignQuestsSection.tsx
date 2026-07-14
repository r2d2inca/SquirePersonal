import { useState } from 'react'
import { Plus, Target, Trash2, Edit2, CheckCircle2, XCircle, Circle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { CampaignQuest, CampaignQuestInsert, CampaignQuestUpdate, QuestObjective } from '@/lib/types/database'

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  failed: 'Failed',
}

const STATUS_VARIANTS: Record<string, 'gold' | 'default' | 'danger'> = {
  active: 'gold',
  completed: 'default',
  failed: 'danger',
}

interface CampaignQuestsSectionProps {
  quests: CampaignQuest[]
  campaignId: string
  userId: string
  onAdd: (quest: CampaignQuestInsert) => void
  onUpdate: (id: string, updates: CampaignQuestUpdate) => void
  onDelete: (id: string) => void
}

export function CampaignQuestsSection({ quests, campaignId, userId, onAdd, onUpdate, onDelete }: CampaignQuestsSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>('active')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [objectives, setObjectives] = useState<QuestObjective[]>([])
  const [newObjective, setNewObjective] = useState('')

  const filtered = filterStatus ? quests.filter((q) => q.status === filterStatus) : quests

  const editingQuest = editingId ? quests.find((q) => q.id === editingId) : null

  function handleEdit(quest: CampaignQuest) {
    setEditingId(quest.id)
    setObjectives(quest.objectives ?? [])
    setShowForm(true)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = {
      title: form.get('title') as string,
      description: form.get('description') as string || '',
      objectives,
    }

    if (editingId) {
      onUpdate(editingId, data)
      setEditingId(null)
    } else {
      onAdd({ ...data, campaign_id: campaignId, user_id: userId, status: 'active', sort_order: 0 })
    }
    setShowForm(false)
    setObjectives([])
  }

  function addObjective() {
    if (!newObjective.trim()) return
    setObjectives([...objectives, { text: newObjective.trim(), completed: false }])
    setNewObjective('')
  }

  function toggleObjective(questId: string, idx: number) {
    const quest = quests.find((q) => q.id === questId)
    if (!quest) return
    const newObjectives = [...quest.objectives]
    newObjectives[idx] = { ...newObjectives[idx], completed: !newObjectives[idx].completed }
    onUpdate(questId, { objectives: newObjectives })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink-900">Quest Tracker</h2>
        <Button onClick={() => { setEditingId(null); setObjectives([]); setShowForm(true) }} size="sm">
          <Plus size={14} className="mr-1" /> New Quest
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterStatus(null)}
          className={`px-3 py-1 rounded text-xs font-display uppercase cursor-pointer transition-colors ${
            filterStatus === null ? 'bg-gold-400 text-ink-900' : 'bg-parchment-200 text-ink-500'
          }`}
        >
          All ({quests.length})
        </button>
        {(['active', 'completed', 'failed'] as const).map((status) => {
          const count = quests.filter((q) => q.status === status).length
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(filterStatus === status ? null : status)}
              className={`px-3 py-1 rounded text-xs font-display uppercase cursor-pointer transition-colors ${
                filterStatus === status ? 'bg-gold-400 text-ink-900' : 'bg-parchment-200 text-ink-500'
              }`}
            >
              {STATUS_LABELS[status]} ({count})
            </button>
          )
        })}
      </div>

      {/* Quest List */}
      {quests.length === 0 ? (
        <EmptyState
          icon={<Target size={48} />}
          title="No Quests"
          description="Track your party's quests and objectives."
          action={{ label: 'Add First Quest', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((quest) => (
            <Card key={quest.id}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg text-ink-900">{quest.title}</h3>
                  <Badge variant={STATUS_VARIANTS[quest.status]}>{STATUS_LABELS[quest.status]}</Badge>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {quest.status === 'active' && (
                    <>
                      <button
                        onClick={() => onUpdate(quest.id, { status: 'completed' })}
                        className="p-1 text-ink-300 hover:text-heal cursor-pointer"
                        title="Complete"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <button
                        onClick={() => onUpdate(quest.id, { status: 'failed' })}
                        className="p-1 text-ink-300 hover:text-danger cursor-pointer"
                        title="Failed"
                      >
                        <XCircle size={14} />
                      </button>
                    </>
                  )}
                  {quest.status !== 'active' && (
                    <button
                      onClick={() => onUpdate(quest.id, { status: 'active' })}
                      className="p-1 text-ink-300 hover:text-gold-500 cursor-pointer"
                      title="Reactivate"
                    >
                      <Circle size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(quest)}
                    className="p-1 text-ink-300 hover:text-ink-700 cursor-pointer"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(quest.id)}
                    className="p-1 text-ink-300 hover:text-danger cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {quest.description && (
                <p className="text-sm text-ink-700 mb-3 whitespace-pre-wrap">{quest.description}</p>
              )}

              {quest.objectives.length > 0 && (
                <div className="space-y-1">
                  {quest.objectives.map((obj, idx) => (
                    <label
                      key={idx}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={obj.completed}
                        onChange={() => toggleObjective(quest.id, idx)}
                        className="rounded border-parchment-400 accent-gold-500"
                      />
                      <span className={`text-sm ${obj.completed ? 'line-through text-ink-300' : 'text-ink-700'}`}>
                        {obj.text}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && onDelete(deleteTarget)}
        title="Delete Quest"
        message="Are you sure you want to delete this quest? This action cannot be undone."
      />

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingId(null); setObjectives([]) }}
        title={editingId ? 'Edit Quest' : 'New Quest'}
        size="md"
      >
        <form key={editingId ?? 'new'} onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="title"
            label="Quest Title"
            required
            defaultValue={editingQuest?.title ?? ''}
            placeholder="Rescue the princess..."
          />
          <Textarea
            name="description"
            label="Description"
            rows={3}
            defaultValue={editingQuest?.description ?? ''}
            placeholder="Quest details..."
          />

          {/* Objectives */}
          <div>
            <label className="block text-sm font-display uppercase text-ink-500 mb-2">Objectives</label>
            {objectives.map((obj, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-1">
                <span className="text-sm text-ink-700 flex-1">{obj.text}</span>
                <button
                  type="button"
                  onClick={() => setObjectives(objectives.filter((_, i) => i !== idx))}
                  className="p-1 text-ink-300 hover:text-danger cursor-pointer"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <div className="flex gap-2 mt-1">
              <input
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addObjective() } }}
                placeholder="Add objective..."
                className="flex-1 px-3 py-1.5 bg-parchment-50 border border-parchment-400 rounded font-body text-sm focus:outline-none focus:border-gold-400 text-ink-900"
              />
              <Button type="button" variant="secondary" size="sm" onClick={addObjective}>
                <Plus size={14} />
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full">
            {editingId ? 'Update Quest' : 'Create Quest'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
