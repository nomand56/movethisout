import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import Spinner from '../../components/ui/Spinner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, eachDayOfInterval, parseISO } from 'date-fns'

type Preset = 'today' | 'week' | 'month' | 'custom'

function getRange(preset: Preset, customStart: string, customEnd: string): { start: string; end: string } {
  const today = new Date()
  if (preset === 'today') return { start: format(today, 'yyyy-MM-dd'), end: format(today, 'yyyy-MM-dd') }
  if (preset === 'week') return { start: format(startOfWeek(today), 'yyyy-MM-dd'), end: format(endOfWeek(today), 'yyyy-MM-dd') }
  if (preset === 'month') return { start: format(startOfMonth(today), 'yyyy-MM-dd'), end: format(endOfMonth(today), 'yyyy-MM-dd') }
  return { start: customStart, end: customEnd }
}

export default function RevenuePage() {
  const [preset, setPreset] = useState<Preset>('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const { start, end } = getRange(preset, customStart, customEnd)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-revenue', start, end],
    queryFn: async () => {
      const { data } = await supabase
        .from('jobs')
        .select('quoted_price, platform_fee, mover_payout, created_at')
        .eq('status', 'completed')
        .gte('created_at', `${start}T00:00:00`)
        .lte('created_at', `${end}T23:59:59`)
      return data ?? []
    },
    enabled: !!start && !!end,
  })

  const gmv = (data ?? []).reduce((s, j) => s + (j.quoted_price ?? 0), 0)
  const fees = (data ?? []).reduce((s, j) => s + (j.platform_fee ?? 0), 0)
  const payouts = (data ?? []).reduce((s, j) => s + (j.mover_payout ?? 0), 0)
  const count = data?.length ?? 0
  const avg = count > 0 ? gmv / count : 0

  // Build daily chart data
  const chartData = start && end ? eachDayOfInterval({ start: parseISO(start), end: parseISO(end) }).map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const dayJobs = (data ?? []).filter((j) => j.created_at.startsWith(dayStr))
    return {
      date: format(day, 'dd MMM'),
      gmv: dayJobs.reduce((s, j) => s + (j.quoted_price ?? 0), 0),
      fees: dayJobs.reduce((s, j) => s + (j.platform_fee ?? 0), 0),
    }
  }) : []

  const PRESETS: { value: Preset; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'custom', label: 'Custom' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl uppercase text-jet">Revenue Dashboard</h1>

      {/* Preset selector */}
      <div className="flex gap-2 flex-wrap">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPreset(p.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${preset === p.value ? 'bg-haul text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-haul'}`}
          >
            {p.label}
          </button>
        ))}
        {preset === 'custom' && (
          <div className="flex gap-2">
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
              className="border-3 border-jet px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-haul" />
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
              className="border-3 border-jet px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-haul" />
          </div>
        )}
      </div>

      {isLoading && <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total GMV', value: `$${gmv.toFixed(2)}` },
          { label: 'Platform Fees', value: `$${fees.toFixed(2)}` },
          { label: 'Mover Payouts', value: `$${payouts.toFixed(2)}` },
          { label: 'Completed Jobs', value: count },
          { label: 'Avg Job Value', value: `$${avg.toFixed(2)}` },
        ].map(({ label, value }) => (
          <div key={label} className="card-yard p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="font-display text-2xl uppercase text-jet">{value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="card-yard p-6">
          <p className="text-sm font-medium text-gray-700 mb-4">Revenue by Day</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
              <Bar dataKey="gmv" fill="#f97316" name="GMV" radius={[4, 4, 0, 0]} />
              <Bar dataKey="fees" fill="#fb923c" name="Fees" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
