import { useRef, useCallback } from 'react'

export function useWakeLock() {
  const lockRef = useRef<WakeLockSentinel | null>(null)

  const request = useCallback(async () => {
    if (!('wakeLock' in navigator)) return
    try {
      lockRef.current = await (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } }).wakeLock.request('screen')
    } catch {
      // WakeLock not available or permission denied — silently continue
    }
  }, [])

  const release = useCallback(async () => {
    if (lockRef.current) {
      await lockRef.current.release()
      lockRef.current = null
    }
  }, [])

  return { request, release }
}
