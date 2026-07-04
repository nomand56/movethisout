import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { format } from 'date-fns'
import { CheckCircle, XCircle, FileText } from 'lucide-react'

export default function ApprovalQueuePage() {
  const qc = useQueryClient()
  const { profile } = useAuthStore()
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  const { data: applications, isLoading } = useQuery({
    queryKey: ['pending-movers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('mover_profiles')
        .select('*, profile:profiles!inner(*)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
      return data ?? []
    },
  })

  const actionMutation = useMutation({
    mutationFn: async ({ mover_id, action, reason }: { mover_id: string; action: 'approve' | 'reject'; reason?: string }) => {
      const res = await supabase.functions.invoke('approve-mover', { body: { mover_id, action, reason } })
      if (!res.error && !res.data?.error) return

      if (profile?.role !== 'admin') throw new Error(res.data?.error ?? 'Could not update mover')

      const newStatus = action === 'approve' ? 'active' : 'suspended'
      const { error } = await supabase.from('mover_profiles').update({ status: newStatus }).eq('id', mover_id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-movers'] })
      setRejectId(null)
      setReason('')
    },
  })

  const getDocUrl = async (path: string) => {
    const { data } = await supabase.storage.from('mover-documents').createSignedUrl(path, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl uppercase text-jet">Mover Approvals</h1>
      <p className="text-sm text-gray-500">{applications?.length ?? 0} pending application(s)</p>

      {applications?.length === 0 && (
        <div className="text-center py-16 text-gray-400">All caught up — no pending applications.</div>
      )}

      <div className="flex flex-col gap-4">
        {applications?.map((app: any) => (
          <div key={app.id} className="card-yard p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-jet">{app.profile.full_name}</p>
                <p className="text-sm text-gray-500">{app.profile.email} · {app.profile.phone}</p>
                <p className="text-xs text-gray-400 mt-0.5">Applied {format(new Date(app.created_at), 'dd MMM yyyy')}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  onClick={() => actionMutation.mutate({ mover_id: app.id, action: 'approve' })}
                  loading={actionMutation.isPending}
                >
                  <CheckCircle size={14} className="mr-1" />Approve
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setRejectId(app.id)}
                >
                  <XCircle size={14} className="mr-1" />Reject
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 text-xs text-gray-500 border-t border-gray-100 pt-4">
              <div>
                <p className="font-medium">Vehicle</p>
                <p className="text-jet capitalize">{app.vehicle_type.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="font-medium">Capacity</p>
                <p className="text-jet">{app.vehicle_capacity} m³</p>
              </div>
              <div>
                <p className="font-medium">Service radius</p>
                <p className="text-jet">{app.service_radius} km</p>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              {app.licence_url && (
                <button onClick={() => getDocUrl(app.licence_url)} className="flex items-center gap-1 text-xs text-haul hover:underline">
                  <FileText size={12} />Driver's Licence
                </button>
              )}
              {app.registration_url && (
                <button onClick={() => getDocUrl(app.registration_url)} className="flex items-center gap-1 text-xs text-haul hover:underline">
                  <FileText size={12} />Vehicle Registration
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!rejectId} onClose={() => setRejectId(null)} title="Reject Application">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">Provide a reason for rejection. This will be emailed to the applicant.</p>
          <Input
            label="Rejection reason"
            placeholder="e.g. Incomplete documents, vehicle does not meet requirements"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setRejectId(null)}>Cancel</Button>
            <Button
              variant="danger"
              disabled={!reason.trim()}
              loading={actionMutation.isPending}
              onClick={() => rejectId && actionMutation.mutate({ mover_id: rejectId, action: 'reject', reason })}
            >
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
