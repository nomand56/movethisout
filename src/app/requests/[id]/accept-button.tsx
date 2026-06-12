'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function AcceptButton({ requestId, userId }: { requestId: string; userId: string | null }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleAccept() {
    if (!userId) {
      router.push(`/login?redirectTo=/requests/${requestId}`)
      return
    }
    setLoading(true)
    const supabase = createClient()

    // Ensure volunteer profile exists
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await (supabase.from('profiles') as any).upsert(
        { id: user.id, full_name: user.user_metadata?.full_name ?? null },
        { onConflict: 'id', ignoreDuplicates: true }
      )
    }

    // Create job
    const { data: job, error } = await (supabase as any)
      .from('jobs')
      .insert({ request_id: requestId, volunteer_id: userId })
      .select()
      .single()

    if (error || !job) {
      alert('Failed to accept request. It may have been taken already.')
      setLoading(false)
      return
    }

    // Update request status
    await (supabase as any)
      .from('requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)

    router.push(`/job/${job.id}`)
  }

  return (
    <button
      onClick={handleAccept}
      disabled={loading}
      className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-indigo-700 disabled:opacity-60 transition"
    >
      {loading ? 'Accepting…' : '✅ Accept Help Request'}
    </button>
  )
}
