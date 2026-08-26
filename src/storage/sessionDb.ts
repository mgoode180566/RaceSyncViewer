import type { ParsedSession } from '../types'

const DB = 'racesync'
const STORE = 'sessions'

const openDb = () => new Promise<IDBDatabase>((resolve, reject) => {
  const req = indexedDB.open(DB, 1)
  req.onupgradeneeded = () => {
    if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'filename' })
  }
  req.onsuccess = () => resolve(req.result)
  req.onerror = () => reject(req.error)
})

export async function saveSession(session: ParsedSession) {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(session)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function listStoredSessions(): Promise<ParsedSession[]> {
  const db = await openDb()
  const result = await new Promise<ParsedSession[]>((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result as ParsedSession[])
    req.onerror = () => reject(req.error)
  })
  db.close()
  return result
}
