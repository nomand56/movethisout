import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { applyTheme, DEFAULT_THEME, isValidHex, normalizeTheme } from '../../lib/theme'
import type { ThemeConfig } from '../../types'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { Palette, RotateCcw } from 'lucide-react'

const COLOR_FIELDS: { key: keyof ThemeConfig; label: string; hint?: string }[] = [
  { key: 'accent_color', label: 'Primary accent', hint: 'Buttons, links, highlights' },
  { key: 'accent_hover_color', label: 'Accent hover' },
  { key: 'accent_soft_color', label: 'Accent background', hint: 'Soft highlights' },
  { key: 'ink_color', label: 'Text primary' },
  { key: 'ink_muted_color', label: 'Text muted' },
  { key: 'surface_muted_color', label: 'Page background' },
  { key: 'mover_color', label: 'Mover portal', hint: 'Driver header & nav' },
  { key: 'header_color', label: 'Public header', hint: 'Marketing site top bar' },
]

function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink">{label}</label>
      {hint && <p className="text-xs text-ink-muted -mt-1">{hint}</p>}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isValidHex(value) ? value : '#E85D04'}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 rounded-lg border border-gray-200 cursor-pointer shrink-0"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="#E85D04" />
      </div>
    </div>
  )
}

function PreviewCard({ theme }: { theme: ThemeConfig }) {
  return (
    <div
      className="rounded-2xl border border-gray-200 overflow-hidden"
      style={{ background: theme.surface_muted_color }}
    >
      <div className="px-4 py-3 text-white text-sm font-bold" style={{ background: theme.header_color }}>
        {theme.brand_name}
      </div>
      <div className="p-4 flex flex-col gap-3">
        <p className="font-bold" style={{ color: theme.ink_color }}>Book a local move</p>
        <p className="text-sm" style={{ color: theme.ink_muted_color }}>Upfront price · Canada-wide</p>
        <button
          type="button"
          className="px-4 py-2.5 rounded-xl text-white font-semibold text-sm"
          style={{ background: theme.accent_color }}
        >
          See prices
        </button>
        <span
          className="inline-block self-start text-xs font-medium px-2 py-1 rounded-lg"
          style={{ background: theme.accent_soft_color, color: theme.accent_color }}
        >
          Open job
        </span>
        <div className="rounded-xl px-3 py-2 text-white text-xs font-medium" style={{ background: theme.mover_color }}>
          Mover portal preview
        </div>
      </div>
    </div>
  )
}

export default function AdminThemePage() {
  const qc = useQueryClient()
  const [form, setForm] = useState<Partial<ThemeConfig>>({})
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const { data: config, isLoading } = useQuery({
    queryKey: ['theme-config'],
    queryFn: async () => {
      const { data } = await supabase.from('theme_config').select('*').limit(1).single()
      return normalizeTheme(data as ThemeConfig)
    },
  })

  const effective = normalizeTheme({ ...config, ...form })

  const save = useMutation({
    mutationFn: async () => {
      if (!config?.id) throw new Error('Theme not configured — run migration 0011 in Supabase SQL Editor.')
      for (const { key } of COLOR_FIELDS) {
        const v = effective[key] as string
        if (!isValidHex(v)) throw new Error(`Invalid color for ${key}: use #RRGGBB format`)
      }
      const { error: updateError } = await supabase.from('theme_config').update({
        brand_name: effective.brand_name.trim() || DEFAULT_THEME.brand_name,
        accent_color: effective.accent_color,
        accent_hover_color: effective.accent_hover_color,
        accent_soft_color: effective.accent_soft_color,
        ink_color: effective.ink_color,
        ink_muted_color: effective.ink_muted_color,
        surface_muted_color: effective.surface_muted_color,
        mover_color: effective.mover_color,
        header_color: effective.header_color,
        updated_at: new Date().toISOString(),
      }).eq('id', config.id)
      if (updateError) throw updateError
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['theme-config'] })
      setForm({})
      setError('')
      setSaved(true)
      applyTheme(effective)
      setTimeout(() => setSaved(false), 3000)
    },
    onError: (err: Error) => setError(err.message),
  })

  const preview = () => {
    applyTheme(effective)
  }

  const resetForm = () => {
    setForm({})
    applyTheme(DEFAULT_THEME)
  }

  const resetAndSaveDefaults = useMutation({
    mutationFn: async () => {
      if (!config?.id) throw new Error('Theme table missing — run migration 0011')
      const { error: updateError } = await supabase.from('theme_config').update({
        brand_name: DEFAULT_THEME.brand_name,
        accent_color: DEFAULT_THEME.accent_color,
        accent_hover_color: DEFAULT_THEME.accent_hover_color,
        accent_soft_color: DEFAULT_THEME.accent_soft_color,
        ink_color: DEFAULT_THEME.ink_color,
        ink_muted_color: DEFAULT_THEME.ink_muted_color,
        surface_muted_color: DEFAULT_THEME.surface_muted_color,
        mover_color: DEFAULT_THEME.mover_color,
        header_color: DEFAULT_THEME.header_color,
        updated_at: new Date().toISOString(),
      }).eq('id', config.id)
      if (updateError) throw updateError
    },
    onSuccess: () => {
      setForm({})
      qc.invalidateQueries({ queryKey: ['theme-config'] })
      applyTheme(DEFAULT_THEME)
    },
    onError: (err: Error) => setError(err.message),
  })

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <Palette size={24} className="text-accent" />
            Brand &amp; theme
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Changes apply instantly for all users — no redeploy needed.
          </p>
        </div>
        {saved && <span className="text-sm font-medium text-green-600">Saved ✓</span>}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="card p-6 flex flex-col gap-5">
          <Input
            label="Brand name"
            value={effective.brand_name}
            onChange={(e) => setForm((f) => ({ ...f, brand_name: e.target.value }))}
          />

          {COLOR_FIELDS.map(({ key, label, hint }) => (
            <ColorField
              key={key}
              label={label}
              hint={hint}
              value={effective[key] as string}
              onChange={(v) => setForm((f) => ({ ...f, [key]: v }))}
            />
          ))}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={() => save.mutate()} loading={save.isPending}>
              Save theme
            </Button>
            <Button variant="secondary" onClick={preview}>
              Preview live
            </Button>
            <Button variant="ghost" onClick={() => resetAndSaveDefaults.mutate()} loading={resetAndSaveDefaults.isPending} className="gap-1">
              <RotateCcw size={16} />
              Reset defaults
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold text-ink-muted uppercase tracking-wide">Preview</p>
          <PreviewCard theme={effective} />
          <p className="text-xs text-ink-muted">
            Run <code className="bg-gray-100 px-1 rounded">scripts/full-setup.sql</code> once if save fails (migration 0011).
          </p>
        </div>
      </div>
    </div>
  )
}
