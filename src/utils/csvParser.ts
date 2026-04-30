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

          contacts.push({
            name: r['name'] ?? 'Unknown',
            company: r['company'] ?? '',
            contactMethod: validMethod,
            contactValue: r['contactvalue'] ?? r['contact'] ?? r['url'] ?? r['email'] ?? r['phone'] ?? '',
            lastContact: parseDate(r['lastcontact'] ?? r['last'] ?? ''),
            nextFollowUp: parseDate(r['nextfollowup'] ?? r['followup'] ?? r['next'] ?? ''),
            reminderNote: r['remindernote'] ?? r['reminder'] ?? r['notes'] ?? r['note'] ?? '',
            location: r['location'] ?? r['city'] ?? r['loc'] ?? '',
          })
        }
        resolve(contacts)
      },
      error: reject,
    })
  })
}
