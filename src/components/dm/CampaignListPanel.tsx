import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Plus, Crown, Copy, Check, Users, Trash2, Edit2, Archive } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { Campaign, CampaignMember } from '@/lib/types/database'

interface CampaignListPanelProps {
  campaigns: Campaign[]
  userId: string
  memberCounts: Record<string, number>
  onAdd: (campaign: { user_id: string; name: string; description: string; is_active: boolean }) => void
  onUpdate: (id: string, updates: { name?: string; description?: string; is_active?: boolean }) => void
  onDelete: (id: string) => void
  onSelect: (id: string) => void
}

export function CampaignListPanel({
  campaigns,
  userId,
  memberCounts,
  onAdd,
  onUpdate,
  onDelete,
  onSelect,
}: CampaignListPanelProps) {
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const name = form.get('name') as string
    const description = form.get('description') as string || ''

    if (editingId) {
      onUpdate(editingId, { name, description })
      setEditingId(null)
    } else {
      onAdd({ user_id: userId, name, description, is_active: true })
    }
    setShowForm(false)
  }

  function handleCopyCode(campaign: Campaign) {
    navigator.clipboard.writeText(campaign.invite_code)
    setCopiedId(campaign.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const editingCampaign = editingId ? campaigns.find((c) => c.id === editingId) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink-900">Campaigns</h2>
        <Button onClick={() => navigate('/new-campaign')} size="sm">
          <Plus size={14} className="mr-1" /> New Campaign
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          icon={<Crown size={48} />}
          title="No Campaigns"
          description="Create your first campaign to start managing your party and sessions."
          action={{ label: 'Create Campaign', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className={`cursor-pointer hover:border-gold-400 transition-colors ${
                !campaign.is_active ? 'opacity-60' : ''
              }`}
            >
              <div onClick={() => onSelect(campaign.id)} className="cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Crown size={16} className="text-gold-500" />
                    <h3 className="font-display text-lg text-ink-900">{campaign.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setEditingId(campaign.id); setShowForm(true) }}
                      className="p-1 text-ink-300 hover:text-ink-700 transition-colors cursor-pointer"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => onUpdate(campaign.id, { is_active: !campaign.is_active })}
                      className="p-1 text-ink-300 hover:text-ink-700 transition-colors cursor-pointer"
                      title={campaign.is_active ? 'Archive' : 'Restore'}
                    >
                      <Archive size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(campaign.id)}
                      className="p-1 text-ink-300 hover:text-danger transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {campaign.description && (
                  <p className="text-sm text-ink-500 mb-3 line-clamp-2">{campaign.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-parchment-300">
                <div className="flex items-center gap-1 text-xs text-ink-500">
                  <Users size={12} />
                  {memberCounts[campaign.id] ?? 0} members
                </div>
                <button
                  onClick={() => handleCopyCode(campaign)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gold-100 border border-gold-300 rounded-full text-xs font-mono text-ink-900 hover:bg-gold-200 transition-colors cursor-pointer"
                >
                  {copiedId === campaign.id ? (
                    <>
                      <Check size={12} className="text-success" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={12} /> {campaign.invite_code}
                    </>
                  )}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && onDelete(deleteTarget)}
        title="Delete Campaign"
        message="Are you sure you want to delete this campaign? All associated data will be lost. This action cannot be undone."
      />

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingId(null) }}
        title={editingId ? 'Edit Campaign' : 'New Campaign'}
        size="md"
      >
        <form key={editingId ?? 'new'} onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="name"
            label="Campaign Name"
            required
            defaultValue={editingCampaign?.name ?? ''}
            placeholder="e.g. Curse of Strahd"
          />
          <Textarea
            name="description"
            label="Description (optional)"
            rows={3}
            defaultValue={editingCampaign?.description ?? ''}
            placeholder="A brief description of your campaign..."
          />
          <Button type="submit" className="w-full">
            {editingId ? 'Update Campaign' : 'Create Campaign'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
