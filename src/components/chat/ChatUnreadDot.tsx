import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

interface Props {
  jobId: string
}

export default function ChatUnreadDot({ jobId }: Props) {
  const { profile } = useAuthStore()

  const { data: count } = useQuery({
    queryKey: ['messages-unread-count', jobId, profile?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('job_id', jobId)
        .is('read_at', null)
        .neq('sender_id', profile!.id)
      return count ?? 0
    },
    enabled: !!profile,
    staleTime: 30000,
  })

  if (!count) return null

  return <span className="h-2 w-2 rounded-full bg-red-500" />
}
