import { AIChatPanel } from '@/components/ai/AIChatPanel'
import type { AIMessage, Character, DmNote, DmSessionLog } from '@/lib/types/database'

interface DmAIChatPanelProps {
  messages: AIMessage[]
  isLoading: boolean
  onSendMessage: (message: string) => void
  onClear: () => void
}

export function DmAIChatPanel({ messages, isLoading, onSendMessage, onClear }: DmAIChatPanelProps) {
  return (
    <AIChatPanel
      messages={messages}
      isLoading={isLoading}
      onSendMessage={onSendMessage}
      onClear={onClear}
      mode="dm"
    />
  )
}
