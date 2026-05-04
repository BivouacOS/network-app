import * as XLSX from 'xlsx'
import type { AppNode, PersonData } from '../types'

const DB_NAME = 'network-app-files'
const STORE_NAME = 'handles'
const HANDLE_KEY = 'excel'

export type ExcelSyncStatus = 'unlinked' | 'needs-permission' | 'linked' | 'syncing' | 'error'

export function isSupported(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function saveHandle(handle: FileSystemFileHandle): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadSavedHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY)
      req.onsuccess = () => resolve((req.result as FileSystemFileHandle) ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

export async function clearSavedHandle(): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(HANDLE_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch { /* ignore */ }
}

export async function pickExcelFile(): Promise<FileSystemFileHandle | null> {
  if (!isSupported()) return null
  try {
    // showOpenFilePicker is available in Chrome/Edge
    const [handle] = await (window as Window & { showOpenFilePicker: (opts: object) => Promise<FileSystemFileHandle[]> }).showOpenFilePicker({
      types: [{ description: 'Excel files', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }],
      multiple: false,
    })
    await saveHandle(handle)
    return handle
  } catch {
    return null // user cancelled
  }
}

export async function checkPermission(handle: FileSystemFileHandle): Promise<'granted' | 'prompt' | 'denied'> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (handle as any).queryPermission({ mode: 'readwrite' })
  } catch {
    return 'denied'
  }
}

export async function requestPermission(handle: FileSystemFileHandle): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (handle as any).requestPermission({ mode: 'readwrite' })
    return result === 'granted'
  } catch {
    return false
  }
}

export async function writeBackToExcel(nodes: AppNode[], handle: FileSystemFileHandle): Promise<void> {
  const file = await handle.getFile()
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const ref = ws['!ref']
  if (!ref) return

  const range = XLSX.utils.decode_range(ref)

  // Map header names → column indices
  const headers: Record<string, number> = {}
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: range.s.r, c })]
    if (cell?.v) headers[String(cell.v).toLowerCase().trim()] = c
  }

  const nameCol = headers['name']
  const lastContactCol = headers['last_contact']
  const reminderNoteCol = headers['reminder_note']
  if (nameCol === undefined) return

  // Build name → PersonData map
  const byName = new Map<string, PersonData>()
  for (const n of nodes) {
    if (n.type === 'person' && n.data) {
      const d = n.data as unknown as PersonData
      if (d.name) byName.set(d.name.toLowerCase().trim(), d)
    }
  }

  // Update cells in-place (preserves other cells/sheets/formatting)
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const nameCell = ws[XLSX.utils.encode_cell({ r, c: nameCol })]
    if (!nameCell?.v) continue
    const person = byName.get(String(nameCell.v).toLowerCase().trim())
    if (!person) continue

    if (lastContactCol !== undefined) {
      const addr = XLSX.utils.encode_cell({ r, c: lastContactCol })
      ws[addr] = { t: 's', v: person.lastContact || '' }
    }
    if (reminderNoteCol !== undefined) {
      const addr = XLSX.utils.encode_cell({ r, c: reminderNoteCol })
      ws[addr] = { t: 's', v: person.reminderNote || '' }
    }
  }

  const output = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  const writable = await handle.createWritable()
  await writable.write(output)
  await writable.close()
}
