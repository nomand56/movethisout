import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Search, ShieldOff, ShieldCheck } from 'lucide-react'
import { format } from 'date-fns'
import type { Profile } from '../../types'

export default function AdminUsersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [actionUser, setActionUser] = useState<Profile | null>(null)

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(500)
      return data as Profile[]
    },
  })

  const filtered = (users ?? []).filter((u) => {
    if (!search) return true
    const s = search.toLowerCase()
    return u.full_name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.phone.includes(s)
  })

  const toggleSuspend = useMutation({
    mutationFn: async (user: Profile) => {
      const newState = !user.is_suspended
      await supabase.from('profiles').update({ is_suspended: newState }).eq('id', user.id)
      if (newState) {
        await supabase.auth.admin.signOut(user.id)
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); setActionUser(null) },
  })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 pl-9 pr-4 py-3 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {isLoading && <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-200 dark:border-gray-800">
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
              <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="py-3 pr-4 font-medium text-gray-900 dark:text-gray-100">{user.full_name}</td>
                <td className="py-3 pr-4 text-gray-500">{user.email}</td>
                <td className="py-3 pr-4 text-gray-500">{user.phone}</td>
                <td className="py-3 pr-4 capitalize text-gray-500">{user.role}</td>
                <td className="py-3 pr-4 text-gray-400">{format(new Date(user.created_at), 'dd MMM yy')}</td>
                <td className="py-3">
                  {user.is_suspended ? (
                    <button
                      onClick={() => setActionUser(user)}
                      className="flex items-center gap-1 text-xs text-green-600 hover:underline"
                    >
                      <ShieldCheck size={12} />Reinstate
                    </button>
                  ) : (
                    <button
                      onClick={() => setActionUser(user)}
                      className="flex items-center gap-1 text-xs text-red-500 hover:underline"
                    >
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
