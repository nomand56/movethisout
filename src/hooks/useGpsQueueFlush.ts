import { useEffect } from 'react'
import { flushGpsQueue } from './useGpsQueue'

export function useGpsQueueFlush(insert: (jobId: string, lat: number, lng: number) => Promise<void>) {
  useEffect(() => {
    const flush = () => flushGpsQueue(insert)

    window.addEventListener('online', flush)

    let interval: ReturnType<typeof setInterval> | undefined
    if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
      interval = setInterval(flush, 30000)
    }

    flush()

    return () => {
      window.removeEventListener('online', flush)
      if (interval) clearInterval(interval)
    }
  }, [insert])
}
