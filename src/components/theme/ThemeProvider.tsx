import { createContext, useContext, useEffect, ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, isSchemaMissingError } from '../../lib/supabase'
import { applyTheme, DEFAULT_THEME, normalizeTheme } from '../../lib/theme'
import type { ThemeConfig } from '../../types'

interface ThemeContextValue {
  theme: ThemeConfig
  loading: boolean
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  loading: false,
})

export function useTheme() {
  return useContext(ThemeContext)
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()

  const { data: theme = DEFAULT_THEME, isLoading, isError } = useQuery({
    queryKey: ['theme-config'],
    queryFn: async () => {
      const { data, error } = await supabase.from('theme_config').select('*').limit(1).maybeSingle()
      if (error && isSchemaMissingError(error)) return DEFAULT_THEME
      if (error) {
        console.warn('theme_config load failed, using defaults', error.message)
        return DEFAULT_THEME
      }
      return normalizeTheme(data as ThemeConfig | null)
    },
    staleTime: 30_000,
    retry: false,
  })

  useEffect(() => {
    applyTheme(isError ? DEFAULT_THEME : theme)
  }, [theme, isError])

  useEffect(() => {
    const ch = supabase
      .channel('theme-config-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'theme_config' }, () => {
        qc.invalidateQueries({ queryKey: ['theme-config'] })
      })
      .subscribe()
    return () => { ch.unsubscribe() }
  }, [qc])

  return (
    <ThemeContext.Provider value={{ theme: normalizeTheme(theme), loading: isLoading }}>
      {children}
    </ThemeContext.Provider>
  )
}
