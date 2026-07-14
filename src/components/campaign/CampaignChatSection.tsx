import { useState, useRef, useEffect } from 'react'
import { Send, Trash2, MessageCircle } from 'lucide-react'
import { useCampaignMessages } from '@/hooks/useCampaignMessages'
import { useTypingIndicator } from '@/hooks/useTypingIndicator'
import { format } from 'date-fns'
import type { CampaignMember } from '@/lib/types/database'

interface CampaignChatSectionProps {
  campaignId: string
  userId: string
  members: CampaignMember[]
  memberNames: Record<string, string>
}

export function CampaignChatSection({ campaignId, userId, members, memberNames }: CampaignChatSectionProps) {
  const [activeThread, setActiveThread] = useState<string | null>(null) // null = group chat
  const [draft, setDraft] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const feedRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, deleteMessage } = useCampaignMessages(
    campaignId,
    activeThread,
    userId
  )

  const currentUserName = memberNames[userId] ?? 'Unknown'
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(campaignId, userId, currentUserName)

  const otherMembers = members.filter((m) => m.user_id !== userId)

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const content = draft.trim()
    if (!content) return
    setSendError(null)

    try {
      await sendMessage({
        campaign_id: campaignId,
        sender_id: userId,
        recipient_id: activeThread,
        content,
      })
      setDraft('')
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send message')
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-ink-900">Campaign Chat</h2>

      {/* Thread pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setActiveThread(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-display uppercase cursor-pointer transition-colors ${
            activeThread === null
              ? 'bg-gold-400 text-ink-900'
              : 'bg-parchment-200 text-ink-500 hover:bg-parchment-300'
          }`}
        >
          Group Chat
        </button>
        {otherMembers.map((m) => (
          <button
            key={m.user_id}
            onClick={() => setActiveThread(m.user_id)}
            className={`px-3 py-1.5 rounded-full text-xs font-display cursor-pointer transition-colors ${
              activeThread === m.user_id
                ? 'bg-gold-400 text-ink-900'
                : 'bg-parchment-200 text-ink-500 hover:bg-parchment-300'
            }`}
          >
            {memberNames[m.user_id] ?? 'Unknown'}
          </button>
        ))}
      </div>

      {/* Message feed */}
      <div
        ref={feedRef}
        className="h-96 overflow-y-auto border border-parchment-300 rounded-lg bg-parchment-50 p-4 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-ink-300">
            <MessageCircle size={32} className="mb-2" />
            <p className="text-sm">
              {activeThread === null ? 'No group messages yet.' : 'No messages in this thread yet.'}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === userId
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 ${
                    isOwn
                      ? 'bg-leather-700 text-parchment-100'
                      : 'bg-parchment-200 text-ink-900'
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs font-display text-gold-500 mb-0.5">
                      {memberNames[msg.sender_id] ?? msg.profiles?.display_name ?? 'Unknown'}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <span className={`text-[10px] ${isOwn ? 'text-parchment-400' : 'text-ink-300'}`}>
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </span>
                    {isOwn && (
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="text-parchment-400 hover:text-parchment-100 transition-colors cursor-pointer"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <p className="text-xs text-ink-400 italic px-1">
          {typingUsers.length === 1
            ? `${typingUsers[0].name} is typing...`
            : `${typingUsers.map((u) => u.name).join(', ')} are typing...`}
        </p>
      )}

      {sendError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-1.5">{sendError}</p>
      )}

      {/* Input area */}
      <form onSubmit={handleSend} className="flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            startTyping()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              stopTyping()
              handleSend(e)
            }
          }}
          placeholder={activeThread === null ? 'Message the group...' : 'Send a direct message...'}
          rows={2}
          className="flex-1 bg-parchment-50 border border-parchment-400 rounded-lg px-3 py-2 font-body text-sm text-ink-900 resize-none focus:outline-none focus:border-gold-400"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="p-2.5 rounded-lg bg-gold-500 text-white hover:bg-gold-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
