import { useState, useEffect, type CSSProperties } from 'react'
import { X, Trash2, CheckCircle2, Circle, Mail, Phone, ExternalLink } from 'lucide-react'
import { buildContactUrl } from '../utils/contactHelpers'
import { useNetworkStore } from '../store/networkStore'
import type { PersonData, JobData, ContactMethod, JobType, FollowUpMode, ContactCategory, RelationshipType } from '../types'

const RELATIONSHIP_OPTIONS: RelationshipType[] = ['Family','Friend','Partner','Mentor','Mentee','Classmate','Neighbor','Acquaintance','Other']
import {
  getMilestoneStatus,
  computeNextFollowUp,
  formatDate,
  formatDays,
  parseReminderFollowUp,
} from '../utils/dateHelpers'

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

function getToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function emptyPerson(): Omit<PersonData, 'nodeType'> {
  return {
    name: '', contactCategory: 'professional', company: '', relationship: '',
    contactMethod: 'linkedin', contactValue: '',
    connectedDate: getToday(), lastContact: '',
    nextFollowUp: '', reminderNote: '', location: '',
    followUpMode: 'auto', customIntervalDays: 30, interactionCount: 0,
  }
}

const emptyJob: Omit<JobData, 'nodeType'> = {
  title: '', company: '', jobType: 'recommendation', date: '', notes: '',
}

export function NodePanel({ mode, nodeId, onClose }: Props) {
  const { nodes, addPerson, addJob, updateNode, deleteNode } = useNetworkStore()

  const existingNode = nodeId ? nodes.find((n) => n.id === nodeId) : null
  const isPerson = mode === 'add-person' || existingNode?.type === 'person'

  const [personForm, setPersonForm] = useState<Omit<PersonData, 'nodeType'>>(emptyPerson())
  const [jobForm, setJobForm] = useState<Omit<JobData, 'nodeType'>>(emptyJob)
  const [showContactedToday, setShowContactedToday] = useState(false)
  const [todayNote, setTodayNote] = useState('')

  useEffect(() => {
    if (existingNode?.type === 'person') {
      const d = existingNode.data as PersonData
      setPersonForm({
        name: d.name,
        contactCategory: d.contactCategory || 'professional',
        company: d.company,
        relationship: d.relationship || '',
        contactMethod: d.contactMethod,
        contactValue: d.contactValue,
        connectedDate: d.connectedDate || d.lastContact || getToday(),
        lastContact: d.lastContact,
        nextFollowUp: d.nextFollowUp, reminderNote: d.reminderNote,
        location: d.location ?? '',
        followUpMode: d.followUpMode || 'auto',
        customIntervalDays: d.customIntervalDays ?? 30,
        interactionCount: d.interactionCount ?? 0,
      })
    } else if (existingNode?.type === 'job') {
      const d = existingNode.data as JobData
      setJobForm({ title: d.title, company: d.company, jobType: d.jobType, date: d.date, notes: d.notes })
    }
  }, [nodeId])

  function handleSubmit() {
    if (mode === 'add-person') {
      const fromNote = parseReminderFollowUp(personForm.reminderNote)
      const computed = fromNote ?? computeNextFollowUp(
        personForm.connectedDate, personForm.lastContact,
        personForm.followUpMode, personForm.customIntervalDays,
      )
      addPerson({ ...personForm, nextFollowUp: computed })
      onClose()
    } else if (mode === 'add-job') {
      addJob(jobForm); onClose()
    } else if (mode === 'edit' && nodeId) {
      if (existingNode?.type === 'person') {
        const prevData = existingNode.data as PersonData
        const lastContactChanged = !!personForm.lastContact && personForm.lastContact !== prevData.lastContact
        const fromNote = parseReminderFollowUp(personForm.reminderNote)
        const computed = fromNote ?? computeNextFollowUp(
          personForm.connectedDate, personForm.lastContact,
          personForm.followUpMode, personForm.customIntervalDays,
        )
        updateNode(nodeId, {
          ...personForm,
          nextFollowUp: computed,
          interactionCount: (prevData.interactionCount ?? 0) + (lastContactChanged ? 1 : 0),
        })
      } else if (existingNode?.type === 'job') {
        updateNode(nodeId, jobForm)
      }
      onClose()
    }
  }

  function handleDelete() {
    if (nodeId) { deleteNode(nodeId); onClose() }
  }

  function handleContactedToday() {
    if (!nodeId || existingNode?.type !== 'person') return
    const today = getToday()
    const prevData = existingNode.data as PersonData
    const newFollowUp = computeNextFollowUp(
      prevData.connectedDate, today,
      prevData.followUpMode || 'auto', prevData.customIntervalDays ?? 30,
    )
    updateNode(nodeId, {
      lastContact: today,
      interactionCount: (prevData.interactionCount ?? 0) + 1,
      nextFollowUp: newFollowUp,
      ...(todayNote.trim() ? { reminderNote: todayNote.trim() } : {}),
    })
    onClose()
  }

  const title = mode === 'add-person' ? 'Add Contact' : mode === 'add-job' ? 'Add Job' : 'Edit'

  return (
    <div className="absolute right-0 top-0 h-full w-80 z-10 flex flex-col"
      style={{ background: 'rgba(2, 4, 9, 0.88)', borderLeft: '1px solid rgba(147, 197, 253, 0.12)', backdropFilter: 'blur(16px)' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(147, 197, 253, 0.1)' }}>
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
            {mode === 'edit' && personForm.contactValue && (
              <ContactLink method={personForm.contactMethod} value={personForm.contactValue} />
            )}
            <Field label="Type">
              <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                {(['professional', 'personal'] as ContactCategory[]).map((cat) => (
                  <button key={cat} onClick={() => setPersonForm({ ...personForm, contactCategory: cat })}
                    style={{
                      flex: 1, padding: '5px 0', borderRadius: 6, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                      background: personForm.contactCategory === cat ? '#1d4ed8' : '#1e293b',
                      color: personForm.contactCategory === cat ? '#fff' : '#64748b',
                    }}>
                    {cat === 'professional' ? 'Professional' : 'Personal'}
                  </button>
                ))}
              </div>
            </Field>

            {personForm.contactCategory === 'professional' ? (
              <Field label="Company">
                <input value={personForm.company} onChange={(e) => setPersonForm({ ...personForm, company: e.target.value })}
                  style={inputStyle} placeholder="Acme Corp" />
              </Field>
            ) : (
              <Field label="Relationship">
                <select value={personForm.relationship}
                  onChange={(e) => setPersonForm({ ...personForm, relationship: e.target.value as RelationshipType })}
                  style={inputStyle}>
                  <option value="">— Select —</option>
                  {RELATIONSHIP_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
            )}
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
            <Field label="Date Connected">
              <input type="date" value={personForm.connectedDate}
                onChange={(e) => setPersonForm({ ...personForm, connectedDate: e.target.value })}
                style={inputStyle} />
            </Field>
            <Field label="Last Contact">
              <input type="date" value={personForm.lastContact}
                onChange={(e) => setPersonForm({ ...personForm, lastContact: e.target.value })}
                style={inputStyle} />
            </Field>

            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 500 }}>
                Follow-up Schedule
              </label>
              <FollowUpScheduler
                connectedDate={personForm.connectedDate}
                lastContact={personForm.lastContact}
                mode={personForm.followUpMode}
                customIntervalDays={personForm.customIntervalDays}
                onChange={(mode, days) => setPersonForm({ ...personForm, followUpMode: mode, customIntervalDays: days })}
              />
            </div>

            <Field label="Reminder Note">
              <textarea value={personForm.reminderNote} onChange={(e) => setPersonForm({ ...personForm, reminderNote: e.target.value })}
                style={{ ...inputStyle, resize: 'none', height: 72 }} placeholder="Follow up on..." />
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
                <option value="dead_end">Dead End</option>
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

      <div className="p-4 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(147, 197, 253, 0.1)' }}>
        {mode === 'edit' && isPerson && (
          showContactedToday ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <textarea
                value={todayNote}
                onChange={e => setTodayNote(e.target.value)}
                placeholder="What happened? (optional)"
                rows={3}
                style={{ ...inputStyle, resize: 'none' }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={handleContactedToday}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: '#065f46', border: '1px solid #059669', color: '#6ee7b7', cursor: 'pointer',
                  }}
                >
                  Confirm ✦
                </button>
                <button
                  onClick={() => { setShowContactedToday(false); setTodayNote('') }}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 13,
                    background: 'transparent', border: '1px solid #334155', color: '#64748b', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowContactedToday(true)}
              style={{
                width: '100%', padding: '7px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'rgba(6, 95, 70, 0.3)', border: '1px solid rgba(5, 150, 105, 0.4)',
                color: '#6ee7b7', cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(6,95,70,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(6,95,70,0.3)')}
            >
              Contacted Today ✦
            </button>
          )
        )}
        <button onClick={handleSubmit}
          disabled={isPerson ? !personForm.name : !jobForm.title}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-2 rounded-lg transition-colors">
          {mode === 'edit' ? 'Save Changes' : 'Add'}
        </button>
      </div>
    </div>
  )
}

interface SchedulerProps {
  connectedDate: string
  lastContact: string
  mode: FollowUpMode
  customIntervalDays: number
  onChange: (mode: FollowUpMode, days: number) => void
}

const PRESET_DAYS = [7, 14, 30, 60, 90, 180]

function FollowUpScheduler({ connectedDate, lastContact, mode, customIntervalDays, onChange }: SchedulerProps) {
  const milestones = getMilestoneStatus(connectedDate)
  const allPast = milestones.length > 0 && milestones.every((m) => m.done)

  const nextCustom = mode === 'custom' && lastContact
    ? computeNextFollowUp('', lastContact, 'custom', customIntervalDays)
    : ''

  return (
    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 12 }}>
      {/* Toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {(['auto', 'custom'] as FollowUpMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onChange(m, customIntervalDays)}
            style={{
              flex: 1, padding: '5px 0', borderRadius: 6, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: mode === m ? '#1d4ed8' : '#1e293b',
              color: mode === m ? '#fff' : '#64748b',
            }}
          >
            {m === 'auto' ? 'Auto' : 'Custom'}
          </button>
        ))}
      </div>

      {mode === 'auto' ? (
        <div>
          {!connectedDate ? (
            <p style={{ color: '#475569', fontSize: 12, margin: 0 }}>Set a connected date above to enable auto schedule.</p>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {milestones.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {m.done
                      ? <CheckCircle2 size={16} color="#22c55e" />
                      : <Circle size={16} color="#334155" />
                    }
                    <div>
                      <div style={{ fontSize: 12, color: m.done ? '#475569' : '#e2e8f0' }}>{m.label}</div>
                      <div style={{ fontSize: 11, color: '#475569' }}>{formatDate(m.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
              {allPast && (
                <div style={{
                  marginTop: 10, padding: '6px 10px', borderRadius: 6,
                  background: '#78350f33', border: '1px solid #92400e',
                  fontSize: 11, color: '#fbbf24',
                }}>
                  All milestones passed. Switch to <strong>Custom</strong> to continue follow-ups.
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>
            Follow up every{' '}
            <strong style={{ color: '#e2e8f0' }}>{formatDays(customIntervalDays)}</strong>
            {' '}after last contact
          </div>

          <input
            type="range" min={1} max={180} value={customIntervalDays}
            onChange={(e) => onChange(mode, Number(e.target.value))}
            style={{ width: '100%', accentColor: '#3b82f6', marginBottom: 4 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#334155', marginBottom: 10 }}>
            <span>1d</span><span>1w</span><span>1m</span><span>3m</span><span>6m</span>
          </div>

          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {PRESET_DAYS.map((d) => (
              <button
                key={d}
                onClick={() => onChange(mode, d)}
                style={{
                  padding: '3px 9px', borderRadius: 12, fontSize: 11, cursor: 'pointer',
                  border: `1px solid ${customIntervalDays === d ? '#3b82f6' : '#1e293b'}`,
                  background: customIntervalDays === d ? '#1d4ed8' : '#1e293b',
                  color: customIntervalDays === d ? '#fff' : '#64748b',
                }}
              >
                {formatDays(d)}
              </button>
            ))}
          </div>

          {nextCustom && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#64748b' }}>
              Next follow-up: <span style={{ color: '#94a3b8' }}>{formatDate(nextCustom)}</span>
            </div>
          )}
          {!lastContact && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#475569' }}>
              Set a last contact date to see next follow-up.
            </div>
          )}
        </div>
      )}
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

function contactIcon(method: ContactMethod) {
  if (method === 'email') return <Mail size={13} />
  if (method === 'phone') return <Phone size={13} />
  return <ExternalLink size={13} />
}

function ContactLink({ method, value }: { method: ContactMethod; value: string }) {
  if (!value.trim()) return null
  const url = buildContactUrl(method, value)
  if (!url) return null
  return (
    <button
      onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
      title={value}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 12px',
        background: 'rgba(59, 130, 246, 0.08)',
        border: '1px solid rgba(147, 197, 253, 0.2)',
        borderRadius: 20,
        color: '#93c5fd',
        fontSize: 12,
        cursor: 'pointer',
        maxWidth: '100%',
        overflow: 'hidden',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.16)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.08)')}
    >
      {contactIcon(method)}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </span>
    </button>
  )
}
