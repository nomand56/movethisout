import type { ThemeConfig } from '../types'

export const DEFAULT_THEME: ThemeConfig = {
  id: '',
  brand_name: 'MoveThisOut',
  accent_color: '#E85D04',
  accent_hover_color: '#D45303',
  accent_soft_color: '#FFF4ED',
  ink_color: '#1A1A1A',
  ink_muted_color: '#6B7280',
  surface_muted_color: '#F5F5F7',
  mover_color: '#1E293B',
  header_color: '#1A1A1A',
  updated_at: '',
}

function pickColor(value: string | null | undefined, fallback: string): string {
  const v = value?.trim()
  if (v && isValidHex(v)) return v
  return fallback
}

/** Reject colors too light for body text or dark UI bars */
function pickReadableColor(
  value: string | null | undefined,
  fallback: string,
  maxLuminance = 0.85,
): string {
  const v = value?.trim()
  if (!v || !isValidHex(v)) return fallback
  if (hexLuminance(v) > maxLuminance) return fallback
  return v
}

function hexLuminance(hex: string): number {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function pickBrand(value: string | null | undefined, fallback: string): string {
  const v = value?.trim()
  return v && v.length > 0 ? v : fallback
}

export function normalizeTheme(row: Partial<ThemeConfig> | null | undefined): ThemeConfig {
  if (!row) return { ...DEFAULT_THEME }
  return {
    id: row.id ?? '',
    brand_name: pickBrand(row.brand_name, DEFAULT_THEME.brand_name),
    accent_color: pickColor(row.accent_color, DEFAULT_THEME.accent_color),
    accent_hover_color: pickColor(row.accent_hover_color, DEFAULT_THEME.accent_hover_color),
    accent_soft_color: pickColor(row.accent_soft_color, DEFAULT_THEME.accent_soft_color),
    ink_color: pickReadableColor(row.ink_color, DEFAULT_THEME.ink_color),
    ink_muted_color: pickReadableColor(row.ink_muted_color, DEFAULT_THEME.ink_muted_color, 0.75),
    surface_muted_color: pickColor(row.surface_muted_color, DEFAULT_THEME.surface_muted_color),
    mover_color: pickReadableColor(row.mover_color, DEFAULT_THEME.mover_color, 0.55),
    header_color: pickReadableColor(row.header_color, DEFAULT_THEME.header_color, 0.55),
    updated_at: row.updated_at ?? '',
  }
}

/** Convert #RRGGBB → "R G B" for Tailwind opacity support */
export function hexToRgbTriplet(hex: string): string | null {
  const h = hex.replace('#', '')
  if (h.length !== 6) return null
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  if ([r, g, b].some((n) => Number.isNaN(n))) return null
  return `${r} ${g} ${b}`
}

const RGB_VARS: { key: keyof ThemeConfig; cssVar: string }[] = [
  { key: 'accent_color', cssVar: '--theme-accent-rgb' },
  { key: 'accent_hover_color', cssVar: '--theme-accent-hover-rgb' },
  { key: 'accent_soft_color', cssVar: '--theme-accent-soft-rgb' },
  { key: 'ink_color', cssVar: '--theme-ink-rgb' },
  { key: 'ink_muted_color', cssVar: '--theme-ink-muted-rgb' },
  { key: 'surface_muted_color', cssVar: '--theme-surface-muted-rgb' },
  { key: 'mover_color', cssVar: '--theme-mover-rgb' },
  { key: 'header_color', cssVar: '--theme-header-rgb' },
]

export function applyTheme(raw: ThemeConfig) {
  const theme = normalizeTheme(raw)
  const root = document.documentElement

  for (const { key, cssVar } of RGB_VARS) {
    const triplet = hexToRgbTriplet(theme[key] as string)
    if (triplet) root.style.setProperty(cssVar, triplet)
    else root.style.removeProperty(cssVar)
  }

  let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
  }
  meta.content = theme.accent_color
}

export function isValidHex(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color.trim())
}

/** Dark bar color safe for white text (header, mover nav, CTAs) */
export function resolveBarColor(
  color: string | null | undefined,
  fallback: string = DEFAULT_THEME.header_color,
): string {
  const v = color?.trim()
  if (v && isValidHex(v) && hexLuminance(v) <= 0.55) return v
  return fallback
}

/** Apply defaults immediately — call before React mount */
applyTheme(DEFAULT_THEME)
