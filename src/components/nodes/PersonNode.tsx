import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { PersonData, PersonNode } from '../../types'
import { getFollowUpStatus, formatDate, computeNextFollowUp } from '../../utils/dateHelpers'

const handleStyle = {
  width: 8, height: 8,
  background: 'rgba(147,197,253,0.5)',
  border: '1px solid rgba(147,197,253,0.8)',
  borderRadius: '50%',
}

const STATUS_GLOW: Record<string, { glow: string; ring: string }> = {
  overdue: { glow: '#ef4444', ring: '#ef444466' },
  soon:    { glow: '#f59e0b', ring: '#f59e0b66' },
  ok:      { glow: '#06b6d4', ring: '#06b6d466' },
  none:    { glow: '#93c5fd', ring: '#93c5fd44' },
}

// Stellar color sequence: hot/recent → cool/neglected (every 30 days)
// A-type spectral white → F/G yellow-white → G yellow → K orange → M-giant pink → nebula pink → M-dwarf red
const STAR_COLORS = [
  '#f0f0fa', // 0d   spectral white  (SpaceX starlight, A-type ~7500K)
  '#fff4ea', // 30d  yellow-white    (F/G-type, solar neighbourhood)
  '#ffd27d', // 60d  warm yellow     (G-type, like our Sun)
  '#ffad51', // 90d  orange          (K-type giant)
  '#ff8b8b', // 120d pink blush      (M-giant, cooler envelope)
  '#ff4d7f', // 150d nebula pink     (hydrogen-alpha emission, Wolf-Rayet)
  '#cc1a2e', // 180d deep red        (M-dwarf, cold/neglected)
]

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`
}

function recencyCore(lastContact: string, connectedDate: string): string {
  const dateStr = lastContact || connectedDate
  if (!dateStr) return STAR_COLORS[0]
  const last = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.max(0, (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
  const steps = STAR_COLORS.length - 1
  const scaled = Math.min(steps, (days / 180) * steps)
  const i = Math.min(steps - 1, Math.floor(scaled))
  return lerpColor(STAR_COLORS[i], STAR_COLORS[i + 1], scaled - i)
}

export function PersonNodeComponent({ data, selected }: NodeProps<PersonNode>) {
  const d = data as unknown as PersonData

  const edgeCount = (data as unknown as { edgeCount?: number }).edgeCount ?? 0
  const interactionCount = d.interactionCount ?? 0
  const baseSize = 10 + Math.min(14, Math.log1p(edgeCount + interactionCount) * 5)
  const coreSize = selected ? baseSize + 4 : baseSize

  const effectiveNextFollowUp = d.followUpMode && d.connectedDate
    ? computeNextFollowUp(d.connectedDate, d.lastContact, d.followUpMode, d.customIntervalDays ?? 30)
    : d.nextFollowUp

  const status = getFollowUpStatus(effectiveNextFollowUp)
  const colors = STATUS_GLOW[status]
  const coreColor = recencyCore(d.lastContact, d.connectedDate)
  const needsCustom = d.followUpMode === 'auto' && d.connectedDate && !effectiveNextFollowUp

  const glowSize = selected ? `0 0 ${coreSize}px 4px` : `0 0 ${Math.round(coreSize * 0.6)}px 2px`
  const needsContact = d.reminderNote?.toUpperCase().includes('CONTACT')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120 }}>
      <Handle type="source" position={Position.Top}    style={handleStyle} />
      <Handle type="source" position={Position.Left}   style={handleStyle} />
      <Handle type="source" position={Position.Bottom} style={handleStyle} />
      <Handle type="source" position={Position.Right}  style={handleStyle} />

      {/* Star core */}
      <div style={{
        width: coreSize,
        height: coreSize,
        borderRadius: '50%',
        background: coreColor,
        boxShadow: [
          `${glowSize} ${colors.glow}`,
          `0 0 40px 18px ${colors.glow}99`,
          selected ? `0 0 60px 28px ${colors.glow}66` : '',
          needsContact ? '0 0 0 3px #facc15, 0 0 20px 6px #facc1588' : '',
        ].filter(Boolean).join(', '),
        transition: 'all 0.2s ease',
        animation: 'starPulse 3s ease-in-out infinite',
        flexShrink: 0,
      }} />

      {/* Label card */}
      <div style={{
        marginTop: 8,
        background: needsContact ? 'rgba(30, 20, 0, 0.85)' : 'rgba(2, 4, 9, 0.72)',
        border: needsContact ? '1px solid rgba(250,204,21,0.7)' : `1px solid ${selected ? colors.glow + '88' : 'rgba(147, 197, 253, 0.1)'}`,
        boxShadow: needsContact ? '0 0 12px 2px rgba(250,204,21,0.25)' : undefined,
        borderRadius: 8,
        padding: '6px 10px',
        textAlign: 'center',
        backdropFilter: 'blur(6px)',
        transition: 'border-color 0.2s',
        minWidth: 110,
      }}>
        <div style={{ color: needsContact ? '#fef08a' : '#f1f5f9', fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{d.name}</div>
        {needsContact && (
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
            marginTop: 3, display: 'inline-block',
            padding: '1px 7px', borderRadius: 10,
            background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.5)',
            color: '#facc15',
          }}>CONTACT</div>
        )}

        {d.contactCategory === 'personal' && d.relationship ? (
          <div style={{
            fontSize: 10, marginTop: 3, display: 'inline-block',
            padding: '1px 7px', borderRadius: 10,
            background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)',
            color: '#c4b5fd',
          }}>{d.relationship}</div>
        ) : d.company ? (
          <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{d.company}</div>
        ) : null}

        {effectiveNextFollowUp && (
          <div style={{
            marginTop: 5,
            fontSize: 10,
            padding: '2px 7px',
            borderRadius: 10,
            display: 'inline-block',
            background: colors.ring,
            color: '#f1f5f9',
            border: `1px solid ${colors.glow}44`,
          }}>
            {status === 'overdue' ? '⚠' : status === 'soon' ? '⏰' : '✦'}{' '}
            {formatDate(effectiveNextFollowUp)}
          </div>
        )}

        {needsCustom && (
          <div style={{
            marginTop: 5, fontSize: 10, padding: '2px 7px', borderRadius: 10,
            display: 'inline-block',
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}>
            ⚡ set schedule
          </div>
        )}
      </div>
    </div>
  )
}
