import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'
import { format } from 'date-fns'
import type { Message } from '../../types'

interface Props {
  jobId: string
  canSend: boolean
}

export default function ChatPanel({ jobId, canSend }: Props) {
  const { profile } = useAuthStore()
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', jobId],
    queryFn: async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true })
      return data as Message[]
    },
  })

  useEffect(() => {
    const ch = supabase
      .channel(`job-chat-${jobId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `job_id=eq.${jobId}` }, () => {
        qc.invalidateQueries({ queryKey: ['messages', jobId] })
      })
      .subscribe()
    return () => { ch.unsubscribe() }
  }, [jobId, qc])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages])

  useEffect(() => {
    if (!profile || !messages) return
    const hasUnread = messages.some((m) => m.sender_id !== profile.id && m.read_at === null)
    if (!hasUnread) return
    supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('job_id', jobId)
      .is('read_at', null)
      .neq('sender_id', profile.id)
      .then(() => { /* fire and forget */ })
  }, [messages, profile, jobId])

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!profile) return
      const content = text.trim()
      if (!content) return
      await supabase.from('messages').insert({ job_id: jobId, sender_id: profile.id, content })
    },
    onSuccess: () => {
      setText('')
      qc.invalidateQueries({ queryKey: ['messages', jobId] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || sendMessage.isPending) return
    setSending(true)
    sendMessage.mutate(undefined, { onSettled: () => setSending(false) })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 max-h-80 overflow-y-auto card-yard bg-concrete p-3">
        {isLoading && (
          <div className="flex justify-center py-6"><Spinner className="h-6 w-6" /></div>
        )}
        {!isLoading && (!messages || messages.length === 0) && (
          <p className="text-center text-sm text-gray-400 py-6">No messages yet.</p>
        )}
        {messages?.map((m) => {
          const own = m.sender_id === profile?.id
          return (
            <div key={m.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-3 py-2 text-sm border-3 ${
                  own
                    ? 'bg-haul text-white border-jet'
                    : 'bg-white text-jet border-jet'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={`text-[10px] mt-1 ${own ? 'text-white/70' : 'text-gray-400'}`}>
                  {format(new Date(m.created_at), 'dd MMM HH:mm')}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {canSend ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            maxLength={2000}
            className="flex-1 border-3 border-jet px-4 py-2.5 text-sm bg-white text-jet focus:outline-none focus:ring-2 focus:ring-haul"
          />
          <Button type="submit" size="sm" loading={sending} disabled={!text.trim()}>
            Send
          </Button>
        </form>
      ) : (
        messages && messages.length > 0 && (
          <p className="text-xs text-center text-gray-400">This conversation is now read-only.</p>
        )
      )}
    </div>
  )
}
