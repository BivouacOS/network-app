import Papa from 'papaparse'
import type { PersonData } from '../types'

function normalizeKey(k: string): string {
  return k.toLowerCase().replace(/[\s_-]/g, '')
}

function parseDate(val: string): string {
  if (!val) return ''
  // Try MM/DD/YYYY → YYYY-MM-DD
  const mmddyyyy = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (mmddyyyy) {
    const [, m, d, y] = mmddyyyy
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  // Already YYYY-MM-DD or similar ISO
  return val
}

export function parseCSV(file: File): Promise<Omit<PersonData, 'nodeType'>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const contacts: Omit<PersonData, 'nodeType'>[] = []
        for (const row of results.data as Record<string, string>[]) {
          const r: Record<string, string> = {}
          for (const [k, v] of Object.entries(row)) {
            r[normalizeKey(k)] = v?.trim() ?? ''
          }

          const method = r['contactmethod'] ?? r['method'] ?? ''
          const validMethod = ['linkedin', 'email', 'phone', 'other'].includes(method.toLowerCase())
            ? (method.toLowerCase() as PersonData['contactMethod'])
            : 'other'

          const lastContact = parseDate(r['lastcontact'] ?? r['last'] ?? '')
          const d = new Date()
          const localToday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          const connectedDate = parseDate(r['connecteddate'] ?? r['connected'] ?? r['met'] ?? '') || lastContact || localToday

          const relationship = r['relationship'] ?? r['relation'] ?? ''
          const contactCategory = relationship ? 'personal' : 'professional'

          contacts.push({
            name: r['name'] ?? 'Unknown',
            contactCategory,
            company: r['company'] ?? '',
            relationship,
            contactMethod: validMethod,
            contactValue: r['contactvalue'] ?? r['contact'] ?? r['url'] ?? r['email'] ?? r['phone'] ?? '',
            connectedDate,
            lastContact,
            nextFollowUp: '',
            reminderNote: r['remindernote'] ?? r['reminder'] ?? r['notes'] ?? r['note'] ?? '',
            location: r['location'] ?? r['city'] ?? r['loc'] ?? '',
            followUpMode: 'auto',
            customIntervalDays: 30,
            interactionCount: 0,
          })
        }
        resolve(contacts)
      },
      error: reject,
    })
  })
}
