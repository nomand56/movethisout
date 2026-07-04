export async function queueGpsEvent(jobId: string, lat: number, lng: number) {
  const db = await openDb()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).add({ jobId, lat, lng, ts: Date.now() })
  await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error) })
  db.close()
}

export async function flushGpsQueue(
  insert: (jobId: string, lat: number, lng: number) => Promise<void>,
): Promise<number> {
  const db = await openDb()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const all = await new Promise<{ id: number; jobId: string; lat: number; lng: number }[]>((res, rej) => {
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => res(req.result)
    req.onerror = () => rej(req.error)
  })
  db.close()

  let flushed = 0
  for (const item of all) {
    try {
      await insert(item.jobId, item.lat, item.lng)
      const db2 = await openDb()
      const tx2 = db2.transaction(STORE_NAME, 'readwrite')
      tx2.objectStore(STORE_NAME).delete(item.id)
      await new Promise<void>((res) => { tx2.oncomplete = () => res() })
      db2.close()
      flushed++
    } catch {
      break
    }
  }
  return flushed
}

const DB_NAME = 'movethisout-gps'
const STORE_NAME = 'queue'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
