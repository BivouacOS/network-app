import { useMemo } from 'react'
import { useNetworkStore } from '../store/networkStore'
import type { PersonData } from '../types'
import { getFollowUpStatus, formatDate, computeNextFollowUp } from '../utils/dateHelpers'
import { statusColors } from '../utils/dateHelpers'

// Same stellar color logic as PersonNode
const STAR_COLORS = ['#f0f0fa','#fff4ea','#ffd27d','#ffad51','#ff8b8b','#ff4d7f','#cc1a2e']

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`
}

function recencyColor(lastContact: string, connectedDate: string): string {
  const dateStr = lastContact || connectedDate
  if (!dateStr) return STAR_COLORS[0]
  const last = new Date(dateStr + 'T00:00:00')
  const today = new Date(); today.setHours(0,0,0,0)
  const days = Math.max(0, (today.getTime() - last.getTime()) / 86400000)
  const steps = STAR_COLORS.length - 1
  const scaled = Math.min(steps, (days / 180) * steps)
  const i = Math.min(steps - 1, Math.floor(scaled))
  return lerpColor(STAR_COLORS[i], STAR_COLORS[i + 1], scaled - i)
}

function dateValue(d: PersonData): number {
  const s = d.lastContact || d.connectedDate
  if (!s) return 0
  return new Date(s + 'T00:00:00').getTime()
}

interface Props {
  onSelectNode: (id: string) => void
  searchQuery?: string
}

export function ListView({ onSelectNode, searchQuery }: Props) {
  const { nodes, edges } = useNetworkStore()

  const rows = useMemo(() => {
    const lq = (searchQuery ?? '').toLowerCase()
    const people = nodes.filter(n => n.type === 'person')
    const filtered = lq
      ? people.filter(n => (n.data as unknown as PersonData).name.toLowerCase().includes(lq))
      : people
    const sorted = [...filtered].sort((a, b) => {
      const da = a.data as unknown as PersonData
      const db = b.data as unknown as PersonData
      return dateValue(db) - dateValue(da)
    })
    return sorted.map(n => {
      const d = n.data as unknown as PersonData
      const connCount = edges.filter(e => e.source === n.id || e.target === n.id).length
      const followUp = computeNextFollowUp(d.connectedDate, d.lastContact, d.followUpMode || 'auto', d.customIntervalDays ?? 30)
      const status = getFollowUpStatus(followUp)
      const colors = statusColors(status)
      const starColor = recencyColor(d.lastContact, d.connectedDate)
      return { id: n.id, d, connCount, followUp, status, colors, starColor }
    })
  }, [nodes, edges, searchQuery])

  if (rows.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(147,197,253,0.2)', fontSize: 14 }}>No contacts yet</p>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '28px 1fr 140px 130px 110px 60px',
        gap: 12,
        padding: '6px 14px 8px',
        borderBottom: '1px solid rgba(147,197,253,0.1)',
        marginBottom: 4,
      }}>
        {['', 'Name', 'Company / Relationship', 'Last Contact', 'Follow-up', 'Links'].map((h, i) => (
          <span key={i} style={{ color: 'rgba(147,197,253,0.3)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {h}
          </span>
        ))}
      </div>

      {rows.map(({ id, d, connCount, followUp, status, colors, starColor }) => (
        <button
          key={id}
          onClick={() => onSelectNode(id)}
          style={{
            display: 'grid',
            gridTemplateColumns: '28px 1fr 140px 130px 110px 60px',
            gap: 12,
            width: '100%',
            padding: '10px 14px',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(147,197,253,0.05)',
            cursor: 'pointer',
            textAlign: 'left',
            alignItems: 'center',
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(147,197,253,0.04)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {/* Star dot */}
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            background: starColor,
            boxShadow: `0 0 6px 2px ${starColor}88`,
            display: 'inline-block', flexShrink: 0,
          }} />

          {/* Name + location */}
          <span>
            <div style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600 }}>{d.name}</div>
            {d.location && <div style={{ color: '#475569', fontSize: 11, marginTop: 1 }}>{d.location}</div>}
          </span>

          {/* Company or relationship */}
          <span>
            {d.contactCategory === 'personal' && d.relationship ? (
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 10,
                background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)',
                color: '#c4b5fd',
              }}>{d.relationship}</span>
            ) : d.company ? (
              <span style={{ color: '#64748b', fontSize: 12 }}>{d.company}</span>
            ) : (
              <span style={{ color: '#334155', fontSize: 12 }}>—</span>
            )}
          </span>

          {/* Last contact */}
          <span style={{ color: d.lastContact ? '#94a3b8' : '#334155', fontSize: 12 }}>
            {d.lastContact ? formatDate(d.lastContact) : '—'}
          </span>

          {/* Follow-up badge */}
          <span>
            {followUp ? (
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 10,
                background: colors.bg, color: status === 'overdue' ? '#fca5a5' : status === 'soon' ? '#fde68a' : '#a5f3fc',
                border: `1px solid ${colors.border}44`,
              }}>
                {status === 'overdue' ? '⚠ ' : status === 'soon' ? '⏰ ' : '✦ '}{formatDate(followUp)}
              </span>
            ) : (
              <span style={{ color: '#334155', fontSize: 12 }}>—</span>
            )}
          </span>

          {/* Connection count */}
          <span style={{ color: connCount > 0 ? '#64748b' : '#334155', fontSize: 12, textAlign: 'center' }}>
            {connCount > 0 ? connCount : '—'}
          </span>
        </button>
      ))}
    </div>
  )
}
