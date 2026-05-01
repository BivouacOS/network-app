import { useState, useRef } from 'react'
import { Upload, X, FileText, AlertCircle, Check } from 'lucide-react'
import { useNetworkStore } from '../store/networkStore'
import { parseCSV } from '../utils/csvParser'
import type { PersonData } from '../types'

interface Props {
  onClose: () => void
}

export function ImportModal({ onClose }: Props) {
  const { nodes, importPeople } = useNetworkStore()
  const [parsed, setParsed] = useState<Omit<PersonData, 'nodeType'>[] | null>(null)
  const [error, setError] = useState('')
  const [referredById, setReferredById] = useState('')
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const personNodes = nodes.filter((n) => n.type === 'person')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setFileName(file.name)
    try {
      const contacts = await parseCSV(file)
      setParsed(contacts)
    } catch {
      setError('Failed to parse CSV. Check format.')
    }
  }

  function handleImport() {
    if (!parsed) return
    importPeople(parsed, referredById || undefined)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-20 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="text-white font-semibold">Import Contacts from CSV</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-600 hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer transition-colors"
          >
            <Upload size={24} className="mx-auto text-slate-500 mb-2" />
            <p className="text-slate-400 text-sm">Click to select CSV file</p>
            {fileName && <p className="text-blue-400 text-xs mt-1 flex items-center justify-center gap-1"><FileText size={12} />{fileName}</p>}
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg p-3">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {parsed && (
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
                <Check size={14} /> {parsed.length} contact{parsed.length !== 1 ? 's' : ''} ready to import
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {parsed.slice(0, 10).map((p, i) => (
                  <div key={i} className="text-xs text-slate-400 truncate">
                    {p.name}{p.company ? ` — ${p.company}` : ''}
                  </div>
                ))}
                {parsed.length > 10 && <div className="text-xs text-slate-500">+{parsed.length - 10} more…</div>}
              </div>
            </div>
          )}

          {parsed && personNodes.length > 0 && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">Referred by (optional — draws connection lines)</label>
              <select value={referredById} onChange={(e) => setReferredById(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500">
                <option value="">— None —</option>
                {personNodes.map((n) => (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  <option key={n.id} value={n.id}>{(n.data as any).name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-500 font-semibold mb-1">Expected columns (flexible names):</p>
            <p className="text-xs text-slate-600 font-mono">
              name, company, location, contact_method, contact_value, connected_date, last_contact, reminder_note
            </p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-700 flex gap-3">
          <button onClick={onClose} className="flex-1 text-slate-400 hover:text-white border border-slate-600 hover:border-slate-500 py-2 rounded-lg transition-colors text-sm">
            Cancel
          </button>
          <button onClick={handleImport} disabled={!parsed}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-2 rounded-lg transition-colors text-sm">
            Import {parsed ? `(${parsed.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
