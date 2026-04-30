import { useState, useEffect, type CSSProperties } from 'react'
import { X, Trash2 } from 'lucide-react'
import { useNetworkStore } from '../store/networkStore'
import type { PersonData, JobData, ContactMethod, JobType } from '../types'

type PanelMode = 'add-person' | 'add-job' | 'edit'

interface Props {
  mode: PanelMode
  nodeId?: string
  onClose: () => void
}

const inputStyle: CSSProperties = {
  width: '100%',
  background: '#1e293b',
  border: '1px solid #334155',
  color: '#e2e8f0',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
}

const emptyPerson: Omit<PersonData, 'nodeType'> = {
  name: '', company: '', contactMethod: 'linkedin',
  contactValue: '', lastContact: '', nextFollowUp: '', reminderNote: '', location: '',
}

const emptyJob: Omit<JobData, 'nodeType'> = {
  title: '', company: '', jobType: 'recommendation', date: '', notes: '',
}

export function NodePanel({ mode, nodeId, onClose }: Props) {
  const { nodes, addPerson, addJob, updateNode, deleteNode } = useNetworkStore()

  const existingNode = nodeId ? nodes.find((n) => n.id === nodeId) : null
  const isPerson = mode === 'add-person' || existingNode?.type === 'person'

  const [personForm, setPersonForm] = useState<Omit<PersonData, 'nodeType'>>(emptyPerson)
  const [jobForm, setJobForm] = useState<Omit<JobData, 'nodeType'>>(emptyJob)

  useEffect(() => {
    if (existingNode?.type === 'person') {
      const d = existingNode.data as PersonData
      setPersonForm({ name: d.name, company: d.company, contactMethod: d.contactMethod,
        contactValue: d.contactValue, lastContact: d.lastContact,
        nextFollowUp: d.nextFollowUp, reminderNote: d.reminderNote, location: d.location ?? '' })
    } else if (existingNode?.type === 'job') {
      const d = existingNode.data as JobData
      setJobForm({ title: d.title, company: d.company, jobType: d.jobType, date: d.date, notes: d.notes })
    }
  }, [nodeId])

  function handleSubmit() {
    if (mode === 'add-person') { addPerson(personForm); onClose() }
    else if (mode === 'add-job') { addJob(jobForm); onClose() }
    else if (mode === 'edit' && nodeId) {
      if (existingNode?.type === 'person') updateNode(nodeId, personForm)
      else if (existingNode?.type === 'job') updateNode(nodeId, jobForm)
      onClose()
    }
  }

  function handleDelete() {
    if (nodeId) { deleteNode(nodeId); onClose() }
  }

  const title = mode === 'add-person' ? 'Add Contact' : mode === 'add-job' ? 'Add Job' : 'Edit'

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-slate-900 border-l border-slate-700 shadow-2xl z-10 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <h2 className="text-white font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          {mode === 'edit' && (
            <button onClick={handleDelete} className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-950 transition-colors">
              <Trash2 size={16} />
            </button>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isPerson ? (
          <>
            <Field label="Name *">
              <input value={personForm.name} onChange={(e) => setPersonForm({ ...personForm, name: e.target.value })}
                style={inputStyle} placeholder="Jane Smith" />
            </Field>
            <Field label="Company">
              <input value={personForm.company} onChange={(e) => setPersonForm({ ...personForm, company: e.target.value })}
                style={inputStyle} placeholder="Acme Corp" />
            </Field>
            <Field label="Location">
              <input value={personForm.location} onChange={(e) => setPersonForm({ ...personForm, location: e.target.value })}
                style={inputStyle} placeholder="San Francisco, CA" />
            </Field>
            <Field label="Contact Method">
              <select value={personForm.contactMethod}
                onChange={(e) => setPersonForm({ ...personForm, contactMethod: e.target.value as ContactMethod })}
                style={inputStyle}>
                <option value="linkedin">LinkedIn</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Contact Value">
              <input value={personForm.contactValue} onChange={(e) => setPersonForm({ ...personForm, contactValue: e.target.value })}
                style={inputStyle} placeholder="linkedin.com/in/jane or jane@co.com" />
            </Field>
            <Field label="Last Contact">
              <input type="date" value={personForm.lastContact} onChange={(e) => setPersonForm({ ...personForm, lastContact: e.target.value })}
                style={inputStyle} />
            </Field>
            <Field label="Next Follow-up">
              <input type="date" value={personForm.nextFollowUp} onChange={(e) => setPersonForm({ ...personForm, nextFollowUp: e.target.value })}
                style={inputStyle} />
            </Field>
            <Field label="Reminder Note">
              <textarea value={personForm.reminderNote} onChange={(e) => setPersonForm({ ...personForm, reminderNote: e.target.value })}
                style={{ ...inputStyle, resize: 'none', height: 80 }} placeholder="Follow up on..." />
            </Field>
          </>
        ) : (
          <>
            <Field label="Job Title *">
              <input value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                style={inputStyle} placeholder="Software Engineer" />
            </Field>
            <Field label="Company">
              <input value={jobForm.company} onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                style={inputStyle} placeholder="Acme Corp" />
            </Field>
            <Field label="Type">
              <select value={jobForm.jobType} onChange={(e) => setJobForm({ ...jobForm, jobType: e.target.value as JobType })}
                style={inputStyle}>
                <option value="recommendation">Referral / Recommendation</option>
                <option value="application">Application</option>
                <option value="interview">Interview</option>
              </select>
            </Field>
            <Field label="Date">
              <input type="date" value={jobForm.date} onChange={(e) => setJobForm({ ...jobForm, date: e.target.value })}
                style={inputStyle} />
            </Field>
            <Field label="Notes">
              <textarea value={jobForm.notes} onChange={(e) => setJobForm({ ...jobForm, notes: e.target.value })}
                style={{ ...inputStyle, resize: 'none', height: 80 }} placeholder="Details..." />
            </Field>
          </>
        )}
      </div>

      <div className="p-4 border-t border-slate-700">
        <button onClick={handleSubmit}
          disabled={isPerson ? !personForm.name : !jobForm.title}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-2 rounded-lg transition-colors">
          {mode === 'edit' ? 'Save Changes' : 'Add'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  )
}
