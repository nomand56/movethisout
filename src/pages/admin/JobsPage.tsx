import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { StatusBadge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { format } from 'date-fns'
import type { Job, JobStatus } from '../../types'
import { Search } from 'lucide-react'

const STATUS_OPTS = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'claimed', label: 'Claimed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function AdminJobsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<JobStatus | ''>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [cancelJobId, setCancelJobId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['admin-jobs', statusFilter, dateFrom, dateTo],
    queryFn: async () => {
      let q = supabase
        .from('jobs')
        .select('*, requester:profiles!jobs_requester_id_fkey(full_name), mover:profiles!jobs_mover_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(200)
      if (statusFilter) q = q.eq('status', statusFilter)
      if (dateFrom) q = q.gte('scheduled_date', dateFrom)
      if (dateTo) q = q.lte('scheduled_date', dateTo)
      const { data } = await q
      return data as (Job & { requester: { full_name: string }, mover?: { full_name: string } })[]
    },
  })

  const filtered = (jobs ?? []).filter((j) => {
    if (!search) return true
    const s = search.toLowerCase()
    return j.requester?.full_name?.toLowerCase().includes(s) || j.mover?.full_name?.toLowerCase().includes(s) || j.id.toLowerCase().includes(s)
  })

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await supabase.from('jobs').update({ status: 'cancelled', cancel_reason: cancelReason }).eq('id', cancelJobId!)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-jobs'] }); setCancelJobId(null); setCancelReason('') },
  })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl uppercase text-jet">Job Management</h1>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name or job ID…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full border-3 border-jet pl-9 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-haul" />
        </div>
        <Select options={STATUS_OPTS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as JobStatus | '')} className="w-44" />
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="border-3 border-jet px-3 py-2 text-sm bg-white" placeholder="From" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="border-3 border-jet px-3 py-2 text-sm bg-white" placeholder="To" />
      </div>

      {isLoading && <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-200">
              <th className="text-left py-3 pr-4 font-medium">Job ID</th>
              <th className="text-left py-3 pr-4 font-medium">Date</th>
              <th className="text-left py-3 pr-4 font-medium">Requester</th>
              <th className="text-left py-3 pr-4 font-medium">Mover</th>
              <th className="text-left py-3 pr-4 font-medium">Route</th>
              <th className="text-left py-3 pr-4 font-medium">Price</th>
              <th className="text-left py-3 pr-4 font-medium">Status</th>
              <th className="text-left py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((job) => (
              <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 pr-4">
                  <Link to={`/admin/jobs/${job.id}`} className="text-haul hover:underline font-mono text-xs">{job.id.slice(0, 8)}…</Link>
                </td>
                <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{format(new Date(job.scheduled_date), 'dd MMM')}</td>
                <td className="py-3 pr-4 font-medium text-jet whitespace-nowrap">{job.requester?.full_name ?? '—'}</td>
                <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{job.mover?.full_name ?? '—'}</td>
                <td className="py-3 pr-4 text-gray-500 max-w-xs">
                  <Link to={`/admin/jobs/${job.id}`} className="truncate block hover:text-haul">{job.pickup_address?.split(',')[0]} → {job.dropoff_address?.split(',')[0]}</Link>
                </td>
                <td className="py-3 pr-4 text-jet whitespace-nowrap">{job.quoted_price ? `$${job.quoted_price.toFixed(2)}` : '—'}</td>
                <td className="py-3 pr-4"><StatusBadge status={job.status} /></td>
                <td className="py-3">
                  {job.status !== 'cancelled' && job.status !== 'completed' && (
                    <button onClick={() => setCancelJobId(job.id)} className="text-xs text-red-500 hover:underline">Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && <p className="text-center text-gray-400 py-12">No jobs found.</p>}
      </div>

      <Modal open={!!cancelJobId} onClose={() => setCancelJobId(null)} title="Cancel Job">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">Provide a reason for cancelling this job.</p>
          <Input label="Reason" placeholder="Enter reason…" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setCancelJobId(null)}>Back</Button>
            <Button variant="danger" disabled={!cancelReason.trim()} loading={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>Cancel Job</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
