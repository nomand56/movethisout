import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Modal from '../../components/ui/Modal'
import { Search, ShieldOff, ShieldCheck } from 'lucide-react'
import { format } from 'date-fns'
import type { Profile } from '../../types'

export default function AdminUsersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [actionUser, setActionUser] = useState<Profile | null>(null)
  const [detailUser, setDetailUser] = useState<Profile | null>(null)

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(500)
      return data as Profile[]
    },
  })

  const { data: userDetail } = useQuery({
    queryKey: ['admin-user-detail', detailUser?.id],
    queryFn: async () => {
      const [{ count: jobCount }, { data: moverProfile }] = await Promise.all([
        supabase.from('jobs').select('id', { count: 'exact', head: true }).or(`requester_id.eq.${detailUser!.id},mover_id.eq.${detailUser!.id}`),
        detailUser!.role === 'mover'
          ? supabase.from('mover_profiles').select('avg_rating, total_jobs, status, vehicle_type').eq('id', detailUser!.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ])
      return { jobCount: jobCount ?? 0, moverProfile }
    },
    enabled: !!detailUser,
  })

  const filtered = (users ?? []).filter((u) => {
    if (!search) return true
    const s = search.toLowerCase()
    return u.full_name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.phone.includes(s)
  })

  const toggleSuspend = useMutation({
    mutationFn: async (user: Profile) => {
      const suspend = !user.is_suspended
      const res = await supabase.functions.invoke('admin-suspend-user', {
        body: { user_id: user.id, suspend },
      })
      if (res.error || res.data?.error) throw new Error(res.data?.error ?? 'Failed')
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); setActionUser(null) },
  })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl uppercase text-jet">User Management</h1>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search by name, email, or phone…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full border-3 border-jet pl-9 pr-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-haul" />
      </div>

      {isLoading && <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-200">
              <th className="text-left py-3 pr-4 font-medium">Name</th>
              <th className="text-left py-3 pr-4 font-medium">Email</th>
              <th className="text-left py-3 pr-4 font-medium">Phone</th>
              <th className="text-left py-3 pr-4 font-medium">Role</th>
              <th className="text-left py-3 pr-4 font-medium">Joined</th>
              <th className="text-left py-3 font-medium">Status / Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => setDetailUser(user)}>
                <td className="py-3 pr-4 font-medium text-jet">{user.full_name}</td>
                <td className="py-3 pr-4 text-gray-500">{user.email}</td>
                <td className="py-3 pr-4 text-gray-500">{user.phone}</td>
                <td className="py-3 pr-4 capitalize text-gray-500">{user.role}</td>
                <td className="py-3 pr-4 text-gray-400">{format(new Date(user.created_at), 'dd MMM yy')}</td>
                <td className="py-3" onClick={(e) => e.stopPropagation()}>
                  {user.is_suspended ? (
                    <button onClick={() => setActionUser(user)} className="flex items-center gap-1 text-xs text-green-600 hover:underline">
                      <ShieldCheck size={12} />Reinstate
                    </button>
                  ) : (
                    <button onClick={() => setActionUser(user)} className="flex items-center gap-1 text-xs text-red-500 hover:underline">
                      <ShieldOff size={12} />Suspend
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && <p className="text-center text-gray-400 py-12">No users found.</p>}
      </div>

      <Modal open={!!detailUser} onClose={() => setDetailUser(null)} title={detailUser?.full_name ?? 'User'}>
        {detailUser && (
          <div className="flex flex-col gap-3 text-sm">
            <div><span className="text-gray-500">Email:</span> {detailUser.email}</div>
            <div><span className="text-gray-500">Phone:</span> {detailUser.phone}</div>
            <div><span className="text-gray-500">Role:</span> <span className="capitalize">{detailUser.role}</span></div>
            <div><span className="text-gray-500">Joined:</span> {format(new Date(detailUser.created_at), 'dd MMM yyyy')}</div>
            <div><span className="text-gray-500">Jobs:</span> {userDetail?.jobCount ?? '…'}</div>
            {userDetail?.moverProfile && (
              <>
                <div><span className="text-gray-500">Mover status:</span> <span className="capitalize">{userDetail.moverProfile.status}</span></div>
                <div><span className="text-gray-500">Rating:</span> {userDetail.moverProfile.avg_rating?.toFixed(1) ?? '—'} ({userDetail.moverProfile.total_jobs} jobs)</div>
                <div><span className="text-gray-500">Vehicle:</span> <span className="capitalize">{userDetail.moverProfile.vehicle_type?.replace('_', ' ')}</span></div>
              </>
            )}
            {detailUser.is_suspended && <p className="text-red-600 font-medium">Account suspended</p>}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!actionUser}
        onClose={() => setActionUser(null)}
        onConfirm={() => actionUser && toggleSuspend.mutate(actionUser)}
        title={actionUser?.is_suspended ? 'Reinstate User?' : 'Suspend User?'}
        message={
          actionUser?.is_suspended
            ? `Reinstate ${actionUser?.full_name}? They will be able to log in again.`
            : `Suspend ${actionUser?.full_name}? Their active session will be invalidated.`
        }
        confirmLabel={actionUser?.is_suspended ? 'Reinstate' : 'Suspend'}
        loading={toggleSuspend.isPending}
        danger={!actionUser?.is_suspended}
      />
    </div>
  )
}
