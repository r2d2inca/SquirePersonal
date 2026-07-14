import { useEffect, useCallback, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface TypingUser {
  userId: string
  name: string
}

export function useTypingIndicator(
  campaignId: string | undefined | null,
  userId: string,
  userName: string,
) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!campaignId) return

    const channel = supabase.channel(`typing:${campaignId}`, {
      config: { presence: { key: userId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users: TypingUser[] = []
        for (const [key, presences] of Object.entries(state)) {
          if (key === userId) continue
          const p = presences[0] as { typing?: boolean; name?: string } | undefined
          if (p?.typing) {
            users.push({ userId: key, name: (p.name as string) || 'Someone' })
          }
        }
        setTypingUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ typing: false, name: userName })
        }
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [campaignId, userId, userName])

  const startTyping = useCallback(() => {
    if (!channelRef.current) return

    channelRef.current.track({ typing: true, name: userName })

    // Auto-stop typing after 3 seconds of inactivity
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      channelRef.current?.track({ typing: false, name: userName })
    }, 3000)
  }, [userName])

  const stopTyping = useCallback(() => {
    if (!channelRef.current) return
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    channelRef.current.track({ typing: false, name: userName })
  }, [userName])

  return { typingUsers, startTyping, stopTyping }
}
